from __future__ import annotations

import hmac
import os

from flask import Flask, jsonify, request

from services.scheduler.focusflow_scheduler.engine import SchedulingEngine
from services.scheduler.focusflow_scheduler.validation import ValidationError


def create_app() -> Flask:
    app = Flask(__name__)
    engine = SchedulingEngine()

    @app.get("/health")
    def health():
        return jsonify(
            {
                "status": "ok",
                "service": "focusflow-scheduler",
                "modelVersion": engine.model_version,
            }
        )

    @app.get("/v1/model/info")
    def model_info():
        return jsonify(engine.model_info())

    @app.post("/v1/schedules/generate")
    def generate_schedule():
        expected_token = os.getenv(
            "SCHEDULER_SERVICE_TOKEN", "development-scheduler-token"
        )
        supplied_token = request.headers.get("x-service-token", "")
        if not hmac.compare_digest(expected_token, supplied_token):
            return jsonify({"error": {"message": "Unauthorized"}}), 401

        try:
            payload = request.get_json(force=True)
            result = engine.generate(payload)
            return jsonify(result), 201
        except ValidationError as error:
            return jsonify({"error": {"message": str(error)}}), 400
        except Exception:
            app.logger.exception("Schedule generation failed")
            return (
                jsonify(
                    {
                        "error": {
                            "message": "The scheduler could not generate a plan"
                        }
                    }
                ),
                500,
            )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("SCHEDULER_PORT", "5001")))
