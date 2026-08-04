from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database.database import get_db
from backend.app.services.stats_service import get_dashboard_stats

router = APIRouter(prefix="/api/stats", tags=["Analytics & Dashboard"])

@router.get("")
def get_stats(db: Session = Depends(get_db)):
    """
    Get aggregated dashboard analytics:
    - Total detections
    - Damage type distribution
    - Severity distribution
    - Monthly detection trends
    - Road-wise statistics
    - Recent detections
    """
    return get_dashboard_stats(db)
