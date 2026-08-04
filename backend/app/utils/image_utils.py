import cv2
import numpy as np
from pathlib import Path
from typing import List, Optional

def crop_and_save_evidence(image: np.ndarray, bbox: List[float], save_path: Path) -> str:
    """Crop bounding box region from image and save as evidence snapshot."""
    if image is None or image.size == 0:
        return ""

    h, w = image.shape[:2]
    x1, y1, x2, y2 = map(int, bbox)

    x1 = max(0, min(x1, w - 1))
    y1 = max(0, min(y1, h - 1))
    x2 = max(x1 + 1, min(x2, w))
    y2 = max(y1 + 1, min(y2, h))

    crop = image[y1:y2, x1:x2]
    if crop.size > 0:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(save_path), crop)
        return str(save_path.as_posix())
    return ""
