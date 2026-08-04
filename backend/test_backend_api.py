import sys
import os
from pathlib import Path

# Ensure workspace root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_backend_api():
    print("==================================================")
    print("      BACKEND FASTAPI SUITE VERIFICATION          ")
    print("==================================================")

    # 1. Test Root Health Endpoint
    print("\n1. Testing GET / (Root endpoint)...")
    res_root = client.get("/")
    assert res_root.status_code == 200, f"Expected 200, got {res_root.status_code}"
    print(f"   [PASS] Response: {res_root.json()}")

    # 2. Test Stats Analytics Endpoint
    print("\n2. Testing GET /api/stats...")
    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200, f"Expected 200, got {res_stats.status_code}"
    stats_data = res_stats.json()
    assert "total_detections" in stats_data
    assert "damage_type_distribution" in stats_data
    assert "severity_distribution" in stats_data
    print(f"   [PASS] Total Detections: {stats_data['total_detections']} | Total Scans: {stats_data['total_scans']}")

    # 3. Test Detection Records Listing
    print("\n3. Testing GET /api/records...")
    res_records = client.get("/api/records?limit=10")
    assert res_records.status_code == 200, f"Expected 200, got {res_records.status_code}"
    records = res_records.json()
    print(f"   [PASS] Retrieved {len(records)} records.")

    # 4. Test Image Detection Endpoint (Posting sample image)
    print("\n4. Testing POST /api/detect/image (Roboflow API Key inference)...")
    sample_img_path = ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images" / "China_Drone_000003.jpg"
    if not sample_img_path.exists():
        # Fallback candidate
        for c in (ROOT_DIR / "datasets" / "RDD_SPLIT" / "train" / "images").glob("*.jpg"):
            sample_img_path = c
            break

    assert sample_img_path.exists(), "Sample image for detection test not found"

    with open(sample_img_path, "rb") as f:
        files = {"files": (sample_img_path.name, f, "image/jpeg")}
        data = {"conf_threshold": "0.25", "road_name": "TestSuite Sector Alpha"}
        res_detect = client.post("/api/detect/image", files=files, data=data)

    assert res_detect.status_code == 200, f"Detection failed with status {res_detect.status_code}: {res_detect.text}"
    det_results = res_detect.json()
    assert len(det_results) > 0, "No detection record returned"
    first_rec = det_results[0]
    det_id = first_rec["detection_id"]
    print(f"   [PASS] Detection ID: {det_id}")
    print(f"          Total Defects: {first_rec['total_defects']} | Overall Severity: {first_rec['overall_severity']}")
    print(f"          Output Path: {first_rec['annotated_output_path']}")

    # 5. Test Record Detail Endpoint
    print(f"\n5. Testing GET /api/records/{det_id}...")
    res_detail = client.get(f"/api/records/{det_id}")
    assert res_detail.status_code == 200
    rec_detail = res_detail.json()
    assert rec_detail["detection_id"] == det_id
    print(f"   [PASS] Record Detail fetched for ID {det_id}")

    # 6. Test PDF Report Generation Endpoint
    print(f"\n6. Testing GET /api/reports/pdf/{det_id}...")
    res_pdf = client.get(f"/api/reports/pdf/{det_id}")
    assert res_pdf.status_code == 200, f"Expected 200, got {res_pdf.status_code}"
    assert res_pdf.headers.get("content-type") == "application/pdf"
    print(f"   [PASS] PDF Report downloaded successfully ({len(res_pdf.content)} bytes).")

    print("\n==================================================")
    print("  ALL BACKEND ENDPOINTS ARE WORKING PERFECTLY!   ")
    print("==================================================")

if __name__ == "__main__":
    test_backend_api()
