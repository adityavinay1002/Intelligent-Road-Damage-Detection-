import os
import uuid
import shutil
from pathlib import Path
from typing import Tuple

APP_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = APP_DIR / "uploads"
OUTPUTS_DIR = APP_DIR / "outputs"
EVIDENCE_DIR = APP_DIR / "evidence"

def ensure_directories():
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

def generate_file_paths(filename: str) -> Tuple[str, Path, Path]:
    ensure_directories()
    ext = Path(filename).suffix.lower()
    if not ext:
        ext = ".jpg"
    unique_id = str(uuid.uuid4())
    base_name = f"{unique_id}{ext}"
    
    upload_path = UPLOADS_DIR / base_name
    output_path = OUTPUTS_DIR / f"annotated_{base_name}"
    return unique_id, upload_path, output_path

def get_evidence_path(detection_id: str, index: int) -> Path:
    ensure_directories()
    return EVIDENCE_DIR / f"crop_{detection_id}_{index}.jpg"
