import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from backend.app.database.database import Base

class DetectionRecord(Base):
    __tablename__ = "detection_records"

    detection_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    media_type = Column(String(20), nullable=False)  # "image" or "video"
    source_path = Column(String(500), nullable=False)  # Source image/video file path
    annotated_output_path = Column(String(500), nullable=True)  # Output annotated file path
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    road_name = Column(String(200), default="Highway Sector A-1")
    total_defects = Column(Integer, default=0)
    overall_severity = Column(String(20), default="Low")

    # Relationship to individual detected damage items
    damage_items = relationship("DamageItem", back_populates="record", cascade="all, delete-orphan")

class DamageItem(Base):
    __tablename__ = "damage_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    detection_id = Column(String(36), ForeignKey("detection_records.detection_id"), nullable=False)
    damage_class = Column(String(100), nullable=False)  # e.g., Pothole, Longitudinal Crack
    confidence_score = Column(Float, nullable=False)     # e.g., 0.94
    severity = Column(String(20), nullable=False)        # Low, Medium, High, Critical
    bbox_coordinates = Column(String(100), nullable=False) # JSON/string [x1, y1, x2, y2]
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    source_media = Column(String(500), nullable=False)    # Source Image/Video path
    evidence_image_path = Column(String(500), nullable=False) # Extracted crop image path

    record = relationship("DetectionRecord", back_populates="damage_items")
