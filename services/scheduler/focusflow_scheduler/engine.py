from __future__ import annotations

import os
import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

from .scorer import CompletionScorer, time_bucket
from .validation import (
    ValidationError,
    clamp_number,
    parse_datetime,
    parse_timezone,
    require_mapping,
)


@dataclass(slots=True)
class Interval:
    start: datetime
    end: datetime

    def overlaps(self, other: Interval) -> bool:
        return self.start < other.end and self.end > other.start


def parse_clock(value: str, field: str) -> time:
    try:
        return time.fromisoformat(value)
    except (TypeError, ValueError) as error:
        raise ValidationError(f"{field} must use HH:MM format") from error


def iso(value: datetime) -> str:
    return value.isoformat()


class SchedulingEngine:
    def __init__(self, artifact_path: Path | None = None) -> None:
        configured = os.getenv("MODEL_ARTIFACT_PATH")
        path = (
            artifact_path
            or (Path(configured) if configured else None)
            or Path(__file__).parents[1] / "artifacts" / "completion_model.joblib"
        )
        self.scorer = CompletionScorer(path)

    @property
    def model_version(self) -> str:
        return self.scorer.version

    def model_info(self) -> dict[str, Any]:
        return {
            "version": self.model_version,
            "usesMachineLearning": self.scorer.uses_ml,
            "fallback": None if self.scorer.uses_ml else "explainable-heuristic",
        }

    def generate(self, raw_payload: Any) -> dict[str, Any]:
        payload = require_mapping(raw_payload)
        preferences = require_mapping(payload.get("preferences"))
        timezone = parse_timezone(preferences.get("timezone"))
        range_start = parse_datetime(payload.get("rangeStart"), "rangeStart").astimezone(
            timezone
        )
        range_end = parse_datetime(payload.get("rangeEnd"), "rangeEnd").astimezone(
            timezone
        )
        if range_end <= range_start:
            raise ValidationError("rangeEnd must be after rangeStart")
        if range_end - range_start > timedelta(days=14):
            raise ValidationError("Schedule range cannot exceed fourteen days")

        day_start = parse_clock(
            str(preferences.get("dayStart", "07:00")), "preferences.dayStart"
        )
        day_end = parse_clock(
            str(preferences.get("dayEnd", "23:00")), "preferences.dayEnd"
        )
        focus_minutes = int(
            clamp_number(
                preferences.get("focusSessionMinutes", 50),
                "preferences.focusSessionMinutes",
                20,
                120,
            )
        )
        break_minutes = int(
            clamp_number(
                preferences.get("shortBreakMinutes", 10),
                "preferences.shortBreakMinutes",
                5,
                30,
            )
        )
        preferred_study_time = str(
            preferences.get("preferredStudyTime", "morning")
        )
        energy_by_time = preferences.get("energyByTime") or {}
        learning_profile = payload.get("learningProfile") or {}

        blocks: list[dict[str, Any]] = []
        busy: list[Interval] = []
        daily_load: dict[date, int] = {}
        protected_exercise_minutes = 0
        auto_schedule_lifestyle = bool(
            preferences.get("autoScheduleLifestyle", True)
        )

        for item in payload.get("commitments") or []:
            commitment = require_mapping(item)
            start = parse_datetime(
                commitment.get("startAt"), "commitments.startAt"
            ).astimezone(timezone)
            end = parse_datetime(
                commitment.get("endAt"), "commitments.endAt"
            ).astimezone(timezone)
            if end <= start:
                raise ValidationError("A commitment ends before it starts")
            category = str(commitment.get("category", "")).strip().lower()
            block_type = (
                "exercise"
                if category in {"exercise", "fitness", "sport", "sports"}
                else "commitment"
            )
            if block_type == "exercise":
                protected_exercise_minutes += round(
                    (end - start).total_seconds() / 60
                )
            busy.append(Interval(start, end))
            source_id = str(commitment.get("id", "")) or None
            title = str(commitment.get("title", "Commitment"))
            title_words = set(title.strip().lower().replace("-", " ").split())
            is_work_commitment = (
                category in {"work", "job"}
                or "work" in title_words
                or "shift" in title_words
            )
            lunch_start = self._on_date(
                start.date(), time(12, 30), range_start.tzinfo
            )
            lunch_end = lunch_start + timedelta(minutes=30)
            split_for_lunch = (
                auto_schedule_lifestyle
                and is_work_commitment
                and start < lunch_start
                and lunch_end < end
            )
            commitment_segments = (
                [
                    (title, block_type, start, lunch_start, True),
                    ("Lunch", "meal", lunch_start, lunch_end, False),
                    (title, block_type, lunch_end, end, True),
                ]
                if split_for_lunch
                else [(title, block_type, start, end, True)]
            )
            for (
                segment_title,
                segment_type,
                segment_start,
                segment_end,
                locked,
            ) in commitment_segments:
                blocks.append(
                    self._block(
                        source_id=source_id if segment_type != "meal" else None,
                        title=segment_title,
                        block_type=segment_type,
                        start=segment_start,
                        end=segment_end,
                        rationale=(
                            "Protected lunch inside your workday."
                            if segment_type == "meal"
                            else "A fixed commitment you asked FocusFlow to protect."
                        ),
                        locked=locked,
                    )
                )

        for item in payload.get("lockedBlocks") or []:
            locked = require_mapping(item)
            start = parse_datetime(
                locked.get("startAt"), "lockedBlocks.startAt"
            ).astimezone(timezone)
            end = parse_datetime(
                locked.get("endAt"), "lockedBlocks.endAt"
            ).astimezone(timezone)
            busy.append(Interval(start, end))
            blocks.append(
                self._block(
                    source_id=str(locked.get("sourceId", "")) or None,
                    title=str(locked.get("title", "Locked block")),
                    block_type=str(locked.get("type", "task")),
                    start=start,
                    end=end,
                    rationale="Kept in place because you locked this block.",
                    locked=True,
                )
            )

        if auto_schedule_lifestyle:
            self._schedule_lifestyle(
                range_start=range_start,
                range_end=range_end,
                day_start=day_start,
                day_end=day_end,
                exercise_minutes=int(preferences.get("exerciseMinutesPerWeek", 150)),
                protected_exercise_minutes=protected_exercise_minutes,
                leisure_minutes=int(preferences.get("leisureMinutesPerDay", 45)),
                busy=busy,
                blocks=blocks,
            )

        tasks = [require_mapping(item) for item in payload.get("tasks") or []]
        tasks.sort(
            key=lambda task: (
                parse_datetime(task.get("dueAt"), "tasks.dueAt"),
                -int(task.get("priority", 3)),
            )
        )
        unscheduled: list[dict[str, Any]] = []

        for task in tasks:
            remaining = int(
                clamp_number(
                    task.get("remainingMinutes", 0),
                    "tasks.remainingMinutes",
                    0,
                    2400,
                )
            )
            original_remaining = remaining
            deadline = parse_datetime(task.get("dueAt"), "tasks.dueAt").astimezone(
                timezone
            )
            priority = int(
                clamp_number(task.get("priority", 3), "tasks.priority", 1, 5)
            )
            difficulty = int(
                clamp_number(task.get("difficulty", 3), "tasks.difficulty", 1, 5)
            )
            preferred_time = str(
                task.get("preferredTimeOfDay") or preferred_study_time
            )

            while remaining > 0:
                duration = min(focus_minutes, remaining)
                candidate = self._best_slot(
                    range_start=range_start,
                    range_end=min(range_end, deadline),
                    day_start=day_start,
                    day_end=day_end,
                    duration_minutes=duration,
                    deadline=deadline,
                    energy_by_time=energy_by_time,
                    difficulty=difficulty,
                    priority=priority,
                    preferred_time=preferred_time,
                    daily_load=daily_load,
                    busy=busy,
                    learning_profile=learning_profile,
                )
                if candidate is None and duration > 15:
                    duration = 15
                    candidate = self._best_slot(
                        range_start=range_start,
                        range_end=min(range_end, deadline),
                        day_start=day_start,
                        day_end=day_end,
                        duration_minutes=duration,
                        deadline=deadline,
                        energy_by_time=energy_by_time,
                        difficulty=difficulty,
                        priority=priority,
                        preferred_time=preferred_time,
                        daily_load=daily_load,
                        busy=busy,
                        learning_profile=learning_profile,
                    )
                if candidate is None:
                    break

                start, score = candidate
                end = start + timedelta(minutes=duration)
                busy.append(Interval(start, end))
                daily_load[start.date()] = daily_load.get(start.date(), 0) + duration
                remaining -= duration
                blocks.append(
                    self._block(
                        source_id=str(task.get("id", "")) or None,
                        title=str(task.get("title", "Focus session")),
                        block_type="task",
                        start=start,
                        end=end,
                        rationale=(
                            f"Scheduled before its deadline during a "
                            f"{time_bucket(start.hour)} period with an estimated "
                            f"{round(score * 100)}% completion fit."
                        ),
                        score=round(score, 4),
                    )
                )

                if remaining > 0:
                    break_interval = Interval(
                        end, end + timedelta(minutes=break_minutes)
                    )
                    if (
                        break_interval.end <= self._on_date(start.date(), day_end, timezone)
                        and self._is_free(break_interval, busy)
                    ):
                        busy.append(break_interval)
                        blocks.append(
                            self._block(
                                title="Reset break",
                                block_type="break",
                                start=break_interval.start,
                                end=break_interval.end,
                                rationale="A short reset to protect focus quality.",
                            )
                        )

            if remaining:
                unscheduled.append(
                    {
                        "taskId": str(task.get("id", "")),
                        "title": str(task.get("title", "Task")),
                        "scheduledMinutes": original_remaining - remaining,
                        "unscheduledMinutes": remaining,
                        "reason": "Not enough free time before the deadline.",
                    }
                )

        blocks.sort(key=lambda block: block["startAt"])
        return {
            "modelVersion": self.model_version,
            "blocks": blocks,
            "warnings": unscheduled,
            "summary": {
                "scheduledTaskMinutes": sum(
                    int(
                        (
                            datetime.fromisoformat(block["endAt"])
                            - datetime.fromisoformat(block["startAt"])
                        ).total_seconds()
                        // 60
                    )
                    for block in blocks
                    if block["type"] == "task"
                ),
                "unscheduledTaskMinutes": sum(
                    warning["unscheduledMinutes"] for warning in unscheduled
                ),
            },
        }

    def _best_slot(
        self,
        *,
        range_start: datetime,
        range_end: datetime,
        day_start: time,
        day_end: time,
        duration_minutes: int,
        deadline: datetime,
        energy_by_time: dict[str, Any],
        difficulty: int,
        priority: int,
        preferred_time: str,
        daily_load: dict[date, int],
        busy: list[Interval],
        learning_profile: dict[str, Any],
    ) -> tuple[datetime, float] | None:
        if range_end <= range_start:
            return None
        candidates: list[tuple[datetime, float]] = []
        current_day = range_start.date()
        final_day = range_end.date()
        while current_day <= final_day:
            window_start = max(
                self._on_date(current_day, day_start, range_start.tzinfo),
                range_start,
            )
            window_end = min(
                self._on_date(current_day, day_end, range_start.tzinfo),
                range_end,
                deadline,
            )
            cursor = self._ceil_minutes(window_start, 15)
            while cursor + timedelta(minutes=duration_minutes) <= window_end:
                interval = Interval(
                    cursor, cursor + timedelta(minutes=duration_minutes)
                )
                if self._is_free(interval, busy):
                    bucket = time_bucket(cursor.hour)
                    energy = float(energy_by_time.get(bucket, 0.65))
                    seconds_to_deadline = max(
                        (deadline - cursor).total_seconds(), 1
                    )
                    pressure = max(
                        0.0, min(1.0, 1 - seconds_to_deadline / (7 * 86_400))
                    )
                    base_score = self.scorer.score(
                        start=cursor,
                        energy=energy,
                        difficulty=difficulty,
                        priority=priority,
                        preferred_time=preferred_time,
                        deadline_pressure=pressure,
                        session_minutes=duration_minutes,
                        daily_load_minutes=daily_load.get(current_day, 0),
                    )
                    personal_score = max(
                        0.0,
                        min(1.0, float(learning_profile.get(bucket, 0.5))),
                    )
                    score = base_score * 0.8 + personal_score * 0.2
                    candidates.append((cursor, score))
                cursor += timedelta(minutes=15)
            current_day += timedelta(days=1)

        if not candidates:
            return None
        return max(
            candidates,
            key=lambda item: (
                item[1],
                -item[0].timestamp(),
            ),
        )

    def _schedule_lifestyle(
        self,
        *,
        range_start: datetime,
        range_end: datetime,
        day_start: time,
        day_end: time,
        exercise_minutes: int,
        protected_exercise_minutes: int,
        leisure_minutes: int,
        busy: list[Interval],
        blocks: list[dict[str, Any]],
    ) -> None:
        days = max(1, (range_end.date() - range_start.date()).days + 1)
        exercise_budget = max(
            0,
            round(exercise_minutes * min(days, 7) / 7)
            - protected_exercise_minutes,
        )
        exercise_days = max(0, min(days, round(exercise_budget / 30)))
        exercise_scheduled = 0

        current_day = range_start.date()
        day_index = 0
        while current_day <= range_end.date():
            day_window_start = self._on_date(current_day, day_start, range_start.tzinfo)
            day_window_end = self._on_date(current_day, day_end, range_start.tzinfo)

            meals = [
                ("Lunch", time(12, 30), (30,)),
                ("Dinner", time(19, 0), (45, 30)),
            ]
            for title, clock, durations in meals:
                already_scheduled = any(
                    block["type"] == "meal"
                    and block["title"] == title
                    and datetime.fromisoformat(block["startAt"]).date()
                    == current_day
                    for block in blocks
                )
                if already_scheduled:
                    continue

                preferred_start = self._on_date(
                    current_day, clock, range_start.tzinfo
                )
                interval = None
                for step in range(13):
                    candidate_start = preferred_start + timedelta(
                        minutes=step * 15
                    )
                    for duration in durations:
                        candidate = Interval(
                            candidate_start,
                            candidate_start + timedelta(minutes=duration),
                        )
                        if (
                            candidate.start >= range_start
                            and candidate.end <= range_end
                            and candidate.start >= day_window_start
                            and candidate.end <= day_window_end
                            and self._is_free(candidate, busy)
                        ):
                            interval = candidate
                            break
                    if interval:
                        break

                if interval:
                    busy.append(interval)
                    blocks.append(
                        self._block(
                            title=title,
                            block_type="meal",
                            start=interval.start,
                            end=interval.end,
                            rationale="Protected time for a sustainable daily rhythm.",
                        )
                    )

            if day_index < exercise_days and exercise_scheduled < exercise_budget:
                duration = min(30, exercise_budget - exercise_scheduled)
                start = self._on_date(current_day, time(17, 30), range_start.tzinfo)
                interval = Interval(start, start + timedelta(minutes=duration))
                if (
                    interval.start >= range_start
                    and interval.end <= range_end
                    and self._is_free(interval, busy)
                ):
                    busy.append(interval)
                    exercise_scheduled += duration
                    blocks.append(
                        self._block(
                            title="Movement",
                            block_type="exercise",
                            start=interval.start,
                            end=interval.end,
                            rationale="Progress toward your weekly movement target.",
                        )
                    )

            if leisure_minutes > 0:
                leisure_end = day_window_end - timedelta(minutes=30)
                interval = Interval(
                    leisure_end - timedelta(minutes=leisure_minutes),
                    leisure_end,
                )
                if (
                    interval.start >= range_start
                    and interval.end <= range_end
                    and self._is_free(interval, busy)
                ):
                    busy.append(interval)
                    blocks.append(
                        self._block(
                            title="Unstructured time",
                            block_type="leisure",
                            start=interval.start,
                            end=interval.end,
                            rationale="Rest is scheduled so productivity stays sustainable.",
                        )
                    )

            current_day += timedelta(days=1)
            day_index += 1

    @staticmethod
    def _is_free(candidate: Interval, busy: list[Interval]) -> bool:
        return not any(candidate.overlaps(interval) for interval in busy)

    @staticmethod
    def _on_date(day: date, clock: time, timezone: ZoneInfo) -> datetime:
        return datetime.combine(day, clock, tzinfo=timezone)

    @staticmethod
    def _ceil_minutes(value: datetime, increment: int) -> datetime:
        discarded = timedelta(
            minutes=value.minute % increment,
            seconds=value.second,
            microseconds=value.microsecond,
        )
        value -= discarded
        if discarded:
            value += timedelta(minutes=increment)
        return value

    @staticmethod
    def _block(
        *,
        title: str,
        block_type: str,
        start: datetime,
        end: datetime,
        rationale: str,
        source_id: str | None = None,
        locked: bool = False,
        score: float | None = None,
    ) -> dict[str, Any]:
        block = {
            "clientId": str(uuid.uuid4()),
            "title": title,
            "type": block_type,
            "startAt": iso(start),
            "endAt": iso(end),
            "locked": locked,
            "status": "planned",
            "rationale": rationale,
        }
        if source_id:
            block["sourceId"] = source_id
        if score is not None:
            block["score"] = score
        return block
