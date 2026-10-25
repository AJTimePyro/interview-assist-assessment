# Download the Vosk model
FROM python:3.11-slim AS model

RUN apt-get update \
    && apt-get install --no-install-recommends -y curl unzip \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL \
    https://alphacephei.com/vosk/models/vosk-model-small-en-in-0.4.zip \
    -o /tmp/model.zip \
    && unzip -q /tmp/model.zip -d /models \
    && rm /tmp/model.zip


# Final image
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:$PATH" \
    UV_COMPILE_BYTECODE=1 \
    VOSK_MODEL_PATH=/models/vosk-model-small-en-in-0.4

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /uvx /bin/
COPY --from=model /models /models

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY . .

RUN useradd --system --no-create-home app
USER app

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
