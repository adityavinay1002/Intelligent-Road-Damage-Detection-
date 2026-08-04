# System Architecture — Intelligent Road Damage Detection

The **Intelligent Road Damage Detection System** supports both hosted **Roboflow Object Detection (`road-damage-det/2`)** and local **YOLO11** object detection models, backed by FastAPI services, SQLite persistence, and a React + Vite frontend.

```
                  +-----------------------------------+
                  |   React + Vite Frontend (UI)      |
                  |  - Dashboard & Chart Analytics    |
                  |  - Professional Detection Studio  |
                  |  - Geotagged Map View (Leaflet)   |
                  |  - PDF Reports & History Logs     |
                  +-----------------+-----------------+
                                    |
                                    | REST API (HTTP/JSON/Multipart)
                                    v
                  +-----------------------------------+
                  |     FastAPI Backend Engine        |
                  |  - /api/detect/image & /video     |
                  |  - /api/records & /stats          |
                  |  - /api/reports/pdf               |
                  +-----------------+-----------------+
                                    |
                 +------------------+------------------+
                 |                                     |
                 v                                     v
+---------------------------------+   +---------------------------------+
|    Roboflow / YOLO11 Engine     |   |   SQLite Database & Storage     |
| - Roboflow: road-damage-det/2   |   | - Detection Records             |
| - Local Fallback: best.pt       |   | - Itemized Damage Log           |
| - Bounding Box Annotation       |   | - Evidence Crop Snapshots       |
| - Severity & Coverage Evaluator |   | - PDF Reports & Evidence Crops  |
+---------------------------------+   +---------------------------------+
```

## Detection Engines

### 1. Hosted Roboflow Detection Engine (`backend/app/detection/roboflow_detector.py`)
- **SDK**: `inference-sdk` (`InferenceHTTPClient`)
- **Model ID**: `road-damage-det/2`
- **Endpoint**: `https://serverless.roboflow.com`
- **API Key**: Configured via `.env` (`ROBOFLOW_API_KEY`)
- **Image & Video Inference**: Single Image, Multi-Image, and Frame-by-Frame Video inference. Converts predictions into standardized project detection objects.

### 2. Local YOLO11 Detection Engine (`backend/app/detection/yolo_detector.py`)
- Seamless fallback when `USE_LOCAL_YOLO=true` or if Roboflow API key is not configured.
