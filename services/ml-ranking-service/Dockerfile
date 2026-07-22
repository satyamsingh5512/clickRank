FROM docker.io/library/python:3.12-slim AS builder
WORKDIR /app

# Install dependencies into /install so they are accessible by any user
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Runtime image ────────────────────────────────────────────────────────────
FROM docker.io/library/python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ONNX_MODEL_PATH=/app/models/ranker.onnx

# Copy installed packages from builder stage
COPY --from=builder /install /usr/local

COPY main.py ./
COPY agentic_log_analyzer.py ./

# Copy ONNX model artifact if it exists (built by train_and_export.py)
# Mount /app/models as a volume in docker-compose for live model updates
RUN mkdir -p /app/models

# Run as non-root user
RUN useradd --create-home --shell /usr/sbin/nologin appuser
USER appuser

EXPOSE 8084
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8084", "--workers", "1"]
