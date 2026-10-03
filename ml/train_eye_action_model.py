"""
train_eye_action_model.py
Mobile-optimized neural network trainer for on-device eye action classification.
Architecture: 16 -> 32 (ReLU) -> 16 (ReLU) -> 6 (Softmax)
Optimized in-place gradient descent for high-speed execution.
"""

import json
import math
import random
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dataset_generator import FEATURE_NAMES, CLASS_NAMES, generate_dataset

def relu(x):
    return x if x > 0.0 else 0.0

def softmax(logits):
    max_logit = max(logits)
    exp_vals = [math.exp(l - max_logit) for l in logits]
    total = sum(exp_vals)
    return [e / total for e in exp_vals]

class MobileEyeActionModel:
    def __init__(self, input_dim=16, hidden1_dim=32, hidden2_dim=16, output_dim=6):
        self.input_dim = input_dim
        self.hidden1_dim = hidden1_dim
        self.hidden2_dim = hidden2_dim
        self.output_dim = output_dim

        # Xavier / He initialization
        def init_matrix(rows, cols, gain=1.0):
            bound = math.sqrt(6.0 / (rows + cols)) * gain
            return [[random.uniform(-bound, bound) for _ in range(cols)] for _ in range(rows)]

        self.W1 = init_matrix(hidden1_dim, input_dim, gain=math.sqrt(2.0))
        self.b1 = [0.0] * hidden1_dim
        self.W2 = init_matrix(hidden2_dim, hidden1_dim, gain=math.sqrt(2.0))
        self.b2 = [0.0] * hidden2_dim
        self.W3 = init_matrix(output_dim, hidden2_dim, gain=1.0)
        self.b3 = [0.0] * output_dim

        self.means = [0.0] * input_dim
        self.stds = [1.0] * input_dim

    def fit_normalizer(self, X):
        n = len(X)
        d = len(X[0])
        self.means = [sum(X[i][j] for i in range(n)) / n for j in range(d)]
        self.stds = []
        for j in range(d):
            variance = sum((X[i][j] - self.means[j]) ** 2 for i in range(n)) / n
            self.stds.append(math.sqrt(variance) if variance > 1e-7 else 1.0)

    def normalize(self, x):
        return [(x[j] - self.means[j]) / self.stds[j] for j in range(len(x))]

    def forward(self, x_norm):
        # Layer 1
        z1 = [sum(self.W1[i][j] * x_norm[j] for j in range(self.input_dim)) + self.b1[i] for i in range(self.hidden1_dim)]
        a1 = [relu(v) for v in z1]

        # Layer 2
        z2 = [sum(self.W2[i][j] * a1[j] for j in range(self.hidden1_dim)) + self.b2[i] for i in range(self.hidden2_dim)]
        a2 = [relu(v) for v in z2]

        # Output Layer
        z3 = [sum(self.W3[i][j] * a2[j] for j in range(self.hidden2_dim)) + self.b3[i] for i in range(self.output_dim)]
        probs = softmax(z3)

        return z1, a1, z2, a2, z3, probs

    def predict(self, raw_features):
        x_norm = self.normalize(raw_features)
        _, _, _, _, _, probs = self.forward(x_norm)
        pred_class = probs.index(max(probs))
        confidence = probs[pred_class]
        return pred_class, confidence, probs

def train_model(epochs=25, lr=0.02, l2_reg=0.0001, num_samples_per_class=200):
    random.seed(42)
    data = generate_dataset(num_samples_per_class=num_samples_per_class)
    
    X = [sample["features"] for sample in data]
    y = [sample["label"] for sample in data]

    split_idx = int(0.8 * len(X))
    X_train, y_train = X[:split_idx], y[:split_idx]
    X_val, y_val = X[split_idx:], y[split_idx:]

    model = MobileEyeActionModel()
    model.fit_normalizer(X_train)

    X_train_norm = [model.normalize(x) for x in X_train]
    X_val_norm = [model.normalize(x) for x in X_val]

    for epoch in range(1, epochs + 1):
        combined = list(zip(X_train_norm, y_train))
        random.shuffle(combined)

        for x_norm, label in combined:
            z1, a1, z2, a2, z3, probs = model.forward(x_norm)

            # dL/dz3
            dz3 = [probs[i] - (1.0 if i == label else 0.0) for i in range(model.output_dim)]

            # dL/da2
            da2 = [sum(model.W3[i][j] * dz3[i] for i in range(model.output_dim)) for j in range(model.hidden2_dim)]
            dz2 = [da2[j] if z2[j] > 0.0 else 0.0 for j in range(model.hidden2_dim)]

            # dL/da1
            da1 = [sum(model.W2[i][j] * dz2[i] for i in range(model.hidden2_dim)) for j in range(model.hidden1_dim)]
            dz1 = [da1[j] if z1[j] > 0.0 else 0.0 for j in range(model.hidden1_dim)]

            # In-place SGD updates (no intermediate matrix allocations)
            for i in range(model.output_dim):
                d = dz3[i]
                model.b3[i] -= lr * d
                w_row = model.W3[i]
                for j in range(model.hidden2_dim):
                    w_row[j] -= lr * (d * a2[j] + l2_reg * w_row[j])

            for i in range(model.hidden2_dim):
                d = dz2[i]
                model.b2[i] -= lr * d
                w_row = model.W2[i]
                for j in range(model.hidden1_dim):
                    w_row[j] -= lr * (d * a1[j] + l2_reg * w_row[j])

            for i in range(model.hidden1_dim):
                d = dz1[i]
                model.b1[i] -= lr * d
                w_row = model.W1[i]
                for j in range(model.input_dim):
                    w_row[j] -= lr * (d * x_norm[j] + l2_reg * w_row[j])

    return model, X_val, y_val

def save_model(model, filepath=None):
    if filepath is None:
        filepath = os.path.join(os.path.dirname(__file__), "models", "eye_action_model.json")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    model_dict = {
        "architecture": {
            "input_dim": model.input_dim,
            "hidden1_dim": model.hidden1_dim,
            "hidden2_dim": model.hidden2_dim,
            "output_dim": model.output_dim,
            "activation": "ReLU",
            "output_activation": "Softmax"
        },
        "feature_names": FEATURE_NAMES,
        "class_names": CLASS_NAMES,
        "normalization": {
            "means": [round(m, 6) for m in model.means],
            "stds": [round(s, 6) for s in model.stds]
        },
        "weights": {
            "W1": [[round(w, 6) for w in row] for row in model.W1],
            "b1": [round(b, 6) for b in model.b1],
            "W2": [[round(w, 6) for w in row] for row in model.W2],
            "b2": [round(b, 6) for b in model.b2],
            "W3": [[round(w, 6) for w in row] for row in model.W3],
            "b3": [round(b, 6) for b in model.b3]
        },
        "version": "1.0.0",
        "mobile_target": "Android CameraX / TFLite runtime"
    }
    with open(filepath, "w") as f:
        json.dump(model_dict, f, indent=2)
    print(f"Model saved to {filepath}")

if __name__ == "__main__":
    model, X_val, y_val = train_model(epochs=20)
    save_model(model)
