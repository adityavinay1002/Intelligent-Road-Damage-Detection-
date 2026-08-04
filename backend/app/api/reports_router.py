from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.reports.report_generator import generate_pdf_report
from backend.app.utils.logging_config import logger

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/pdf/{detection_id}")
def download_pdf_report(detection_id: str, db: Session = Depends(get_db)):
    """
    Generate and stream commercial PDF inspection report for a given detection ID.
    """
    reports_dir = Path(__file__).resolve().parent.parent / "outputs" / "reports"
    try:
        pdf_path = generate_pdf_report(record_id=detection_id, db=db, output_dir=reports_dir)
        return FileResponse(
            path=str(pdf_path),
            filename=pdf_path.name,
            media_type="application/pdf"
        )
    except ValueError as ve:
        logger.warning(f"Report requested for missing record {detection_id}: {ve}")
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to generate PDF report for {detection_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")
