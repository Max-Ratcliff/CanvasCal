from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, syllabus, canvas, calendar, agent
from app.core.config import settings
import logging
import time

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("CanvasCal")

app = FastAPI(title=settings.PROJECT_NAME, description="AI-native productivity ecosystem backend")

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    return response

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(syllabus.router, prefix="/process", tags=["Syllabus Processing"])
app.include_router(canvas.router, prefix="/canvas", tags=["Canvas Integration"])
app.include_router(calendar.router, prefix="/calendar", tags=["Google Calendar"])
app.include_router(agent.router, prefix="/agent", tags=["AI Agent"])

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Canvas Cal API"}
