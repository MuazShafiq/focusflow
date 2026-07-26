from __future__ import annotations

import argparse
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from .scorer import FEATURE_NAMES

MODEL_VERSION = "synthetic-hgb-v1"


def synthetic_dataset(size: int = 12_000, seed: int = 42):
    rng = np.random.default_rng(seed)
    hour = rng.uniform(7, 23, size)
    weekday = rng.integers(0, 7, size)
    energy = rng.beta(4, 2, size)
    difficulty = rng.integers(1, 6, size)
    priority = rng.integers(1, 6, size)
    time_match = rng.binomial(1, 0.36, size)
    deadline_pressure = rng.beta(2, 3, size)
    session_fraction = rng.uniform(0.15, 1, size)
    daily_load = rng.beta(2, 4, size)

    logits = (
        -1.4
        + 3.2 * energy
        + 1.3 * time_match
        + 1.0 * deadline_pressure
        + 0.3 * priority
        - 0.3 * difficulty
        - 1.2 * daily_load
        - 0.6 * np.maximum(session_fraction - 0.65, 0)
        - 0.08 * np.maximum(hour - 21, 0)
        + rng.normal(0, 0.25, size)
    )
    probability = 1 / (1 + np.exp(-logits))
    completed = rng.binomial(1, probability)
    features = np.column_stack(
        [
            hour,
            weekday,
            energy,
            difficulty,
            priority,
            time_match,
            deadline_pressure,
            session_fraction,
            daily_load,
        ]
    )
    return features, completed


def train(output: Path, size: int = 12_000) -> float:
    features, labels = synthetic_dataset(size=size)
    x_train, x_test, y_train, y_test = train_test_split(
        features,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels,
    )
    model = HistGradientBoostingClassifier(
        learning_rate=0.08,
        max_iter=180,
        max_leaf_nodes=20,
        l2_regularization=0.2,
        random_state=42,
    )
    model.fit(x_train, y_train)
    auc = float(roc_auc_score(y_test, model.predict_proba(x_test)[:, 1]))
    output.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "model": model,
            "version": MODEL_VERSION,
            "features": FEATURE_NAMES,
            "trainedAt": datetime.now(UTC).isoformat(),
            "syntheticRows": size,
            "validationAuc": auc,
        },
        output,
    )
    return auc


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parents[1] / "artifacts" / "completion_model.joblib",
    )
    parser.add_argument("--rows", type=int, default=12_000)
    args = parser.parse_args()
    auc = train(args.output, args.rows)
    print(f"Wrote {MODEL_VERSION} to {args.output} (validation AUC={auc:.3f})")


if __name__ == "__main__":
    main()
