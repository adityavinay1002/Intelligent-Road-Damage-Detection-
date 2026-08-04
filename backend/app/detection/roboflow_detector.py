import os
import cv2
import tempfile
import numpy as np
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv
from backend.app.detection.severity import compute_item_severity

ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_path = ROOT_DIR / ".env"
backend_env_path = ROOT_DIR / "backend" / ".env"

def load_project_env():
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)
    if backend_env_path.exists():
        load_dotenv(dotenv_path=backend_env_path, override=True)
    load_dotenv(override=False)

load_project_env()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "")
ROBOFLOW_API_URL = os.getenv("ROBOFLOW_API_URL", "https://serverless.roboflow.com")
ROBOFLOW_WORKSPACE = os.getenv("ROBOFLOW_WORKSPACE", "aditya-vinay")
ROBOFLOW_WORKFLOW_ID = os.getenv("ROBOFLOW_WORKFLOW_ID", "general-segmentation-api-2")
ROBOFLOW_CLASSES = os.getenv("ROBOFLOW_CLASSES", "pothole, alligator cracking, edge cracking, longitudinal cracking, patching")
MODEL_ID = os.getenv("ROBOFLOW_MODEL_ID", "road-damage-det/2")

CLASS_NAME_MAP = {
    0: "Longitudinal Crack",
    1: "Transverse Crack",
    2: "Alligator Crack",
    3: "Pothole",
    "D00": "Longitudinal Crack",
    "D10": "Transverse Crack",
    "D20": "Alligator Crack",
    "D40": "Pothole",
    "pothole": "Pothole",
    "alligator crack": "Alligator Crack",
    "alligator cracking": "Alligator Crack",
    "edge crack": "Edge Crack",
    "edge cracking": "Edge Crack",
    "longitudinal crack": "Longitudinal Crack",
    "longitudinal cracking": "Longitudinal Crack",
    "transverse crack": "Transverse Crack",
    "transverse cracking": "Transverse Crack",
    "patching": "Patching",
    "patch": "Patching",
    "crack": "Longitudinal Crack",
}

