from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import joblib
import numpy as np

FEATURE_NAMES = [
    "hour",
    "weekday",
    "energy",
    "difficulty",
    "priority",
    "time_preference_match",
    "deadline_pressure",
    "session_fraction",
    "daily_load",
]


def time_bucket(hour: int) -> str:
    if hour < 12:
        return "morning"
    if hour < 17:
        return "afternoon"
    return "evening"


@dataclass(slots=True)
class CompletionScorer:
    artifact_path: Path
    _model: Any | None = field(init=False, default=None, repr=False)
    version: str = field(init=False, default="heuristic-v1")

    def __post_init__(self) -> None:
        if self.artifact_path.exists():
            artifact = joblib.load(self.artifact_path)
            self._model = artifact["model"]
            self.version = str(artifact.get("version", "synthetic-ml-v1"))

    @property
    def uses_ml(self) -> bool:
        return self._model is not None

    def features(
        self,
        *,
        start: datetime,
        energy: float,
        difficulty: int,
        priority: int,
        preferred_time: str,
        deadline_pressure: float,
        session_minutes: int,
        daily_load_minutes: int,
    ) -> np.ndarray:
        return np.asarray(
            [
                [
                    start.hour + start.minute / 60,
                    start.weekday(),
                    energy,
                    difficulty,
                    priority,
                    float(time_bucket(start.hour) == preferred_time),
                    deadline_pressure,
                    min(session_minutes / 120, 1),
                    min(daily_load_minutes / 480, 1),
                ]
            ],
            dtype=np.float64,
        )

    def score(self, **kwargs: Any) -> float:
        features = self.features(**kwargs)
        if self._model is not None:
            return float(self._model.predict_proba(features)[0, 1])

        (
            hour,
            _weekday,
            energy,
            difficulty,
            priority,
            time_match,
            deadline_pressure,
            session_fraction,
            daily_load,
        ) = features[0]
        morning_bonus = 0.05 if 7 <= hour <= 11 else 0
        value = (
            0.22
            + energy * 0.28
            + time_match * 0.16
            + deadline_pressure * 0.12
            + priority / 5 * 0.12
            + morning_bonus
            - difficulty / 5 * 0.08
            - max(session_fraction - 0.6, 0) * 0.1
            - daily_load * 0.15
        )
        return float(np.clip(value, 0.05, 0.98))
