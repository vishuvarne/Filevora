FROM python:3.11

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libmagic1 \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy from backend directory (Build Context: Root)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code to /app/backend
COPY backend /app/backend

# Create storage directory
RUN mkdir -p storage

CMD sh -c "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"
