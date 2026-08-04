from typing import List

CLASS_WEIGHTS = {
    "Pothole": 0.40,
    "D40": 0.40,
    "Alligator Crack": 0.35,
    "D20": 0.35,
    "Transverse Crack": 0.25,
    "Edge Crack": 0.25,
    "D10": 0.25,
    "Longitudinal Crack": 0.20,
    "D00": 0.20,
    "Patching": 0.15,
}

def compute_item_severity(damage_class: str, bbox: List[float], img_width: int, img_height: int, confidence: float) -> str:
    """
    Compute severity based on:
    1. Damage class
    2. Bounding box area
    3. Relative road coverage
    4. Detection confidence
    """
    if img_width <= 0 or img_height <= 0:
        return "Low"

    x1, y1, x2, y2 = bbox
    box_w = max(0, x2 - x1)
    box_h = max(0, y2 - y1)
    box_area = box_w * box_h
    img_area = img_width * img_height
    
    # 1. Damage class weight
    c_weight = CLASS_WEIGHTS.get(damage_class, 0.25)

    # 2. Relative road coverage factor (scaled 0.0 - 1.0)
    coverage_ratio = box_area / img_area
    coverage_factor = min(coverage_ratio * 12.0, 1.0)

    # 3. Score calculation
    severity_score = (c_weight * 0.4) + (coverage_factor * 0.4) + (confidence * 0.2)

    # 4. Map score to qualitative category
    if severity_score >= 0.65:
        return "Critical"
    elif severity_score >= 0.48:
        return "High"
    elif severity_score >= 0.32:
        return "Medium"
    else:
        return "Low"

def compute_overall_severity(severities: List[str]) -> str:
    """Determine highest overall severity across detected items."""
    if "Critical" in severities:
        return "Critical"
    if "High" in severities:
        return "High"
    if "Medium" in severities:
        return "Medium"
    if "Low" in severities:
        return "Low"
    return "None"
