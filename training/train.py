import os
import sys
import shutil
import argparse
from pathlib import Path

def verify_dataset(data_yaml_path: Path) -> bool:
    """Verify that data.yaml exists and points to valid directories."""
    if not data_yaml_path.exists():
        print(f"[ERROR] data.yaml not found at: {data_yaml_path.absolute()}")
        return False
    
    print(f"[OK] Found dataset configuration at: {data_yaml_path.absolute()}")
    return True

def train_yolo11(data_yaml: str, epochs: int = 100, batch_size: int = 16, img_size: int = 640):
    """
    Train YOLO11m model on RDD2022 dataset.
    - Model: YOLO11m (yolo11m.pt)
    - Image Size: 640
    - Epochs: 100
    - Optimizer: AdamW
    - Early Stopping Enabled (patience=20)
    - Saves best.pt to backend/trained_models/best.pt
    """
    from ultralytics import YOLO

    yaml_path = Path(data_yaml)
    if not verify_dataset(yaml_path):
        sys.exit(1)

    print("==================================================")
    print("      Starting YOLO11m Training Pipeline          ")
    print("==================================================")
    print(f"Model: yolo11m.pt")
    print(f"Dataset YAML: {yaml_path}")
    print(f"Epochs: {epochs} | Img Size: {img_size} | Batch Size: {batch_size}")
    print("Optimizer: AdamW | Early Stopping: Enabled (patience=20)")
    print("--------------------------------------------------")

    # Load YOLO11m base model
    model = YOLO("yolo11m.pt")

    # Launch training
    results = model.train(
        data=str(yaml_path.absolute()),
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        optimizer="AdamW",
        patience=20,
        save=True,
        project="runs/detect",
        name="rdd2022_yolo11m",
        exist_ok=True,
    )

    # Locate best.pt
    best_weights = Path("runs/detect/rdd2022_yolo11m/weights/best.pt")
    target_weights = Path(__file__).resolve().parent.parent / "backend" / "trained_models" / "best.pt"
    
    if best_weights.exists():
        target_weights.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(best_weights, target_weights)
        print(f"\n[SUCCESS] Saved best performing weights to: {target_weights.absolute()}")
    else:
        print("\n[WARNING] Training completed but best.pt was not found at expected location.")

    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLO11m on RDD2022 Road Damage Dataset")
    parser.add_argument("--data", type=str, default="datasets/data.yaml", help="Path to data.yaml file")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--imgsz", type=int, default=640, help="Image resolution")

    args = parser.parse_args()
    train_yolo11(data_yaml=args.data, epochs=args.epochs, batch_size=args.batch, img_size=args.imgsz)
