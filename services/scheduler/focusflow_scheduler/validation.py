from __future__ import annotations

from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


class ValidationError(ValueError):
    """Raised when an API payload cannot be scheduled safely."""


def require_mapping(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValidationError("Request body must be a JSON object")
    return payload


def parse_datetime(value: Any, field: str) -> datetime:
    if not isinstance(value, str):
        raise ValidationError(f"{field} must be an ISO-8601 timestamp")
    try:
        parsed = datetime.fromisoformat(value)
    except ValueError as error:
        raise ValidationError(f"{field} must be an ISO-8601 timestamp") from error
    if parsed.tzinfo is None:
        raise ValidationError(f"{field} must include a timezone offset")
    return parsed


def parse_timezone(value: Any) -> ZoneInfo:
    try:
        return ZoneInfo(str(value or "UTC"))
    except ZoneInfoNotFoundError as error:
        raise ValidationError("preferences.timezone is not recognized") from error


def clamp_number(
    value: Any,
    field: str,
    minimum: float,
    maximum: float,
) -> float:
    try:
        numeric = float(value)
    except (TypeError, ValueError) as error:
        raise ValidationError(f"{field} must be a number") from error
    if not minimum <= numeric <= maximum:
        raise ValidationError(
            f"{field} must be between {minimum:g} and {maximum:g}"
        )
    return numeric
