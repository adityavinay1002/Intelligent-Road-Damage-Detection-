import os
import cv2
import json
import time
import uuid
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Tuple, Callable, Union
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from backend.app.detection.yolo_detector import YOLO11Detector
from backend.app.detection.roboflow_detector import RoboflowDetector
from backend.app.detection.annotator import annotate_image
from backend.app.detection.severity import compute_overall_severity
from backend.app.detection.tiling import tiled_detect
from backend.app.detection.recommendations import get_repair_recommendation
from backend.app.database.models import DetectionRecord, DamageItem
from backend.app.utils.file_utils import generate_file_paths, get_evidence_path, normalize_path
from backend.app.utils.image_utils import crop_and_save_evidence
from backend.app.utils.geocoding import extract_exif_gps, reverse_geocode
from backend.app.utils.logging_config import logger

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_path = ROOT_DIR / ".env"
backend_env_path = ROOT_DIR / "backend" / ".env"

def load_project_env():
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    if backend_env_path.exists():
        load_dotenv(dotenv_path=backend_env_path, override=True)
    load_dotenv(override=False)

load_project_env()

# Global detector instance
detector_instance = None

def get_detector() -> Union[RoboflowDetector, YOLO11Detector]:
    """
    Returns active object detection engine instance.
    Defaults to hosted RoboflowDetector if ROBOFLOW_API_KEY is configured.
    Falls back seamlessly to local YOLO11Detector if ROBOFLOW_API_KEY is not set or USE_LOCAL_YOLO=true.
    """
    global detector_instance
    if detector_instance is None:
        load_project_env()

        use_local = os.getenv("USE_LOCAL_YOLO", "false").lower() in ("true", "1")
        rf_key = os.getenv("ROBOFLOW_API_KEY", "")

        if not use_local and rf_key and rf_key != "YOUR_API_KEY":
            logger.info(f"Initializing hosted Roboflow Detector ({os.getenv('ROBOFLOW_MODEL_ID', 'road-damage-det/2')})...")
            detector_instance = RoboflowDetector()
        else:
            logger.info("Initializing local YOLO11 Detector...")
            detector_instance = YOLO11Detector()

    return detector_instance

def process_single_image(
    file_bytes: bytes,
    filename: str,
    db: Session,
    conf_threshold: float = 0.25,
    road_name: str = "Highway Sector A-1"
) -> DetectionRecord:
    """
    Enhanced Image Processing Pipeline:
    1. Extract EXIF GPS metadata & perform reverse geocoding if present.
    2. Run object detection engine (Roboflow hosted API or local YOLO).
    3. Annotate image preserving original resolution and maximum quality.
    4. Save high-resolution PNG evidence crops.
    5. Generate damage repair recommendations.
    6. Store full detection record and item inventory in SQLite DB.
    """
    start_time = time.time()
    detector = get_detector()
    detection_id, upload_path, output_path = generate_file_paths(filename)

    # 1. Save uploaded file at original resolution
    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    # 2. Extract GPS EXIF Metadata & Reverse Geocode
    lat, lon = extract_exif_gps(file_bytes)
    city, state, country, location_str = None, None, None, None
    geo_road_name = None

    if lat is not None and lon is not None:
        geo_road_name, city, state, country, location_str = reverse_geocode(lat, lon)
        if geo_road_name:
            road_name = geo_road_name
    
    # 3. Decode image array
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image file format")

    # 4. Run detection — tiled for high resolution images, direct for small ones
    detections = tiled_detect(
        image,
        detector_fn=detector.detect,
        conf_threshold=conf_threshold,
        tile_size=640,
        overlap=0.20,
    )

    # 5. Annotate image at full resolution
    annotated_img = annotate_image(image, detections)
    cv2.imwrite(str(output_path), annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 95])

    # 6. Calculate summary metrics
    severities = [d["severity"] for d in detections]
    overall_sev = compute_overall_severity(severities)
    
    avg_conf = (
        round(float(sum(d["confidence"] for d in detections) / len(detections)), 4)
        if detections else 0.0
    )
    
    inference_time_ms = round((time.time() - start_time) * 1000.0, 2)
    
    model_ver = getattr(detector, "model_id", "Roboflow Hosted Model (road-damage-det/2)")
    if hasattr(detector, "workspace_name") and getattr(detector, "workspace_name"):
        model_ver = f"roboflow:{getattr(detector, 'workspace_name')}/{model_ver}"

    # Calculate relative paths for static URL serving
    APP_DIR = Path(__file__).resolve().parent.parent
    rel_upload_path = normalize_path(upload_path.relative_to(APP_DIR).as_posix())
    rel_output_path = normalize_path(output_path.relative_to(APP_DIR).as_posix())

    # 7. Create DB Record
    record = DetectionRecord(
        detection_id=detection_id,
        media_type="image",
        source_path=rel_upload_path,
        annotated_output_path=rel_output_path,
        timestamp=datetime.utcnow(),
        image_filename=filename,
        road_name=road_name,
        total_defects=len(detections),
        avg_confidence=avg_conf,
        overall_severity=overall_sev,
        highest_severity=overall_sev,
        latitude=lat,
        longitude=lon,
        location=location_str,
        city=city,
        state=state,
        country=country,
        model_version=model_ver,
        inference_time_ms=inference_time_ms
    )
    db.add(record)

    # 8. Process and add individual damage items with high-res PNG crops
    for idx, det in enumerate(detections):
        ev_path = get_evidence_path(detection_id, idx + 1)
        crop_and_save_evidence(image, det["bbox"], ev_path)
        rel_ev_path = normalize_path(ev_path.relative_to(APP_DIR).as_posix())

        rec_info = get_repair_recommendation(det["damage_class"])
        rec_text = f"{rec_info['action']} {rec_info['risk']} [{rec_info['priority']}]"

        item = DamageItem(
            detection_id=detection_id,
            damage_class=det["damage_class"],
            confidence_score=det["confidence"],
            severity=det["severity"],
            bbox_coordinates=json.dumps(det["bbox"]),
            timestamp=datetime.utcnow(),
            source_media=rel_upload_path,
            evidence_image_path=rel_ev_path,
            recommendation=rec_text
        )
        db.add(item)

    db.commit()
    db.refresh(record)
    return record

