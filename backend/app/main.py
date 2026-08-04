import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables from .env files on app startup
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
env_path = ROOT_DIR / ".env"
backend_env_path = ROOT_DIR / "backend" / ".env"

if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
if backend_env_path.exists():
    load_dotenv(dotenv_path=backend_env_path, override=True)

from backend.app.database.database import init_db
from backend.app.api import detect_router, records_router, stats_router, reports_router

app = FastAPI(
    title="Intelligent Road Damage Detection API",
    description="YOLO11-Powered Road Damage Detection & Infrastructure Inspection Backend",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database tables
init_db()

# Define static directories
APP_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = APP_DIR / "uploads"
OUTPUTS_DIR = APP_DIR / "outputs"
EVIDENCE_DIR = APP_DIR / "evidence"

for directory in [UPLOADS_DIR, OUTPUTS_DIR, EVIDENCE_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Mount static file endpoints to serve uploaded media, annotated outputs, and evidence crops
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/evidence", StaticFiles(directory=str(EVIDENCE_DIR)), name="evidence")

# Include API Routers
app.include_router(detect_router.router)
app.include_router(records_router.router)
app.include_router(stats_router.router)
app.include_router(reports_router.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": "Intelligent Road Damage Detection API",
        "engine": "YOLO11",
        "docs": "/docs"
    }
