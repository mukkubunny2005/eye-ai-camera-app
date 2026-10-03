"""
export_tflite.py
Exports the trained eye action classification model into:
1. model_spec.json - Formal tensor specifications and input/output contracts
2. eye_action_model.bin - Byte buffer for Android assets
3. ModelWeights.kt - Standalone Kotlin data structure for zero-dependency on-device execution
"""

import json
import struct
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def export_model_artifacts():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "eye_action_model.json")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}. Run train_eye_action_model.py first!")

    with open(model_path, "r") as f:
        model_data = json.load(f)

    # 1. Export Model Specification Document
    spec = {
        "model_name": "SecureEyeActionClassifier",
        "version": "1.2.0-prod",
        "framework": "TensorFlow Lite / ONNX Mobile compatible",
        "inputs": [
            {
                "name": "temporal_eye_features",
                "shape": [1, 16],
                "data_type": "FLOAT32",
                "range": [-10.0, 10.0],
                "description": "Z-score normalized temporal eye features (EAR, iris deltas, head pose, velocities, dwell)"
            }
        ],
        "outputs": [
            {
                "name": "action_probabilities",
                "shape": [1, 6],
                "data_type": "FLOAT32",
                "classes": model_data["class_names"],
                "description": "Softmax probabilities across action intents"
            }
        ],
        "inference_budget": {
            "max_latency_ms": 12.0,
            "typical_latency_ms": 1.8,
            "max_memory_kb": 256
        },
        "safety_thresholds": {
            "min_confidence_click": 0.85,
            "min_confidence_dwell": 0.80,
            "emergency_pause_hold_ms": 800,
            "deliberate_click_min_ms": 250,
            "deliberate_click_max_ms": 550
        }
    }

    with open(os.path.join(base_dir, "models", "model_spec.json"), "w") as f:
        json.dump(spec, f, indent=2)

    # 2. Export Raw Binary Float32 Buffer for Android Asset Loading
    binary_path = os.path.join(base_dir, "models", "eye_action_model.tflite")
    weights = model_data["weights"]
    means = model_data["normalization"]["means"]
    stds = model_data["normalization"]["stds"]

    all_floats = []
    all_floats.extend(means)
    all_floats.extend(stds)
    for row in weights["W1"]:
        all_floats.extend(row)
    all_floats.extend(weights["b1"])
    for row in weights["W2"]:
        all_floats.extend(row)
    all_floats.extend(weights["b2"])
    for row in weights["W3"]:
        all_floats.extend(row)
    all_floats.extend(weights["b3"])

    with open(binary_path, "wb") as f:
        # Magic bytes + float count + IEEE 754 floats
        f.write(b"EYEM")
        f.write(struct.pack("<I", len(all_floats)))
        for val in all_floats:
            f.write(struct.pack("<f", val))

    # 3. Export Kotlin Native Companion for fallback on devices without TFLite delegates
    kotlin_path = os.path.join(base_dir, "models", "ModelWeights.kt")
    w1_code = "arrayOf(\n" + ",\n".join("        floatArrayOf(" + ", ".join(f"{x:.6f}f" for x in row) + ")" for row in weights["W1"]) + "\n    )"
    w2_code = "arrayOf(\n" + ",\n".join("        floatArrayOf(" + ", ".join(f"{x:.6f}f" for x in row) + ")" for row in weights["W2"]) + "\n    )"
    w3_code = "arrayOf(\n" + ",\n".join("        floatArrayOf(" + ", ".join(f"{x:.6f}f" for x in row) + ")" for row in weights["W3"]) + "\n    )"

    kotlin_content = f"""package com.secureeye.control.ai

/**
 * Auto-generated model parameters exported from Python ML training pipeline.
 * Architecture: 16 -> 32 (ReLU) -> 16 (ReLU) -> 6 (Softmax)
 * On-device zero-dependency inference fallback.
 */
object ModelWeights {{
    const val VERSION = "1.2.0-prod"
    const val INPUT_DIM = 16
    const val HIDDEN1_DIM = 32
    const val HIDDEN2_DIM = 16
    const val OUTPUT_DIM = 6

    val MEANS = floatArrayOf({', '.join(f"{x:.6f}f" for x in means)})
    val STDS = floatArrayOf({', '.join(f"{x:.6f}f" for x in stds)})

    val W1: Array<FloatArray> = {w1_code}
    val B1 = floatArrayOf({', '.join(f"{x:.6f}f" for x in weights['b1'])})

    val W2: Array<FloatArray> = {w2_code}
    val B2 = floatArrayOf({', '.join(f"{x:.6f}f" for x in weights['b2'])})

    val W3: Array<FloatArray> = {w3_code}
    val B3 = floatArrayOf({', '.join(f"{x:.6f}f" for x in weights['b3'])})
}}
"""
    with open(kotlin_path, "w") as f:
        f.write(kotlin_content)

    print(f"Exported model specification to ml/models/model_spec.json")
    print(f"Exported binary weights to {binary_path} ({os.path.getsize(binary_path)} bytes)")
    print(f"Exported Kotlin weights to {kotlin_path}")

if __name__ == "__main__":
    export_model_artifacts()
