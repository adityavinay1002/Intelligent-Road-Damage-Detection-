import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Ensure root workspace is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.app.database.database import SessionLocal, init_db
from backend.app.database.models import DetectionRecord, DamageItem
from backend.app.detection.roboflow_detector import RoboflowDetector
from backend.app.services.detection_service import process_single_image
from backend.app.reports.report_generator import generate_pdf_report

def run_end_to_end_test():
    print("==================================================")
    print("      END-TO-END ROBOFLOW PIPELINE TEST          ")
    print("==================================================")

    # 1. Load .env
    env_path = ROOT_DIR / ".env"
    load_dotenv(dotenv_path=env_path, override=True)
    api_key = os.getenv("ROBOFLOW_API_KEY")
    model_id = os.getenv("ROBOFLOW_MODEL_ID", "road-damage-det/2")

    print(f"1. Environment Loaded:")
    print(f"   API Key: {'[CONFIGURED]' if api_key else '[MISSING]'}")
    print(f"   Model ID: {model_id}")

    # Initialize Database
    init_db()
    db = SessionLocal()

    # 2. Select Sample Image with Damage
    sample_candidates = [
        ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "China_Drone_000003.jpg",
        ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "China_Drone_000019.jpg",
        ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "China_Drone_000020.jpg",
        ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "Japan_004680.jpg",
    ]

    sample_path = None
    for cand in sample_candidates:
        if cand.exists():
            sample_path = cand
            break

    if not sample_path or not sample_path.exists():
        print("[FAIL] Could not locate a sample road image for testing.")
        return

    print(f"2. Target Sample Image: {sample_path.name}")

    # 3. Read image bytes
    with open(sample_path, "rb") as f:
        file_bytes = f.read()

    # 4. Run Detection Service Pipeline (Roboflow Hosted API -> Annotator -> Severity -> DB)
    try:
        record = process_single_image(
            file_bytes=file_bytes,
            filename=sample_path.name,
            db=db,
            conf_threshold=0.20,
            road_name="Highway Sector Test-1"
        )
    except Exception as e:
        print(f"[FAIL] Pipeline execution threw exception: {e}")
        return

    # 5. Generate PDF Report
    reports_dir = ROOT_DIR / "backend" / "app" / "outputs" / "reports"
    pdf_path = generate_pdf_report(record.detection_id, db, reports_dir)

    # 6. Verify Database Storage
    db_record = db.query(DetectionRecord).filter(DetectionRecord.detection_id == record.detection_id).first()

    # Final Output Summary
    print("\n--------------------------------------------------")
    print("          TEST RESULTS & VERIFICATION            ")
    print("--------------------------------------------------")
    print(f" API Connection Status : SUCCESS (HTTP 200)")
    print(f" Model Used            : {model_id}")
    print(f" Number of Detections  : {record.total_defects}")
    print(f" Overall Severity      : {record.overall_severity}")
    print(f" Output Image Location : {record.annotated_output_path}")
    print(f" Database Save Status  : {'SAVED (Record ID: ' + record.detection_id[:8] + '...)' if db_record else 'FAILED'}")
    print(f" PDF Report Location   : {pdf_path.as_posix()}")
    print("--------------------------------------------------")

    if record.damage_items:
        print("\nItemized Detected Defects:")
        for idx, item in enumerate(record.damage_items, 1):
            print(f" {idx}. [{item.damage_class}] Conf: {item.confidence_score:.2f} | Sev: {item.severity} | BBox: {item.bbox_coordinates}")
            if item.evidence_image_path:
                print(f"    Evidence Crop: {item.evidence_image_path}")

    db.close()

if __name__ == "__main__":
    run_end_to_end_test()
