from typing import Dict, Tuple

DAMAGE_RECOMMENDATIONS: Dict[str, Dict[str, str]] = {
    "Pothole": {
        "action": "Immediate asphalt patch repair recommended.",
        "risk": "High safety hazard; severe risk to vehicle tires, wheels, and suspension.",
        "priority": "Priority Level 1 (Urgent)",
        "priority_num": "1"
    },
    "Alligator Crack": {
        "action": "Full-depth pavement patching or structural resurfacing required.",
        "risk": "Indicates subgrade fatigue; risk of rapid road base degradation.",
        "priority": "Priority Level 2 (High)",
        "priority_num": "2"
    },
    "Transverse Crack": {
        "action": "Hot-pour rubberized crack sealing recommended.",
        "risk": "Water ingress risk leading to freeze-thaw subgrade erosion.",
        "priority": "Priority Level 3 (Medium)",
        "priority_num": "3"
    },
    "Longitudinal Crack": {
        "action": "Clean, prep, and seal longitudinal joint cracks.",
        "risk": "Risk of moisture penetration along wheel paths.",
        "priority": "Priority Level 3 (Medium)",
        "priority_num": "3"
    },
    "Edge Crack": {
        "action": "Shoulder base stabilization and edge repair recommended.",
        "risk": "Unsupported pavement edges leading to structural breakaways.",
        "priority": "Priority Level 3 (Medium)",
        "priority_num": "3"
    },
    "Patching": {
        "action": "Routine inspection; verify seal integrity around patch edges.",
        "risk": "Low immediate risk; monitor for patch distress or settlement.",
        "priority": "Priority Level 4 (Routine)",
        "priority_num": "4"
    }
}

def get_repair_recommendation(damage_class: str) -> Dict[str, str]:
    """
    Returns automated repair recommendation, risk assessment, and priority level
    for a given damage class.
    """
    key = str(damage_class).strip()
    if key in DAMAGE_RECOMMENDATIONS:
        return DAMAGE_RECOMMENDATIONS[key]

    # Case-insensitive lookup
    for k, v in DAMAGE_RECOMMENDATIONS.items():
        if k.lower() == key.lower() or k.lower() in key.lower():
            return v

    return {
        "action": "Perform standard roadway inspection and preventative maintenance.",
        "risk": "Moderate risk of minor pavement distress expansion.",
        "priority": "Priority Level 3 (Medium)",
        "priority_num": "3"
    }
