import os
import cv2
import json
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
from backend.app.database.models import DetectionRecord, DamageItem
from backend.app.utils.file_utils import generate_file_paths, get_evidence_path
from backend.app.utils.image_utils import crop_and_save_evidence

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
            print(f"[DETECTOR] Initializing hosted Roboflow Detector ({os.getenv('ROBOFLOW_MODEL_ID', 'road-damage-det/2')})...")
            detector_instance = RoboflowDetector()
        else:
            print("[DETECTOR] Initializing local YOLO11 Detector...")
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
    Image Processing Pipeline:
    1. Read and decode image file.
    2. Run object detection (Roboflow hosted API or local YOLO).
    3. Annotate image with boxes, scores, and severity tags.
    4. Save evidence crops.
    5. Save record and items to SQLite database.
    """
    detector = get_detector()
    detection_id, upload_path, output_path = generate_file_paths(filename)

    # Save uploaded file
    with open(upload_path, "wb") as f:
        f.write(file_bytes)

    # Decode image array
    np_arr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image file format")

    # Run detection
    detections = detector.detect(image, conf_threshold=conf_threshold)

    # Annotate image
    annotated_img = annotate_image(image, detections)
    cv2.imwrite(str(output_path), annotated_img)

    # Calculate overall severity
    severities = [d["severity"] for d in detections]
    overall_sev = compute_overall_severity(severities)

    # Calculate relative paths for static URL serving
    APP_DIR = Path(__file__).resolve().parent.parent
    rel_upload_path = upload_path.relative_to(APP_DIR).as_posix()
    rel_output_path = output_path.relative_to(APP_DIR).as_posix()

    # Create DB Record
    record = DetectionRecord(
        detection_id=detection_id,
        media_type="image",
        source_path=rel_upload_path,
        annotated_output_path=rel_output_path,
        timestamp=datetime.utcnow(),
        road_name=road_name,
        total_defects=len(detections),
        overall_severity=overall_sev
    )
    db.add(record)

    # Process and add individual damage items
    for idx, det in enumerate(detections):
        ev_path = get_evidence_path(detection_id, idx)
        crop_and_save_evidence(image, det["bbox"], ev_path)
        rel_ev_path = ev_path.relative_to(APP_DIR).as_posix()

        item = DamageItem(
            detection_id=detection_id,
            damage_class=det["damage_class"],
            confidence_score=det["confidence"],
            severity=det["severity"],
            bbox_coordinates=json.dumps(det["bbox"]),
            timestamp=datetime.utcnow(),
            source_media=rel_upload_path,
            evidence_image_path=rel_ev_path
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
    frame_idx = 0
    evidence_saved = 0

    APP_DIR = Path(__file__).resolve().parent.parent
    rel_upload_path = upload_path.relative_to(APP_DIR).as_posix()
    rel_output_video_path = output_video_path.relative_to(APP_DIR).as_posix()

    record = DetectionRecord(
        detection_id=detection_id,
        media_type="video",
        source_path=rel_upload_path,
        annotated_output_path=rel_output_video_path,
        timestamp=datetime.utcnow(),
        road_name=road_name,
        total_defects=0,
        overall_severity="Low"
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
                all_detections.append(det)

                # Save top representative evidence crops (up to 15 per video)
                if evidence_saved < 15:
                    evidence_saved += 1
                    ev_path = get_evidence_path(detection_id, evidence_saved)
                    crop_and_save_evidence(frame, det["bbox"], ev_path)
                    rel_ev_path = ev_path.relative_to(APP_DIR).as_posix()

                    item = DamageItem(
                        detection_id=detection_id,
                        damage_class=det["damage_class"],
                        confidence_score=det["confidence"],
                        severity=det["severity"],
                        bbox_coordinates=json.dumps(det["bbox"]),
                        timestamp=datetime.utcnow(),
                        source_media=rel_upload_path,
                        evidence_image_path=rel_ev_path
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
    record.total_defects = len(all_detections)
    record.overall_severity = overall_sev

    db.commit()
    db.refresh(record)
    return record
