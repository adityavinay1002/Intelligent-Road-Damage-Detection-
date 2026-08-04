import json
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, field_validator

class DamageItemSchema(BaseModel):
    id: Optional[int] = None
    detection_id: str
    damage_class: str
    confidence_score: float
    severity: str
    bbox_coordinates: List[float]
    timestamp: datetime
    source_media: str
    evidence_image_path: str

    @field_validator('bbox_coordinates', mode='before')
    def parse_bbox_coordinates(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    class Config:
        from_attributes = True

class DetectionRecordSchema(BaseModel):
    detection_id: str
    media_type: str
    source_path: str
    annotated_output_path: Optional[str] = None
    timestamp: datetime
    road_name: str
    total_defects: int
    overall_severity: str
    damage_items: List[DamageItemSchema] = []

    class Config:
        from_attributes = True

class DetectionSummaryResponse(BaseModel):
    message: str
    record: DetectionRecordSchema

class StatsOverviewResponse(BaseModel):
    total_detections: int
    damage_type_distribution: dict
    severity_distribution: dict
    monthly_trends: List[dict]
    road_wise_stats: List[dict]
