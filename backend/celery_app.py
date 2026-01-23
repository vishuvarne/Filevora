import os
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Default to localhost if not set
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "filevora",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks"]  # We will create tasks.py
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # SSL support for Render/Upstash Redis
    broker_connection_retry_on_startup=True,
)

if REDIS_URL.startswith("rediss://"):
    celery_app.conf.update(
        broker_use_ssl={"ssl_cert_reqs": "none"},
        redis_backend_use_ssl={"ssl_cert_reqs": "none"}
    )

if __name__ == "__main__":
    celery_app.start()