def process_video_file(
    file_bytes: bytes,
    filename: str,
    db: Session,
    conf_threshold: float = 0.25,
    road_name: str = "Highway Sector A-1",
    progress_callback: Callable[[float], None] = None
) -> DetectionRecord:
    """
    Video Processing Pipeline:
    1. Save video file to uploads/.
    2. Process frame-by-frame using OpenCV & Roboflow/YOLO detector.
    3. Generate annotated MP4 output video.
    4. Save key frame evidence snapshots and log all detections in database.
    """
    start_time = time.time()
    detector = get_detector()
    detection_id, upload_path, output_path = generate_file_paths(filename)
    output_video_path = output_path.with_suffix(".mp4")

    # Save uploaded video file
    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    cap = cv2.VideoCapture(str(upload_path))
    if not cap.isOpened():
        raise ValueError("Could not open input video file")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(str(output_video_path), fourcc, fps, (width, height))

    all_detections = []
    severities = []
    confidences = []
    frame_idx = 0
    evidence_saved = 0

    APP_DIR = Path(__file__).resolve().parent.parent
    rel_upload_path = normalize_path(upload_path.relative_to(APP_DIR).as_posix())
    rel_output_video_path = normalize_path(output_video_path.relative_to(APP_DIR).as_posix())

    model_ver = getattr(detector, "model_id", "Roboflow Hosted Model (road-damage-det/2)")

    record = DetectionRecord(
        detection_id=detection_id,
        media_type="video",
        source_path=rel_upload_path,
        annotated_output_path=rel_output_video_path,
        timestamp=datetime.utcnow(),
        image_filename=filename,
        road_name=road_name,
        total_defects=0,
        avg_confidence=0.0,
        overall_severity="Low",
        highest_severity="Low",
        model_version=str(model_ver)
    )
    db.add(record)

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        # Run detection on sampled frames for video processing
        if frame_idx % 3 == 0 or frame_idx == 1:
            dets = detector.detect(frame, conf_threshold=conf_threshold)
            annotated_frame = annotate_image(frame, dets)

            for det in dets:
                severities.append(det["severity"])
                confidences.append(det["confidence"])
                all_detections.append(det)

                # Save top representative evidence crops (up to 15 per video)
                if evidence_saved < 15:
                    evidence_saved += 1
                    ev_path = get_evidence_path(detection_id, evidence_saved)
                    crop_and_save_evidence(frame, det["bbox"], ev_path)
                    rel_ev_path = normalize_path(ev_path.relative_to(APP_DIR).as_posix())

                    rec_info = get_repair_recommendation(det["damage_class"])
                    rec_text = f"{rec_info['action']} {rec_info['risk']} [{rec_info['priority']}]"

                    item = DamageItem(
                        detection_id=detection_id,
                        damage_class=det["damage_class"],
                        confidence_score=det["confidence"],
                        severity=det["severity"],
                        bbox_coordinates=json.dumps(det["bbox"]),
                        timestamp=datetime.utcnow(),
                        source_media=rel_upload_path,
                        evidence_image_path=rel_ev_path,
                        recommendation=rec_text
                    )
                    db.add(item)
        else:
            annotated_frame = frame

        out.write(annotated_frame)

        if progress_callback and total_frames > 0:
            progress_callback(min(frame_idx / total_frames, 1.0))

    cap.release()
    out.release()

    overall_sev = compute_overall_severity(severities)
    avg_conf = round(float(sum(confidences) / len(confidences)), 4) if confidences else 0.0
    inference_time_ms = round((time.time() - start_time) * 1000.0, 2)

    record.total_defects = len(all_detections)
    record.overall_severity = overall_sev
    record.highest_severity = overall_sev
    record.avg_confidence = avg_conf
    record.inference_time_ms = inference_time_ms

    db.commit()
    db.refresh(record)
    return record
