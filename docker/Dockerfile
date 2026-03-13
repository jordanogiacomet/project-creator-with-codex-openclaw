FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml README.md ./
COPY initializer ./initializer

RUN python -m pip install --no-cache-dir .

ENTRYPOINT ["initializer"]
CMD ["--help"]
