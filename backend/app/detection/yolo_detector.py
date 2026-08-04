import os
from pathlib import Path
from typing import List, Dict, Tuple
import cv2
import numpy as np
from backend.app.detection.severity import compute_item_severity

CLASS_NAME_MAP = {
    0: "Longitudinal Crack",
    1: "Transverse Crack",
    2: "Alligator Crack",
    3: "Pothole",
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
    "pothole": "Pothole",
    "crack": "Longitudinal Crack",
}

class YOLO11Detector:
    """YOLO11 Road Damage Detection Engine"""

    def __init__(self, weights_path: str = None):
        self.model = None
        self.weights_path = self._resolve_weights_path(weights_path)
        self._load_model()

    def _resolve_weights_path(self, custom_path: str = None) -> str:
        if custom_path and Path(custom_path).exists():
            return str(Path(custom_path).absolute())

        # Check default best.pt location
        default_best = Path(__file__).resolve().parent.parent.parent / "trained_models" / "best.pt"
        if default_best.exists():
            print(f"[YOLO11] Found trained weights at: {default_best}")
            return str(default_best)

        # Temporary development fallback to official pretrained yolo11m.pt
        print("[YOLO11] Trained weights best.pt not found. Using pretrained yolo11m.pt for development.")
        return "yolo11m.pt"

    def _load_model(self):
        try:
            from ultralytics import YOLO
            self.model = YOLO(self.weights_path)
            print(f"[YOLO11] Successfully initialized model with weights: {self.weights_path}")
        except Exception as e:
            print(f"[ERROR] Failed to load YOLO11 model: {e}")
            self.model = None

    def detect(self, image: np.ndarray, conf_threshold: float = 0.25) -> List[Dict]:
        """
        Perform detection on a single BGR image array.
        Returns list of detection dicts with damage_class, bbox, confidence, and severity.
        No simulated detections are generated.
        """
        if self.model is None or image is None:
            return []

        h, w = image.shape[:2]
        results = self.model.predict(source=image, conf=conf_threshold, verbose=False)

        detections = []
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy().tolist()
                conf = float(box.conf[0].cpu().numpy())
                cls_id = int(box.cls[0].cpu().numpy())

                # Map class ID or name
                raw_name = self.model.names.get(cls_id, str(cls_id)) if hasattr(self.model, 'names') else str(cls_id)
                damage_class = CLASS_NAME_MAP.get(cls_id, CLASS_NAME_MAP.get(raw_name, raw_name))

                # Calculate item severity based on class, box area, road coverage, and confidence
                severity = compute_item_severity(
                    damage_class=damage_class,
                    bbox=xyxy,
                    img_width=w,
                    img_height=h,
                    confidence=conf
                )

                detections.append({
                    "damage_class": damage_class,
                    "confidence": round(conf, 4),
                    "bbox": [round(val, 2) for val in xyxy],
                    "severity": severity
                })

        return detections
