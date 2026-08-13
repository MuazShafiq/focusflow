# Scheduler service

- Location: `services/scheduler`; Flask/scikit-learn Python service.
- `app.py:create_app` exposes the HTTP boundary and authenticates API-to-scheduler requests with the internal service token.
- `focusflow_scheduler/engine.py:SchedulingEngine` protects fixed commitments/locked blocks, inserts enabled lifestyle targets, finds feasible task slots, and reports work that does not fit.
- `scorer.py:CompletionScorer` ranks feasible candidates using the checked-in completion model plus per-user feedback profile.
- `validation.py` owns payload/timezone/numeric boundary validation. Keep the scheduler independent of MongoDB and user credentials.
- `training.py` reproduces the synthetic bootstrap classifier; the checked-in `artifacts/completion_model.joblib` is intentionally retained.
- ML scores may rank feasible slots only; constraint logic remains authoritative.
- Python checks and completion flow: `mem:task_completion`.