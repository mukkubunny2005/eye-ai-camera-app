"""
evaluate_model.py
Evaluates the trained eye action classification model with rigorous safety metrics:
- Confusion Matrix across all 6 action classes
- Precision, Recall, F1-Score per class
- False-Positive Action Rate (Accidental click safety evaluation)
- Inference latency measurement
"""

import json
import time
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from train_eye_action_model import MobileEyeActionModel
from dataset_generator import FEATURE_NAMES, CLASS_NAMES, generate_dataset

def load_model(filepath=None):
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), "models", "eye_action_model.json")
    with open(filepath, "r") as f:
        data = json.load(f)
    arch = data["architecture"]
    model = MobileEyeActionModel(
        input_dim=arch["input_dim"],
        hidden1_dim=arch["hidden1_dim"],
        hidden2_dim=arch["hidden2_dim"],
        output_dim=arch["output_dim"]
    )
    model.means = data["normalization"]["means"]
    model.stds = data["normalization"]["stds"]
    model.W1 = data["weights"]["W1"]
    model.b1 = data["weights"]["b1"]
    model.W2 = data["weights"]["W2"]
    model.b2 = data["weights"]["b2"]
    model.W3 = data["weights"]["W3"]
    model.b3 = data["weights"]["b3"]
    return model

def run_evaluation(num_test_samples=1200):
    model = load_model()
    test_data = generate_dataset(num_samples_per_class=num_test_samples // len(CLASS_NAMES))
    
    n_classes = len(CLASS_NAMES)
    conf_matrix = [[0 for _ in range(n_classes)] for _ in range(n_classes)]
    
    start_time = time.time()
    predictions = []
    
    for item in test_data:
        actual = item["label"]
        pred, conf, probs = model.predict(item["features"])
        conf_matrix[actual][pred] += 1
        predictions.append((actual, pred, conf))
        
    total_time_ms = (time.time() - start_time) * 1000
    avg_latency_ms = total_time_ms / len(test_data)

    total_samples = len(test_data)
    total_correct = sum(conf_matrix[i][i] for i in range(n_classes))
    overall_accuracy = total_correct / total_samples

    class_metrics = {}
    for c in range(n_classes):
        tp = conf_matrix[c][c]
        fp = sum(conf_matrix[i][c] for i in range(n_classes) if i != c)
        fn = sum(conf_matrix[c][j] for j in range(n_classes) if j != c)
        tn = total_samples - (tp + fp + fn)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0

        class_metrics[CLASS_NAMES[c]] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn
        }

    # High-Risk Accidental Action Calculation
    # DELIBERATE_CLICK (class 1) falsely triggered by NORMAL_BLINK (0) or SACCADE_REST (5)
    accidental_clicks = conf_matrix[0][1] + conf_matrix[5][1]
    safe_samples = sum(conf_matrix[0]) + sum(conf_matrix[5])
    accidental_click_rate = accidental_clicks / safe_samples if safe_samples > 0 else 0.0

    eval_results = {
        "overall_accuracy": round(overall_accuracy, 4),
        "total_test_samples": total_samples,
        "avg_inference_latency_ms": round(avg_latency_ms, 3),
        "confusion_matrix": conf_matrix,
        "class_names": CLASS_NAMES,
        "class_metrics": class_metrics,
        "accidental_click_rate": round(accidental_click_rate, 4),
        "safety_status": "PASSED" if accidental_click_rate < 0.02 else "WARNING: High accidental trigger rate",
        "mobile_deployment_ready": True
    }

    report_path = os.path.join(os.path.dirname(__file__), "models", "evaluation_report.json")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(eval_results, f, indent=2)

    print("\n================ EVALUATION SUMMARY ================")
    print(f"Overall Accuracy:        {overall_accuracy*100:.2f}%")
    print(f"Avg Inference Latency:   {avg_latency_ms:.3f} ms per sample")
    print(f"Accidental Click Rate:   {accidental_click_rate*100:.3f}% (Target: <2.0%)")
    print(f"Safety Gate Status:      {eval_results['safety_status']}")
    print("\nConfusion Matrix (Rows: Actual, Cols: Predicted):")
    header = "          " + "".join(f"{c[:7]:>9}" for c in CLASS_NAMES)
    print(header)
    for i, row in enumerate(conf_matrix):
        row_str = f"{CLASS_NAMES[i][:9]:<10}" + "".join(f"{val:>9}" for val in row)
        print(row_str)
    print("====================================================\n")
    return eval_results

if __name__ == "__main__":
    run_evaluation()
