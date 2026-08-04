import uvicorn
import os
import sys
from pathlib import Path

# Ensure root workspace directory is in python path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

if __name__ == "__main__":
    print("==================================================")
    print("  Starting Intelligent Road Damage Detection API  ")
    print("  Engine: Roboflow / YOLO11 | Port: 8005          ")
    print("==================================================")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8005, reload=True)
