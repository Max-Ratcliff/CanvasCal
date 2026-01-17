from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, syllabus, canvas, calendar

app = FastAPI(title="Canvas Cal Backend", description="AI-native productivity ecosystem backend")

# Add CORS middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
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
