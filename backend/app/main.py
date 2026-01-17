from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, syllabus, canvas, calendar
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME, description="AI-native productivity ecosystem backend")

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(syllabus.router, prefix="/process", tags=["Syllabus Processing"])
app.include_router(canvas.router, prefix="/canvas", tags=["Canvas Integration"])
app.include_router(calendar.router, prefix="/calendar", tags=["Google Calendar"])

@app.get("/")
async def root():
    return {"message": "Welcome to Canvas Cal API"}
