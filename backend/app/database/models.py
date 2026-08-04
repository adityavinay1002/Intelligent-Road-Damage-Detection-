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
    
    image_filename = Column(String(255), nullable=True)
    road_name = Column(String(200), nullable=True)
    total_defects = Column(Integer, default=0)
    avg_confidence = Column(Float, nullable=True)
    overall_severity = Column(String(20), default="Low")
    highest_severity = Column(String(20), default="Low")

    # Automatic GPS & Reverse Geocoding fields
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)

    # Model & Execution metadata
    model_version = Column(String(100), default="Roboflow Hosted Model (road-damage-det/2)")
    inference_time_ms = Column(Float, nullable=True)

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
    recommendation = Column(Text, nullable=True)         # Automated repair recommendation

    record = relationship("DetectionRecord", back_populates="damage_items")
