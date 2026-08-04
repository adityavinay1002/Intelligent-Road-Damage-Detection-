import sys
import os
import cv2
import numpy as np
from pathlib import Path

# Ensure workspace root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.utils.geocoding import extract_exif_gps, reverse_geocode
from backend.app.detection.recommendations import get_repair_recommendation

client = TestClient(app)

def test_backend_api():
    print("==================================================")
    print("  ROADVISION AI BACKEND FULL SUITE VERIFICATION   ")
    print("==================================================")

    # 1. Test Root Health Endpoint
    print("\n1. Testing GET / (Root endpoint)...")
    res_root = client.get("/")
    assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
    print(f"   [PASS] Response: {res_root.json()}")

    # 2. Test Repair Recommendations Engine
    print("\n2. Testing Repair Recommendations Engine...")
    rec_pothole = get_repair_recommendation("Pothole")
    assert "Immediate" in rec_pothole["action"]
    assert "1" in rec_pothole["priority_num"]
    print(f"   [PASS] Pothole Recommendation: {rec_pothole['action']} ({rec_pothole['priority']})")

    # 3. Test EXIF & Geocoding Fallbacks
    print("\n3. Testing GPS EXIF & Reverse Geocoding Fallbacks...")
    lat, lon = extract_exif_gps(b"invalid image bytes")
    assert lat is None and lon is None, "Expected None for invalid bytes"
    road, city, state, country, loc_str = reverse_geocode(None, None)
    assert loc_str is None, "Expected None location for empty coordinates"
    print("   [PASS] EXIF & Reverse Geocoding fail gracefully without error.")

    # 4. Test Stats Analytics Endpoint
    print("\n4. Testing GET /api/stats...")
    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200, f"Expected 200, got {res_stats.status_code}"
    stats_data = res_stats.json()
    assert "total_detections" in stats_data
    assert "damage_type_distribution" in stats_data
    assert "severity_distribution" in stats_data
    print(f"   [PASS] Total Detections: {stats_data['total_detections']} | Total Scans: {stats_data['total_scans']}")

    # 5. Test Detection Records Listing
    print("\n5. Testing GET /api/records...")
    res_records = client.get("/api/records?limit=10")
    assert res_records.status_code == 200, f"Expected 200, got {res_records.status_code}"
    records = res_records.json()
    print(f"   [PASS] Retrieved {len(records)} records from SQLite database.")

    # 6. Test Image Detection Endpoint (Hosting sample image upload)
    print("\n6. Testing POST /api/detect/image (Roboflow Hosted Model pipeline)...")
    sample_img_path = ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "China_Drone_000003.jpg"
    if not sample_img_path.exists():
        for c in (ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images").glob("*.jpg"):
            sample_img_path = c
            break
    if not sample_img_path.exists():
        for c in (ROOT_DIR / "backend" / "app" / "uploads").glob("*.jpg"):
            sample_img_path = c
            break

    # If no existing image file found anywhere, create a synthetic test image on the fly
    if not sample_img_path.exists():
        tmp_dir = ROOT_DIR / "backend" / "app" / "uploads"
        tmp_dir.mkdir(parents=True, exist_ok=True)
        sample_img_path = tmp_dir / "synthetic_test_road.jpg"
        img = np.zeros((640, 640, 3), dtype=np.uint8)
        cv2.putText(img, "Road Test Image", (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.imwrite(str(sample_img_path), img)

    with open(sample_img_path, "rb") as f:
        files = {"files": (sample_img_path.name, f, "image/jpeg")}
        data = {"conf_threshold": "0.25", "road_name": "Metro Sector B-1"}
        res_detect = client.post("/api/detect/image", files=files, data=data)

    assert res_detect.status_code == 200, f"Detection failed with status {res_detect.status_code}: {res_detect.text}"
    det_results = res_detect.json()
    assert len(det_results) > 0, "No detection record returned"
    first_rec = det_results[0]
    det_id = first_rec["detection_id"]
    
    print(f"   [PASS] Detection ID: {det_id}")
    print(f"          Total Defects: {first_rec['total_defects']} | Highest Severity: {first_rec['highest_severity']}")
    print(f"          Avg Confidence: {first_rec['avg_confidence']} | Latency: {first_rec['inference_time_ms']} ms")
    print(f"          Model Version: {first_rec['model_version']}")
    print(f"          Output Path: {first_rec['annotated_output_path']}")

    # 7. Test Record Detail Endpoint
    print(f"\n7. Testing GET /api/records/{det_id}...")
    res_detail = client.get(f"/api/records/{det_id}")
    assert res_detail.status_code == 200
    rec_detail = res_detail.json()
    assert rec_detail["detection_id"] == det_id
    print(f"   [PASS] Record Detail fetched successfully.")

    # 8. Test Commercial PDF Report Generation Endpoint
    print(f"\n8. Testing GET /api/reports/pdf/{det_id}...")
    res_pdf = client.get(f"/api/reports/pdf/{det_id}")
    assert res_pdf.status_code == 200, f"Expected 200, got {res_pdf.status_code}"
    assert res_pdf.headers.get("content-type") == "application/pdf"
    pdf_bytes = len(res_pdf.content)
    assert pdf_bytes > 5000, f"PDF report size suspicious: {pdf_bytes} bytes"
    print(f"   [PASS] Commercial PDF Inspection Report generated successfully ({pdf_bytes} bytes).")

    print("\n==================================================")
    print("  ALL BACKEND TESTS PASSED CLEANLY & SUCCESSFULLY! ")
    print("==================================================")

if __name__ == "__main__":
    test_backend_api()
