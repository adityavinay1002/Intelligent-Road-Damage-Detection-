# Intelligent Road Damage Detection & Analytics System (YOLO11)

An end-to-end computer vision and web application system for **Intelligent Road Damage Detection** built with **YOLO11**, **Python FastAPI**, **SQLite**, and **React + Vite**.

![System Architecture Overview](docs/architecture.md)

## Key Features

- **Phase 0 Training Pipeline**: Python scripts for training YOLO11m on the RDD2022 dataset with AdamW optimizer, early stopping, evaluation, and ONNX export.
- **YOLO11 Detection Engine**: Detects and classifies Longitudinal Cracks (`D00`), Transverse Cracks (`D10`), Alligator Cracks (`D20`), and Potholes (`D40`).
- **Enhanced Severity Calculation**: Computes defect severity (Low, Medium, High, Critical) using Damage Class + Bounding Box Area + Relative Road Coverage + Detection Confidence.
- **Professional Detection Studio**:
  - Drag-and-Drop file analyzer supporting Single Image, Multiple Image, and Video Uploads.
  - Automatic media type detection.
  - Confidence threshold slider and bounding box toggle.
  - Side-by-side Original vs Annotated preview.
  - Per-object confidence display and instant PDF report downloads.
- **Analytics Dashboard**: Aggregate metrics for total detections, damage type distribution, severity breakdown, monthly trends, road-wise statistics, and geotagged map markers.
- **PDF Report Generation**: Automated PDF inspection reports with executive summary tables, itemized defect inventories, and evidence crop snapshots.

---

## Directory Structure

```
Intelligent Road Damage Detection/
├── backend/
│   ├── app/
│   │   ├── api/          # REST API Endpoints (detect, records, stats, reports)
│   │   ├── detection/    # YOLO11 Detector, Annotator & Severity Evaluator
│   │   ├── database/     # SQLite Database & SQLAlchemy Models
│   │   ├── models/       # Pydantic Request/Response Schemas
│   │   ├── reports/      # PDF Report Generator
│   │   ├── services/     # Detection & Analytics Services
│   │   ├── utils/        # File & Image Storage Helpers
│   │   ├── uploads/      # Uploaded media storage
│   │   ├── outputs/      # Annotated media storage
│   │   ├── evidence/     # Evidence crop snapshots
│   │   ├── static/       # Static web assets
│   │   └── main.py       # FastAPI Entrypoint
│   ├── trained_models/   # Frozen trained weights (best.pt)
│   ├── requirements.txt  # Backend dependencies
│   └── run.py            # Backend Server Runner
├── frontend/             # React + Vite Web Application
│   ├── public/
│   ├── src/
│   │   ├── components/   # Navbar, Studio, MapView, StatCards, Charts
│   │   ├── pages/        # Dashboard, ReportsPage, TrainingSpecsPage
│   │   ├── services/     # Axios API Client
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.jsx       # Root React Component
│   └── package.json
├── datasets/             # RDD2022 dataset directory
├── training/             # Model Training Pipeline
│   ├── train.py          # YOLO11m Training Script
│   ├── evaluate.py       # Model Evaluation Script
│   ├── predict.py        # Offline Batch Predictor
│   └── export.py         # ONNX Export Script
├── docs/                 # System Architecture & Documentation
├── README.md
├── .gitignore
└── LICENSE
```

---

## Quickstart Guide

### 1. Phase 0: Model Training & Evaluation (Optional if using pretrained weights)

Place the RDD2022 dataset inside `datasets/` and verify `data.yaml`:

```bash
# Verify dataset layout
python training/evaluate.py --verify-only

# Train YOLO11m on complete dataset
python training/train.py --data datasets/data.yaml --epochs 100 --batch 16 --imgsz 640

# Evaluate model metrics (Precision, Recall, F1, mAP50, mAP50-95)
python training/evaluate.py --weights backend/trained_models/best.pt --data datasets/data.yaml
```

### 2. Backend FastAPI Server Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```
- API Endpoint: `http://localhost:8000`
- Interactive Swagger API Documentation: `http://localhost:8000/docs`

### 3. Frontend React Application Setup

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
