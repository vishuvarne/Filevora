FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (magic, build tools)
RUN apt-get update && apt-get install -y \
    libmagic1 \
    ffmpeg \
    libgl1-mesa-glx \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create storage directory
RUN mkdir -p storage

CMD sh -c "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"
