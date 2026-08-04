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
) -> np.ndarray:
    """
    Annotate high-resolution image with sharp bounding boxes, class names, confidence scores,
    and color-coded severity indicators. Preserves exact image dimensions and quality.
    """
    if image is None or image.size == 0:
        return image

    annotated = image.copy()
    h, w = annotated.shape[:2]

    # Adaptive font scale and stroke thickness based on image resolution
    scale_factor = max(w, h) / 1200.0
    font_scale = max(0.45, min(1.0, 0.55 * scale_factor))
    box_thickness = max(2, int(2.5 * scale_factor))
    text_thickness = max(1, int(1.5 * scale_factor))

    for idx, det in enumerate(detections):
        bbox = det["bbox"] # [x1, y1, x2, y2]
        damage_class = det["damage_class"]
        confidence = det["confidence"]
        severity = det["severity"]

        x1, y1, x2, y2 = map(int, bbox)
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(w, x2), min(h, y2)
        color = SEVERITY_COLORS.get(severity, (0, 255, 0))

        if show_boxes:
            if "points" in det and det["points"]:
                try:
                    pts = np.array([[int(p['x'] if isinstance(p, dict) else p[0]), int(p['y'] if isinstance(p, dict) else p[1])] for p in det["points"]], np.int32)
                    pts = pts.reshape((-1, 1, 2))
                    cv2.polylines(annotated, [pts], isClosed=True, color=color, thickness=box_thickness, lineType=cv2.LINE_AA)
                except Exception:
                    pass
            # Main sharp bounding box
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, box_thickness, lineType=cv2.LINE_AA)

        if show_labels:
            label_text = f"{damage_class} | {confidence:.2f} | {severity}"
            (text_w, text_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_thickness)
            
            # Label background box
            lbl_y1 = max(0, y1 - text_h - 10)
            lbl_y2 = max(text_h + 10, y1)
            cv2.rectangle(annotated, (x1, lbl_y1), (x1 + text_w + 10, lbl_y2), color, -1)

            # Contrast text (white or black depending on severity background)
            text_color = (255, 255, 255)
            if severity == "Medium":
                text_color = (0, 0, 0) # Black text on yellow background for legibility

            cv2.putText(
                annotated,
                label_text,
                (x1 + 5, max(text_h + 4, y1 - 4)),
                cv2.FONT_HERSHEY_SIMPLEX,
                font_scale,
                text_color,
                text_thickness,
                lineType=cv2.LINE_AA
            )

    return annotated
