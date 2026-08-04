"""
tiling.py — SAHI-style Sliced Inference for Wide-Angle Road Images
--------------------------------------------------------------------
When a road image is wide/panoramic, objects (potholes, cracks) occupy
very few pixels after the model resizes to 640×640. This module solves
that by:
  1. Slicing the image into overlapping 640×640 tiles.
  2. Running inference on each tile independently.
  3. Translating tile-local bounding boxes back to original image coords.
  4. Merging all detections with IoU-based NMS to eliminate duplicates.
"""

import numpy as np
from typing import List, Dict, Callable


# ---------------------------------------------------------------------------
# Tile Generation
# ---------------------------------------------------------------------------

def tile_image(
    image: np.ndarray,
    tile_size: int = 640,
    overlap: float = 0.20,
) -> List[Dict]:
    """
    Slice `image` into overlapping square tiles.

    Returns a list of dicts:
        {
            "tile": np.ndarray,   # cropped image slice
            "x_offset": int,      # pixel offset in original image (x)
            "y_offset": int,      # pixel offset in original image (y)
        }
    """
    h, w = image.shape[:2]
    stride = int(tile_size * (1.0 - overlap))
    stride = max(stride, 1)

    tiles = []
    y = 0
    while y < h:
        x = 0
        while x < w:
            x2 = min(x + tile_size, w)
            y2 = min(y + tile_size, h)
            x1 = max(0, x2 - tile_size)
            y1 = max(0, y2 - tile_size)

            tile = image[y1:y2, x1:x2]
            tiles.append({
                "tile": tile,
                "x_offset": x1,
                "y_offset": y1,
            })
            if x2 >= w:
                break
            x += stride
        if y2 >= h:
            break
        y += stride

    return tiles


# ---------------------------------------------------------------------------
# Coordinate translation
# ---------------------------------------------------------------------------

def translate_detections(
    detections: List[Dict],
    x_offset: int,
    y_offset: int,
) -> List[Dict]:
    """
    Translate tile-local bounding boxes to original image coordinates.
    """
    translated = []
    for det in detections:
        d = dict(det)
        x1, y1, x2, y2 = d["bbox"]
        d["bbox"] = [
            round(x1 + x_offset, 2),
            round(y1 + y_offset, 2),
            round(x2 + x_offset, 2),
            round(y2 + y_offset, 2),
        ]
        translated.append(d)
    return translated


# ---------------------------------------------------------------------------
# IoU & NMS
# ---------------------------------------------------------------------------

def _iou(box_a: List[float], box_b: List[float]) -> float:
    """Compute Intersection-over-Union for two [x1,y1,x2,y2] boxes."""
    ax1, ay1, ax2, ay2 = box_a
    bx1, by1, bx2, by2 = box_b

    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)

    inter_w = max(0, inter_x2 - inter_x1)
    inter_h = max(0, inter_y2 - inter_y1)
    inter_area = inter_w * inter_h

    area_a = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    area_b = max(0, bx2 - bx1) * max(0, by2 - by1)
    union_area = area_a + area_b - inter_area

    if union_area <= 0:
        return 0.0
    return inter_area / union_area


def nms_merge(
    detections: List[Dict],
    iou_threshold: float = 0.45,
) -> List[Dict]:
    """
    Remove duplicate detections across tiles using class-aware NMS.
    Keeps the detection with the highest confidence score.
    """
    if not detections:
        return []

    # Sort by confidence descending
    sorted_dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    kept = []

    while sorted_dets:
        best = sorted_dets.pop(0)
        kept.append(best)
        remaining = []
        for det in sorted_dets:
            # Only suppress same-class duplicates
            if det["damage_class"] == best["damage_class"]:
                iou = _iou(best["bbox"], det["bbox"])
                if iou >= iou_threshold:
                    continue  # suppress
            remaining.append(det)
        sorted_dets = remaining

    return kept


# ---------------------------------------------------------------------------
# Main tiled inference entry point
# ---------------------------------------------------------------------------

def tiled_detect(
    image: np.ndarray,
    detector_fn: Callable[[np.ndarray, float], List[Dict]],
    conf_threshold: float = 0.25,
    tile_size: int = 640,
    overlap: float = 0.20,
    iou_threshold: float = 0.45,
) -> List[Dict]:
    """
    Run tiled inference on `image` using `detector_fn`.

    For images smaller than tile_size, falls back to direct inference.

    Args:
        image:          Input BGR image as np.ndarray.
        detector_fn:    Callable(image, conf_threshold) -> List[Dict].
        conf_threshold: Confidence threshold passed to detector.
        tile_size:      Width/height of each tile in pixels (default 640).
        overlap:        Fraction overlap between adjacent tiles (default 0.20).
        iou_threshold:  IoU threshold for NMS duplicate suppression.

    Returns:
        Merged list of detection dicts with original-image coordinates.
    """
    h, w = image.shape[:2]

    # If image already fits in one tile, no tiling needed
    if h <= tile_size and w <= tile_size:
        return detector_fn(image, conf_threshold)

    tiles = tile_image(image, tile_size=tile_size, overlap=overlap)
    all_detections: List[Dict] = []

    for tile_info in tiles:
        tile = tile_info["tile"]
        x_off = tile_info["x_offset"]
        y_off = tile_info["y_offset"]

        tile_dets = detector_fn(tile, conf_threshold)
        translated = translate_detections(tile_dets, x_off, y_off)
        all_detections.extend(translated)

    # Merge via NMS
    merged = nms_merge(all_detections, iou_threshold=iou_threshold)
    return merged