class RoboflowDetector:
    """Hosted Roboflow Inference Workflow & Object Detection Engine"""

    def __init__(
        self,
        api_key: str = None,
        api_url: str = None,
        workspace_name: str = None,
        workflow_id: str = None,
        model_id: str = None
    ):
        load_project_env()

        self.api_key = api_key or os.getenv("ROBOFLOW_API_KEY", "")
        self.api_url = api_url or os.getenv("ROBOFLOW_API_URL", "https://serverless.roboflow.com")
        self.workspace_name = workspace_name or os.getenv("ROBOFLOW_WORKSPACE", "aditya-vinay")
        self.workflow_id = workflow_id or os.getenv("ROBOFLOW_WORKFLOW_ID", "general-segmentation-api-2")
        self.classes_param = os.getenv("ROBOFLOW_CLASSES", "pothole, alligator cracking, edge cracking, longitudinal cracking, patching")
        self.model_id = model_id or os.getenv("ROBOFLOW_MODEL_ID", "road-damage-det/2")
        self.client = None
        self._init_client()

    def _init_client(self):
        if not self.api_key or self.api_key == "YOUR_API_KEY":
            print("[ROBOFLOW] Warning: ROBOFLOW_API_KEY is not set or using placeholder 'YOUR_API_KEY'.")
            self.client = None
            return

        try:
            from inference_sdk import InferenceHTTPClient
            self.client = InferenceHTTPClient(
                api_url=self.api_url,
                api_key=self.api_key
            )
            print(f"[ROBOFLOW] Initialized InferenceHTTPClient (URL: {self.api_url}, Workspace: {self.workspace_name}, Workflow: {self.workflow_id})")
        except Exception as e:
            print(f"[ROBOFLOW ERROR] Failed to initialize InferenceHTTPClient: {e}")
            self.client = None

    def detect(self, image: np.ndarray, conf_threshold: float = 0.25) -> List[Dict]:
        """
        Perform inference on image array using Roboflow Workflow / Hosted API.
        Converts predictions into standard project detection objects.
        """
        if image is None or image.size == 0:
            return []

        h, w = image.shape[:2]

        if not self.client:
            self._init_client()
            if not self.client:
                print("[ROBOFLOW] Roboflow client is uninitialized. Check ROBOFLOW_API_KEY.")
                return []

        # Save frame temporarily for inference_sdk client call
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            tmp_path = tmp.name
            cv2.imwrite(tmp_path, image)

        result = None
        try:
            # 1. Primary execution: Roboflow Workflow
            try:
                result = self.client.run_workflow(
                    workspace_name=self.workspace_name,
                    workflow_id=self.workflow_id,
                    images={
                        "image": tmp_path
                    },
                    parameters={
                        "classes": self.classes_param
                    },
                    use_cache=True
                )
            except Exception as wf_err:
                print(f"[ROBOFLOW WORKFLOW ERROR] Workflow failed ({wf_err}), attempting direct model infer ({self.model_id})...")
                result = self.client.infer(tmp_path, model_id=self.model_id)

        except Exception as e:
            print(f"[ROBOFLOW ERROR] Inference request failed: {e}")
            return []
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        try:
            return self._parse_predictions(result, w, h, conf_threshold)
        except Exception as parse_err:
            print(f"[ROBOFLOW PARSE ERROR] Failed to parse predictions: {parse_err}")
            return []

    def _parse_predictions(self, result, img_w: int, img_h: int, conf_threshold: float) -> List[Dict]:
        predictions = []

        if isinstance(result, list) and len(result) > 0:
            first = result[0]
            if isinstance(first, dict):
                preds_val = first.get("predictions")
                if isinstance(preds_val, dict):
                    predictions = preds_val.get("predictions", [])
                elif isinstance(preds_val, list):
                    predictions = preds_val
                elif "output" in first and isinstance(first["output"], list):
                    predictions = first["output"]
                elif "result" in first and isinstance(first["result"], list):
                    predictions = first["result"]
        elif isinstance(result, dict):
            preds_val = result.get("predictions")
            if isinstance(preds_val, list):
                predictions = preds_val
            elif isinstance(preds_val, dict):
                predictions = preds_val.get("predictions", [])

        detections = []
        for pred in predictions:
            if not isinstance(pred, dict):
                continue

            conf = float(pred.get("confidence", pred.get("score", 0.0)))
            if conf < conf_threshold:
                continue

            raw_class = str(pred.get("class", pred.get("class_name", pred.get("label", "Pothole")))).lower().strip()
            damage_class = CLASS_NAME_MAP.get(
                raw_class,
                CLASS_NAME_MAP.get(raw_class.replace("-", " "), raw_class.title())
            )

            # Bounding box parsing
            points = pred.get("points") or pred.get("polygon")
            if "x" in pred and "y" in pred and "width" in pred and "height" in pred:
                cx = float(pred["x"])
                cy = float(pred["y"])
                bw = float(pred["width"])
                bh = float(pred["height"])

                x1 = max(0.0, cx - bw / 2.0)
                y1 = max(0.0, cy - bh / 2.0)
                x2 = min(float(img_w), cx + bw / 2.0)
                y2 = min(float(img_h), cy + bh / 2.0)
            elif points and isinstance(points, list) and len(points) > 0:
                xs = [p["x"] if isinstance(p, dict) else p[0] for p in points]
                ys = [p["y"] if isinstance(p, dict) else p[1] for p in points]
                x1 = max(0.0, float(min(xs)))
                y1 = max(0.0, float(min(ys)))
                x2 = min(float(img_w), float(max(xs)))
                y2 = min(float(img_h), float(max(ys)))
            else:
                continue

            bbox = [round(x1, 2), round(y1, 2), round(x2, 2), round(y2, 2)]

            # Compute severity using project's standard engine
            severity = compute_item_severity(
                damage_class=damage_class,
                bbox=bbox,
                img_width=img_w,
                img_height=img_h,
                confidence=conf
            )

            det_obj = {
                "damage_class": damage_class,
                "confidence": round(conf, 4),
                "bbox": bbox,
                "severity": severity
            }
            if points:
                det_obj["points"] = points

            detections.append(det_obj)

        return detections

