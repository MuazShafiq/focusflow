from datetime import UTC, datetime, timedelta
from pathlib import Path

from services.scheduler.focusflow_scheduler.engine import SchedulingEngine


def payload():
    start = datetime(2026, 7, 27, tzinfo=UTC)
    return {
        "rangeStart": start.isoformat(),
        "rangeEnd": (start + timedelta(days=2)).isoformat(),
        "preferences": {
            "timezone": "UTC",
            "dayStart": "07:00",
            "dayEnd": "23:00",
            "focusSessionMinutes": 50,
            "shortBreakMinutes": 10,
            "preferredStudyTime": "morning",
            "energyByTime": {
                "morning": 0.9,
                "afternoon": 0.6,
                "evening": 0.4,
            },
            "exerciseMinutesPerWeek": 150,
            "leisureMinutesPerDay": 45,
            "autoScheduleLifestyle": True,
        },
        "tasks": [
            {
                "id": "task-1",
                "title": "Prepare algorithms chapter",
                "dueAt": (start + timedelta(days=1, hours=20)).isoformat(),
                "remainingMinutes": 120,
                "priority": 5,
                "difficulty": 4,
                "preferredTimeOfDay": "morning",
            }
        ],
        "commitments": [
            {
                "id": "class-1",
                "title": "Class",
                "startAt": (start + timedelta(hours=9)).isoformat(),
                "endAt": (start + timedelta(hours=11)).isoformat(),
            }
        ],
        "lockedBlocks": [],
    }


def intervals_overlap(first, second):
    return first["startAt"] < second["endAt"] and first["endAt"] > second["startAt"]


def test_generates_non_overlapping_task_blocks(tmp_path: Path):
    engine = SchedulingEngine(tmp_path / "missing-model.joblib")
    result = engine.generate(payload())
    task_blocks = [block for block in result["blocks"] if block["type"] == "task"]
    commitment = next(
        block for block in result["blocks"] if block["type"] == "commitment"
    )

    assert sum(
        (
            datetime.fromisoformat(block["endAt"])
            - datetime.fromisoformat(block["startAt"])
        ).total_seconds()
        / 60
        for block in task_blocks
    ) == 120
    assert all(not intervals_overlap(block, commitment) for block in task_blocks)
    assert result["warnings"] == []


def test_reports_minutes_that_do_not_fit(tmp_path: Path):
    request = payload()
    request["rangeEnd"] = (
        datetime.fromisoformat(request["rangeStart"]) + timedelta(hours=8)
    ).isoformat()
    request["tasks"][0]["dueAt"] = request["rangeEnd"]
    request["tasks"][0]["remainingMinutes"] = 600

    result = SchedulingEngine(tmp_path / "missing-model.joblib").generate(request)

    assert result["warnings"]
    assert result["warnings"][0]["unscheduledMinutes"] > 0


def test_real_feedback_profile_changes_slot_ranking(tmp_path: Path):
    request = payload()
    request["preferences"]["autoScheduleLifestyle"] = False
    request["preferences"]["energyByTime"] = {
        "morning": 0.6,
        "afternoon": 0.6,
        "evening": 0.6,
    }
    request["tasks"][0]["remainingMinutes"] = 30
    request["learningProfile"] = {
        "morning": 0.0,
        "afternoon": 0.0,
        "evening": 1.0,
    }

    result = SchedulingEngine(tmp_path / "missing-model.joblib").generate(request)
    task_block = next(block for block in result["blocks"] if block["type"] == "task")

    assert datetime.fromisoformat(task_block["startAt"]).hour >= 17
