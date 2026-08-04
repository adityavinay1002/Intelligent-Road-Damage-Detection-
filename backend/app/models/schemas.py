import json
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, field_validator
from backend.app.utils.file_utils import normalize_path

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
    recommendation: Optional[str] = None

    @field_validator('bbox_coordinates', mode='before')
    def parse_bbox_coordinates(cls, v: Any) -> Any:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator('source_media', 'evidence_image_path', mode='before')
    def normalize_item_paths(cls, v: Any) -> Any:
        if isinstance(v, str):
            return normalize_path(v)
        return v

    class Config:
        from_attributes = True

class DetectionRecordSchema(BaseModel):
    detection_id: str
    media_type: str
    source_path: str
    annotated_output_path: Optional[str] = None
    timestamp: datetime
    
    image_filename: Optional[str] = None
    road_name: Optional[str] = None
    total_defects: int = 0
    avg_confidence: Optional[float] = None
    overall_severity: str = "Low"
    highest_severity: Optional[str] = None

    # Geolocation fields
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None

    # Model metadata
    model_version: Optional[str] = None
    inference_time_ms: Optional[float] = None

    damage_items: List[DamageItemSchema] = []

    @field_validator('source_path', 'annotated_output_path', mode='before')
    def normalize_record_paths(cls, v: Any) -> Any:
        if isinstance(v, str):
            return normalize_path(v)
        return v

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
