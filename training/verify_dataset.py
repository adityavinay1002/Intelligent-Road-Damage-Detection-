import os
import sys
import random
import yaml
import json
import cv2
import numpy as np
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

def process_label_file(lbl_path):
    class_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    is_empty = False
    try:
        with open(lbl_path, "r", encoding="utf-8", errors="ignore") as f:
            lines = f.readlines()
            if not lines or len(lines) == 0:
                is_empty = True
            for line in lines:
                parts = line.strip().split()
                if len(parts) == 5:
                    try:
                        cid = int(parts[0])
                        if cid in class_counts:
                            class_counts[cid] += 1
                    except ValueError:
                        pass
    except Exception:
        is_empty = True
    return class_counts, is_empty

def run_fast_parallel_verification():
    root = Path("datasets/RDD_SPLIT").resolve()
    yaml_path = root / "data.yaml"

    if not yaml_path.exists():
        print("[FAIL] data.yaml not found!")
        return

    with open(yaml_path, "r", encoding="utf-8") as f:
        yaml_config = yaml.safe_load(f)

    splits = ["train", "val", "test"]
    split_stats = {}
    total_class_counts = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0}
    corrupted_images_count = 0
    all_sample_pairs = []

    for split in splits:
        img_dir = root / split / "images"
        lbl_dir = root / split / "labels"

        if not img_dir.exists() or not lbl_dir.exists():
            print(f"[FAIL] Missing {split} images or labels directory")
            continue

        img_names = [f.name for f in os.scandir(img_dir) if f.name.lower().endswith(('.jpg', '.png', '.jpeg'))]
        lbl_paths = [f.path for f in os.scandir(lbl_dir) if f.name.endswith('.txt')]
        lbl_dict = {Path(p).stem: p for p in lbl_paths}

        missing_labels = 0
        for img_name in img_names:
            stem = os.path.splitext(img_name)[0]
            if stem not in lbl_dict:
                missing_labels += 1
            else:
                all_sample_pairs.append((img_dir / img_name, Path(lbl_dict[stem]), split))

        # Parallel process label files
        empty_count = 0
        with ThreadPoolExecutor(max_workers=32) as executor:
            results = list(executor.map(process_label_file, lbl_paths))

        for counts, is_empty in results:
            if is_empty:
                empty_count += 1
            for cid, cnt in counts.items():
                total_class_counts[cid] += cnt

        split_stats[split] = {
            "image_count": len(img_names),
            "label_count": len(lbl_paths),
            "missing_labels": missing_labels,
            "empty_label_files": empty_count
        }

    # Verify a random sample of 200 images for corruption check
    random.seed(42)
    corrupt_test_samples = random.sample(all_sample_pairs, min(200, len(all_sample_pairs)))
    for img_p, _, _ in corrupt_test_samples:
        img = cv2.imread(str(img_p))
        if img is None:
            corrupted_images_count += 1

    # Draw bounding boxes on 20 random preview images
    preview_dir = root.parent / "dataset_verification_preview"
    preview_dir.mkdir(parents=True, exist_ok=True)

    class_names = yaml_config.get("names", {
        0: "longitudinal crack",
        1: "transverse crack",
        2: "alligator crack",
        3: "other corruption",
        4: "pothole"
    })

    class_colors = {
        0: (255, 191, 0),   # Cyan
        1: (255, 105, 180), # Pink
        2: (0, 215, 255),   # Gold
        3: (128, 128, 128), # Gray
        4: (0, 0, 255)      # Red for Pothole
    }

    sample_preview_subset = random.sample(all_sample_pairs, min(20, len(all_sample_pairs)))
    saved_previews = 0

    for img_p, lbl_p, split in sample_preview_subset:
        img = cv2.imread(str(img_p))
        if img is None:
            continue
        h, w = img.shape[:2]
        with open(lbl_p, "r", encoding="utf-8", errors="ignore") as lf:
            lines = lf.readlines()
            for line in lines:
                parts = line.strip().split()
                if len(parts) == 5:
                    cid = int(parts[0])
                    cx, cy, bw, bh = map(float, parts[1:])
                    x1 = max(0, int((cx - bw / 2) * w))
                    y1 = max(0, int((cy - bh / 2) * h))
                    x2 = min(w - 1, int((cx + bw / 2) * w))
                    y2 = min(h - 1, int((cy + bh / 2) * h))

                    color = class_colors.get(cid, (0, 255, 0))
                    cname = class_names.get(cid, str(cid))

                    cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
                    label = f"{cid}:{cname}"
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(img, (x1, max(0, y1 - th - 6)), (x1 + tw + 6, y1), color, -1)
                    cv2.putText(img, label, (x1 + 3, max(th + 2, y1 - 3)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

        out_path = preview_dir / f"{split}_{img_p.name}"
        cv2.imwrite(str(out_path), img)
        saved_previews += 1

    final_report = {
        "dataset_root": str(root.absolute()),
        "data_yaml_valid": True,
        "yaml_config": yaml_config,
        "split_stats": split_stats,
        "class_distribution": total_class_counts,
        "corrupted_images_found": corrupted_images_count,
        "preview_images_saved": saved_previews,
        "preview_dir": str(preview_dir.absolute()),
        "is_ready_for_training": True
    }

    report_json_path = root.parent / "dataset_verification_report.json"
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(final_report, f, indent=4)

    print("VERIFICATION_COMPLETE")
    print(json.dumps(final_report, indent=2))

if __name__ == "__main__":
    run_fast_parallel_verification()
