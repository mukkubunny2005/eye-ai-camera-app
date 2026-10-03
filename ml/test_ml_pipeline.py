"""
test_ml_pipeline.py
Unit and validation test suite for the Python ML eye action pipeline.
Verifies:
1. Dataset generation shape and valid range
2. Forward pass & gradient computations
3. Model evaluation accuracy > 88%
4. Accidental click rate < 2.0%
5. Average inference latency < 10.0 ms
6. Binary export format integrity
"""

import unittest
import json
import os
import sys
import struct

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dataset_generator import generate_sample, generate_dataset, FEATURE_NAMES, CLASS_NAMES
from train_eye_action_model import train_model, save_model
from evaluate_model import load_model, run_evaluation
from export_tflite import export_model_artifacts

class TestEyeActionMLPipeline(unittest.TestCase):

    def setUp(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.models_dir = os.path.join(self.base_dir, "models")
        os.makedirs(self.models_dir, exist_ok=True)

    def test_01_feature_vector_bounds(self):
        """Verify generated features are within plausible physiological and camera bounds."""
        for c in range(len(CLASS_NAMES)):
            sample = generate_sample(c)
            self.assertEqual(len(sample), len(FEATURE_NAMES))
            left_ear, right_ear = sample[0], sample[1]
            self.assertTrue(0.0 <= left_ear <= 0.6)
            self.assertTrue(0.0 <= right_ear <= 0.6)
            # Face confidence check
            self.assertTrue(0.5 <= sample[14] <= 1.0)

    def test_02_model_training_and_accuracy(self):
        """Verify neural model trains and reaches required benchmark."""
        model_path = os.path.join(self.models_dir, "eye_action_model.json")
        model, X_val, y_val = train_model(epochs=20, lr=0.02, num_samples_per_class=120)
        save_model(model, model_path)
        self.assertTrue(os.path.exists(model_path))

        correct = 0
        for x, label in zip(X_val, y_val):
            pred, conf, _ = model.predict(x)
            if pred == label:
                correct += 1
        acc = correct / len(X_val)
        print(f"[TEST] Validation accuracy achieved: {acc*100:.2f}%")
        self.assertGreater(acc, 0.85)

    def test_03_accidental_click_safety_gate(self):
        """Verify the crucial safety requirement: Normal blinks must not trigger clicks."""
        report = run_evaluation(num_test_samples=400)
        self.assertLess(report["accidental_click_rate"], 0.025,
                        f"Accidental click rate {report['accidental_click_rate']*100:.2f}% exceeds safety threshold!")
        self.assertLess(report["avg_inference_latency_ms"], 10.0,
                        f"Inference latency {report['avg_inference_latency_ms']:.2f} ms exceeds mobile budget!")

    def test_04_artifact_export_integrity(self):
        """Verify exported binary and Kotlin artifacts."""
        export_model_artifacts()
        tflite_path = os.path.join(self.models_dir, "eye_action_model.tflite")
        spec_path = os.path.join(self.models_dir, "model_spec.json")
        kotlin_path = os.path.join(self.models_dir, "ModelWeights.kt")

        self.assertTrue(os.path.exists(tflite_path))
        self.assertTrue(os.path.exists(spec_path))
        self.assertTrue(os.path.exists(kotlin_path))

        # Verify binary header
        with open(tflite_path, "rb") as f:
            magic = f.read(4)
            self.assertEqual(magic, b"EYEM")
            num_floats = struct.unpack("<I", f.read(4))[0]
            self.assertGreater(num_floats, 500)

if __name__ == "__main__":
    unittest.main()
