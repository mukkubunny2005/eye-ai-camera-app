"""
dataset_generator.py
Synthetic and recorded dataset generator for on-device eye action classification.
Generates temporal feature vectors across 6 classes:
0: NORMAL_BLINK (involuntary, duration 80-200ms)
1: DELIBERATE_CLICK (intentional eye squeeze, duration 250-500ms)
2: GAZE_DWELL (stable gaze on target, duration >600ms)
3: DOUBLE_BLINK (two rapid blinks within 400ms)
4: EMERGENCY_PAUSE (extended long blink 800-1500ms)
5: SACCADE_REST (natural eye motion, reading, looking around)
"""

import math
import random
import json
import os

FEATURE_NAMES = [
    "left_ear",           # Left eye aspect ratio (0.0 to 0.45)
    "right_ear",          # Right eye aspect ratio (0.0 to 0.45)
    "ear_diff",           # Absolute difference between left and right EAR
    "left_iris_norm_x",   # Iris center relative to left eye inner/outer corner (-1.0 to 1.0)
    "left_iris_norm_y",   # Iris center relative to left eye top/bottom (-1.0 to 1.0)
    "right_iris_norm_x",  # Iris center relative to right eye (-1.0 to 1.0)
    "right_iris_norm_y",  # Iris center relative to right eye (-1.0 to 1.0)
    "head_yaw",           # Head horizontal rotation (-45 to 45 deg)
    "head_pitch",         # Head vertical tilt (-30 to 30 deg)
    "head_roll",          # Head roll tilt (-20 to 20 deg)
    "ear_velocity",       # Rate of change of EAR (1/sec)
    "gaze_velocity",      # Iris motion speed (deg/sec)
    "event_duration_ms",  # Duration of the current temporal state (ms)
    "gaze_stability",     # Variance of gaze position over last 300ms (0 to 1)
    "face_confidence",    # MediaPipe face tracking confidence (0.0 to 1.0)
    "ambient_light_norm"  # Normalized ambient brightness (0.0 to 1.0)
]

CLASS_NAMES = [
    "NORMAL_BLINK",
    "DELIBERATE_CLICK",
    "GAZE_DWELL",
    "DOUBLE_BLINK",
    "EMERGENCY_PAUSE",
    "SACCADE_REST"
]

