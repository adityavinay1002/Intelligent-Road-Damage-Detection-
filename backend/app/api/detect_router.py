from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.services.detection_service import process_single_image, process_video_file
from backend.app.models.schemas import DetectionRecordSchema

router = APIRouter(prefix="/api/detect", tags=["Detection Studio"])

@router.post("/image", response_model=List[DetectionRecordSchema])
async def detect_images(
    files: List[UploadFile] = File(...),
    conf_threshold: float = Form(0.25),
    road_name: str = Form("Highway Sector A-1"),
    db: Session = Depends(get_db)
):
    """
    Detection Studio API - Process single or multiple image uploads.
    - Runs YOLO11 detection once per image.
    - Generates annotated output.
    - Stores detection record and damage items in SQLite DB.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No media files uploaded")

    records = []
    for file in files:
        contents = await file.read()
        filename = file.filename or "uploaded_image.jpg"

        try:
            record = process_single_image(
                file_bytes=contents,
                filename=filename,
                db=db,
                conf_threshold=conf_threshold,
                road_name=road_name
            )
            records.append(record)
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Failed to process image {filename}: {str(e)}")

    return records

@router.post("/video", response_model=DetectionRecordSchema)
async def detect_video(
    file: UploadFile = File(...),
    conf_threshold: float = Form(0.25),
    road_name: str = Form("Highway Sector A-1"),
    db: Session = Depends(get_db)
):
    """
    Detection Studio API - Process video file upload.
    - Processes frame-by-frame.
    - Generates annotated video.
    - Stores all detections and evidence crops in SQLite DB.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No video file uploaded")

    contents = await file.read()
    filename = file.filename or "uploaded_video.mp4"

    try:
        record = process_video_file(
            file_bytes=contents,
            filename=filename,
            db=db,
            conf_threshold=conf_threshold,
            road_name=road_name
        )
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process video {filename}: {str(e)}")
