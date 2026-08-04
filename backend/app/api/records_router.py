from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.database.models import DetectionRecord
from backend.app.models.schemas import DetectionRecordSchema

router = APIRouter(prefix="/api/records", tags=["Records & History"])

@router.get("", response_model=List[DetectionRecordSchema])
def get_records(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    severity: Optional[str] = None,
    media_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(DetectionRecord)
    if severity:
        query = query.filter(DetectionRecord.overall_severity == severity)
    if media_type:
        query = query.filter(DetectionRecord.media_type == media_type)

    records = query.order_by(DetectionRecord.timestamp.desc()).offset(offset).limit(limit).all()
    return records

@router.get("/{detection_id}", response_model=DetectionRecordSchema)
def get_record_detail(detection_id: str, db: Session = Depends(get_db)):
    record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == detection_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Detection record not found")
    return record

@router.delete("/{detection_id}")
def delete_record(detection_id: str, db: Session = Depends(get_db)):
    record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == detection_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Detection record not found")
    db.delete(record)
    db.commit()
    return {"message": "Record deleted successfully", "detection_id": detection_id}
