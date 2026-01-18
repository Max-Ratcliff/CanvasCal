# CanvasCal

CruzHacks 2026: An AI-native academic productivity ecosystem that turns your Canvas courses and PDF syllabi into an intelligent, color-coded calendar.

## 🚀 Key Features
- **Split-View Syllabus Parser:** Verify AI-extracted dates side-by-side with your original PDF syllabus.
- **Canvas Live Sync:** Instant fetching of assignments, announcements, and course details.
- **Smart Study Scheduler:** AI Agent that finds gaps in your schedule to book study sessions before major deadlines.
- **Google Calendar Sync:** Export your intelligently planned schedule to your primary calendar.

## 🛠️ Architecture
- **Backend:** FastAPI (Python), Google Gemini AI, Canvas API, Supabase.
- **Frontend:** React, Vite, Tailwind CSS, react-pdf, Lucide.

## 🏃 Getting Started

### Backend Setup
1. `cd backend`
2. Create `.env` from `.env.example` (add Gemini and Canvas keys).
3. `python3 -m venv venv && source venv/bin/activate`
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

### Data Refresh
To populate your local environment with your real Canvas data:
```bash
cd backend
venv/bin/python3 scripts/fetch_canvas_data.py
```

## 📝 Design Identity
CanvasCal uses a signature **Blue & Yellow** theme inspired by academic excellence, focused on a clean, "Paper-like" workspace for high focus.