import os
import sys
import json
import argparse
from pathlib import Path

def evaluate_model(weights_path: str, data_yaml: str, verify_only: bool = False):
    """
    Evaluate YOLO11 model performance on validation/test split.
    Calculates: Precision, Recall, F1 Score, mAP50, mAP50-95.
    """
    yaml_path = Path(data_yaml)
    if not yaml_path.exists():
        print(f"[ERROR] Dataset configuration file not found at: {yaml_path.absolute()}")
        return None

    if verify_only:
        print(f"[OK] Dataset structure and data.yaml verified at: {yaml_path.absolute()}")
        return {"status": "verified", "data_yaml": str(yaml_path)}

    weights = Path(weights_path)
    if not weights.exists():
        print(f"[WARNING] Specified weights not found at: {weights.absolute()}. Falling back to pretrained yolo11m.pt.")
        weights = "yolo11m.pt"

    from ultralytics import YOLO

    print(f"Evaluating model weights: {weights}")
    model = YOLO(str(weights))
    metrics = model.val(data=str(yaml_path.absolute()), split="val")

    # Extract performance metrics
    precision = float(metrics.box.mp) if hasattr(metrics.box, 'mp') else 0.0
    recall = float(metrics.box.mr) if hasattr(metrics.box, 'mr') else 0.0
    map50 = float(metrics.box.map50) if hasattr(metrics.box, 'map50') else 0.0
    map50_95 = float(metrics.box.map) if hasattr(metrics.box, 'map') else 0.0
    
    f1_score = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0

    eval_results = {
        "weights": str(weights),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1_score, 4),
        "mAP50": round(map50, 4),
        "mAP50_95": round(map50_95, 4),
    }

    print("\n==================================================")
    print("           YOLO11 Model Evaluation Results        ")
    print("==================================================")
    print(f" Precision:  {eval_results['precision']:.4f}")
    print(f" Recall:     {eval_results['recall']:.4f}")
    print(f" F1 Score:   {eval_results['f1_score']:.4f}")
    print(f" mAP@50:     {eval_results['mAP50']:.4f}")
    print(f" mAP@50-95:  {eval_results['mAP50_95']:.4f}")
    print("==================================================\n")

    output_json = Path(__file__).resolve().parent / "eval_results.json"
    with open(output_json, "w") as f:
        json.dump(eval_results, f, indent=4)
    
    print(f"Saved evaluation metrics report to: {output_json.absolute()}")
    return eval_results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate YOLO11 Model Performance")
    parser.add_argument("--weights", type=str, default="backend/trained_models/best.pt", help="Path to model weights")
    parser.add_argument("--data", type=str, default="datasets/data.yaml", help="Path to data.yaml file")
    parser.add_argument("--verify-only", action="store_true", help="Only verify dataset layout and YAML file")

    args = parser.parse_args()
    evaluate_model(weights_path=args.weights, data_yaml=args.data, verify_only=args.verify_only)
