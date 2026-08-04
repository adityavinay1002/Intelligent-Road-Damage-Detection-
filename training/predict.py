import os
import argparse
from pathlib import Path

def run_predictions(source: str, weights: str = "backend/trained_models/best.pt", conf: float = 0.25):
    """
    Run offline batch prediction on an image, video, or folder of media files.
    """
    from ultralytics import YOLO

    weights_path = Path(weights)
    if not weights_path.exists():
        print(f"[WARNING] Weights file {weights} not found. Using pretrained yolo11m.pt.")
        weights_path = "yolo11m.pt"

    print(f"Running inference with model: {weights_path}")
    model = YOLO(str(weights_path))

    results = model.predict(
        source=source,
        conf=conf,
        save=True,
        project="runs/predict",
        name="road_damage_output",
        exist_ok=True
    )

    print(f"\n[OK] Offline predictions completed. Output saved in runs/predict/road_damage_output")
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Offline Predictions using YOLO11")
    parser.add_argument("--source", type=str, required=True, help="File path or directory containing test images/videos")
    parser.add_argument("--weights", type=str, default="backend/trained_models/best.pt", help="Path to weights file")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold")

    args = parser.parse_args()
    run_predictions(source=args.source, weights=args.weights, conf=args.conf)
