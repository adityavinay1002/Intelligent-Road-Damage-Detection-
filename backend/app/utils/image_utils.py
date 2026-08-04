import cv2
import numpy as np
from pathlib import Path
from typing import List, Optional
from backend.app.utils.logging_config import logger

def crop_and_save_evidence(image: np.ndarray, bbox: List[float], save_path: Path) -> str:
    """
    Crop bounding box region from original resolution image and save as high-resolution
    evidence snapshot (PNG for maximum crispness and zero loss).
    """
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
        # Use PNG format if filename ends with .png for lossless quality
        if save_path.suffix.lower() == ".png":
            cv2.imwrite(str(save_path), crop, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        else:
            cv2.imwrite(str(save_path), crop, [cv2.IMWRITE_JPEG_QUALITY, 95])
        return str(save_path.as_posix())
    
    return ""
