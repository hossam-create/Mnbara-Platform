from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio
import os

from src.routes import context
from src.routes import recommendations
from src.routes import events
from src.routes import bandits
from src.routes import ml_pipeline
from src.database import Database
from src.recommendation_engine import recommendation_engine
from src.event_worker import event_worker

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
ENABLE_EVENT_WORKER = os.getenv("ENABLE_EVENT_WORKER", "false").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle - startup and shutdown"""
    # Startup
    logger.info("Starting Recommendation Service...")
    
    try:
        await recommendation_engine.initialize()
        logger.info("Recommendation engine initialized successfully")
    except Exception as e:
        logger.warning(f"Could not initialize recommendation engine: {e}")
    
    # Optionally start event worker in background
    worker_task = None
    if ENABLE_EVENT_WORKER:
        try:
            await event_worker.connect()
            worker_task = asyncio.create_task(event_worker.start())
            logger.info("Event worker started in background")
        except Exception as e:
            logger.warning(f"Could not start event worker: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Recommendation Service...")
    
    if worker_task:
        await event_worker.stop()
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass
    
    await Database.close_pool()


app = FastAPI(
    title="MNBARA Recommendation Service",
    description="AI-powered recommendation engine with collaborative and content-based filtering",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(context.router, prefix="/api/v1/context", tags=["Context"])
app.include_router(recommendations.router, prefix="/api/v1/recommendations", tags=["Recommendations"])
app.include_router(events.router, prefix="/api/v1/events", tags=["Events"])
app.include_router(bandits.router, prefix="/api/v1/bandits", tags=["Bandits"])
app.include_router(ml_pipeline.router, prefix="/api/v1/ml", tags=["ML Pipeline"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "service": "MNBARA Recommendation Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "context": "/api/v1/context",
            "recommendations": "/api/v1/recommendations",
            "events": "/api/v1/events"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "recommendation-service"}
