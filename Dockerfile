# syntax=docker/dockerfile:1.7

# ---------- builder: install Python deps ----------
FROM python:3.13-slim AS builder
WORKDIR /app

COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ---------- runner: minimal runtime ----------
FROM python:3.13-slim AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/home/appuser/.local/bin:$PATH \
    PORT=5001

RUN useradd --system --uid 1001 --create-home appuser

COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 5001
CMD ["gunicorn", \
     "--workers", "2", \
     "--bind", "0.0.0.0:5001", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "app:app"]
