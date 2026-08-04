import argparse
from pathlib import Path

def export_yolo11_model(weights: str = "backend/trained_models/best.pt", format: str = "onnx"):
    """
    Export trained YOLO11 model weights to target format (ONNX, TensorRT, TorchScript).
    """
    from ultralytics import YOLO

    weights_path = Path(weights)
    if not weights_path.exists():
        print(f"[WARNING] Weights file {weights} not found. Defaulting to pretrained yolo11m.pt.")
        weights_path = Path("yolo11m.pt")

    print(f"Exporting model {weights_path} to format: {format.upper()}")
    model = YOLO(str(weights_path))

    exported_path = model.export(format=format)
    print(f"\n[SUCCESS] Model successfully exported to: {exported_path}")
    return exported_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export YOLO11 Model Weights")
    parser.add_argument("--weights", type=str, default="backend/trained_models/best.pt", help="Path to weights file")
    parser.add_argument("--format", type=str, default="onnx", help="Target export format (onnx, torchscript, engine)")

    args = parser.parse_args()
    export_yolo11_model(weights=args.weights, format=args.format)