def generate_sample(class_idx: int) -> list:
    """Generate a realistic 16-dimensional feature vector for a given class."""
    noise = random.gauss(0, 0.02)
    face_conf = min(1.0, max(0.65, random.gauss(0.92, 0.05)))
    ambient_light = min(1.0, max(0.2, random.gauss(0.7, 0.15)))
    head_yaw = random.gauss(0.0, 5.0)
    head_pitch = random.gauss(-2.0, 4.0)
    head_roll = random.gauss(0.0, 3.0)

    if class_idx == 0:  # NORMAL_BLINK
        # Brief involuntary blink: low EAR, short duration, high velocity
        left_ear = max(0.04, min(0.12, random.gauss(0.08, 0.02)))
        right_ear = max(0.04, min(0.12, random.gauss(left_ear, 0.01)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = random.gauss(0.0, 0.1)
        left_iris_y = random.gauss(0.0, 0.1)
        right_iris_x = left_iris_x + random.gauss(0.0, 0.03)
        right_iris_y = left_iris_y + random.gauss(0.0, 0.03)
        ear_velocity = random.uniform(1.8, 3.5)
        gaze_velocity = random.uniform(2.0, 10.0)
        duration_ms = random.uniform(90, 220)
        stability = random.uniform(0.3, 0.7)

    elif class_idx == 1:  # DELIBERATE_CLICK
        # Intentional eye squeeze: very low EAR, sustained duration (280 - 550ms)
        left_ear = max(0.02, min(0.08, random.gauss(0.05, 0.015)))
        right_ear = max(0.02, min(0.08, random.gauss(left_ear, 0.01)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = random.gauss(0.0, 0.08)
        left_iris_y = random.gauss(0.0, 0.08)
        right_iris_x = left_iris_x + random.gauss(0.0, 0.02)
        right_iris_y = left_iris_y + random.gauss(0.0, 0.02)
        ear_velocity = random.uniform(0.8, 1.6)
        gaze_velocity = random.uniform(0.5, 3.0)
        duration_ms = random.uniform(280, 550)
        stability = random.uniform(0.75, 0.95)

    elif class_idx == 2:  # GAZE_DWELL
        # Open eyes, highly stable position for >600ms
        left_ear = max(0.24, min(0.38, random.gauss(0.31, 0.03)))
        right_ear = max(0.24, min(0.38, random.gauss(left_ear, 0.015)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = random.gauss(0.0, 0.4)
        left_iris_y = random.gauss(0.0, 0.3)
        right_iris_x = left_iris_x + random.gauss(0.0, 0.02)
        right_iris_y = left_iris_y + random.gauss(0.0, 0.02)
        ear_velocity = random.uniform(0.0, 0.2)
        gaze_velocity = random.uniform(0.1, 0.8)
        duration_ms = random.uniform(600, 1400)
        stability = random.uniform(0.88, 0.99)

    elif class_idx == 3:  # DOUBLE_BLINK
        # Two rapid closures with a micro-interval
        left_ear = max(0.05, min(0.14, random.gauss(0.09, 0.02)))
        right_ear = max(0.05, min(0.14, random.gauss(left_ear, 0.01)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = random.gauss(0.0, 0.15)
        left_iris_y = random.gauss(0.0, 0.15)
        right_iris_x = left_iris_x + random.gauss(0.0, 0.03)
        right_iris_y = left_iris_y + random.gauss(0.0, 0.03)
        ear_velocity = random.uniform(2.5, 4.5)
        gaze_velocity = random.uniform(1.0, 6.0)
        duration_ms = random.uniform(320, 480)
        stability = random.uniform(0.4, 0.75)

    elif class_idx == 4:  # EMERGENCY_PAUSE
        # Prolonged closed eye: >850ms, deliberate kill-switch gesture
        left_ear = max(0.01, min(0.06, random.gauss(0.03, 0.01)))
        right_ear = max(0.01, min(0.06, random.gauss(left_ear, 0.008)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = 0.0
        left_iris_y = 0.0
        right_iris_x = 0.0
        right_iris_y = 0.0
        ear_velocity = random.uniform(0.0, 0.3)
        gaze_velocity = 0.0
        duration_ms = random.uniform(850, 1600)
        stability = 0.99

    else:  # 5: SACCADE_REST
        # Natural scanning and reading: normal open eyes, shifting gaze
        left_ear = max(0.22, min(0.36, random.gauss(0.29, 0.03)))
        right_ear = max(0.22, min(0.36, random.gauss(left_ear, 0.02)))
        ear_diff = abs(left_ear - right_ear)
        left_iris_x = random.gauss(0.0, 0.5)
        left_iris_y = random.gauss(0.0, 0.4)
        right_iris_x = left_iris_x + random.gauss(0.0, 0.03)
        right_iris_y = left_iris_y + random.gauss(0.0, 0.03)
        ear_velocity = random.uniform(0.1, 0.5)
        gaze_velocity = random.uniform(3.5, 25.0)
        duration_ms = random.uniform(150, 700)
        stability = random.uniform(0.15, 0.55)

    features = [
        round(left_ear, 4),
        round(right_ear, 4),
        round(ear_diff, 4),
        round(left_iris_x, 4),
        round(left_iris_y, 4),
        round(right_iris_x, 4),
        round(right_iris_y, 4),
        round(head_yaw, 2),
        round(head_pitch, 2),
        round(head_roll, 2),
        round(ear_velocity, 3),
        round(gaze_velocity, 2),
        round(duration_ms, 1),
        round(stability, 3),
        round(face_conf, 3),
        round(ambient_light, 3)
    ]
    return features

def generate_dataset(num_samples_per_class=500):
    dataset = []
    for c_idx in range(len(CLASS_NAMES)):
        for _ in range(num_samples_per_class):
            feat = generate_sample(c_idx)
            dataset.append({"features": feat, "label": c_idx, "class_name": CLASS_NAMES[c_idx]})
    random.shuffle(dataset)
    return dataset

if __name__ == "__main__":
    os.makedirs("ml/data", exist_ok=True)
    data = generate_dataset(600)
    out_file = "ml/data/eye_action_dataset.json"
    with open(out_file, "w") as f:
        json.dump({
            "features": FEATURE_NAMES,
            "classes": CLASS_NAMES,
            "num_samples": len(data),
            "samples": data
        }, f, indent=2)
    print(f"Generated {len(data)} samples saved to {out_file}")
