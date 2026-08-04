import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict

SEVERITY_COLORS = {
    "Critical": (0, 0, 255),    # Red (BGR)
    "High": (0, 140, 255),      # Orange
    "Medium": (0, 255, 255),    # Yellow
    "Low": (0, 255, 0),         # Green
}

def annotate_image(
    image: np.ndarray,
    detections: List[Dict],
    show_boxes: bool = True,
    show_labels: bool = True
) -> Tuple[np.ndarray, List[str]]:
    """
    Annotate image with bounding boxes, class names, confidence scores, and severity indicators.
    Returns annotated image and list of generated evidence image paths.
    """
    annotated = image.copy()
    evidence_paths = []

    for idx, det in enumerate(detections):
        bbox = det["bbox"] # [x1, y1, x2, y2]
        damage_class = det["damage_class"]
        confidence = det["confidence"]
        severity = det["severity"]

        x1, y1, x2, y2 = map(int, bbox)
        color = SEVERITY_COLORS.get(severity, (0, 255, 0))

        if show_boxes:
            if "points" in det and det["points"]:
                try:
                    pts = np.array([[int(p['x'] if isinstance(p, dict) else p[0]), int(p['y'] if isinstance(p, dict) else p[1])] for p in det["points"]], np.int32)
                    pts = pts.reshape((-1, 1, 2))
                    cv2.polylines(annotated, [pts], isClosed=True, color=color, thickness=2)
                except Exception:
                    pass
            # Main bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 3)

        if show_labels:
            label_text = f"{damage_class} | {confidence:.2f} | {severity}"
            (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            
            # Label background box
            cv2.rectangle(annotated, (x1, max(0, y1 - text_h - 8)), (x1 + text_w + 6, max(text_h + 8, y1)), color, -1)
            # Label text
            cv2.putText(
                annotated,
                label_text,
                (x1 + 3, max(text_h + 2, y1 - 4)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 255),
                2,
                cv2.LINE_AA
            )

    return annotated
