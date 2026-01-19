from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging

from .config import config, Config
from .utils.file_ops import file_ops
from .routers import processor, auth
from .database import init_db
from .admin import setup_admin

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("filevora")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FileVora Backend...")
    Config.setup_storage()
    init_db()  # Initialize database tables
    logger.info("Database initialized")
    
    # Background task for cleanup
    cleanup_task = asyncio.create_task(periodic_cleanup())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    logger.info("Shutting down...")

async def periodic_cleanup():
    while True:
        try:
            logger.info("Running storage cleanup...")
            file_ops.cleanup_old_jobs()
            await asyncio.sleep(600)  # Check every 10 minutes
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Cleanup error: {e}")
            await asyncio.sleep(600)

app = FastAPI(lifespan=lifespan)
setup_admin(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(processor.router)
app.include_router(auth.router)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "FileVora API"}

from fastapi.responses import FileResponse
from fastapi import HTTPException

@app.get("/download/{job_id}/{filename}")
async def download_file(job_id: str, filename: str):
    file_path = Config.JOBS_PATH / job_id / "outputs" / filename
    if not file_path.exists():
        # Fallback to root job dir if not in outputs (support legacy/flat structure)
        file_path = Config.JOBS_PATH / job_id / filename
        
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(
        path=file_path, 
        filename=filename,
        media_type="application/octet-stream"
    )
