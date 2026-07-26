FROM node:22-bookworm-slim AS api-build

WORKDIR /app
COPY tsconfig.base.json ./
COPY services/api/package.json services/api/package.json
COPY services/api/tsconfig.json services/api/tsconfig.json
WORKDIR /app/services/api
RUN npm install
WORKDIR /app
COPY services/api/src services/api/src
RUN npm run build --prefix services/api \
    && npm prune --omit=dev --prefix services/api

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=10000 \
    SCHEDULER_URL=http://127.0.0.1:5001 \
    MODEL_ARTIFACT_PATH=/app/services/scheduler/artifacts/completion_model.joblib \
    PATH=/opt/focusflow-venv/bin:$PATH

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/focusflow-venv

WORKDIR /app
COPY services/scheduler/requirements-prod.txt services/scheduler/requirements.txt services/scheduler/
RUN pip install --no-cache-dir -r services/scheduler/requirements-prod.txt

COPY --from=api-build /app/services/api/dist services/api/dist
COPY --from=api-build /app/services/api/node_modules services/api/node_modules
COPY --from=api-build /app/services/api/package.json services/api/package.json
COPY services/scheduler services/scheduler
RUN python -m services.scheduler.focusflow_scheduler.training --rows 12000

EXPOSE 10000

CMD ["sh", "-c", "gunicorn --bind 127.0.0.1:5001 --workers 1 --threads 2 --timeout 60 services.scheduler.app:app & exec node services/api/dist/server.js"]
