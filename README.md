# CanvasCal 📅
### CruzHacks 2026

**CanvasCal** is an AI-native productivity ecosystem designed to bridge the gap between academic requirements and daily action. By integrating directly with Canvas LMS and utilizing Gemini-powered OCR for syllabus parsing, it automatically transforms static course documents into an intelligent, active schedule.

![Tech Stack](https://img.shields.io/badge/Tech-FastAPI%20%7C%20React%20%7C%20Gemini%202.0%20%7C%20Supabase-blue)

## 🚀 Features

-   **🤖 AI Syllabus Parser:** Drag & drop a PDF syllabus, and our Gemini 2.0 parser extracts dates, exams, and assignments with high precision.
-   **💬 Academic Agent:** A natural language chatbot that can check your schedule, add study blocks, and find free time ("When can I study for CSE 101?").
-   **🔗 Canvas Integration:** Live sync with Canvas API to pull real-time assignment due dates and announcements.
-   **🗺️ Campus Travel Logic:** (Prototype) Intelligent buffers that calculate travel time between UCSC campus locations.
-   **☁️ Supabase Backend:** Secure, scalable event storage with Row Level Security (RLS).

## 🛠️ Architecture

### Frontend (`/frontend`)
-   **Framework:** Next.js (React) with TypeScript
-   **Styling:** Tailwind CSS + Lucide Icons
-   **Deployment:** Vercel / Local Vite (for dev)

### Backend (`/backend`)
-   **Framework:** FastAPI (Python 3.11+)
-   **AI Model:** Google Gemini 2.0 Flash
-   **Database:** Supabase (PostgreSQL)
-   **PDF Processing:** PyMuPDF

## 📦 Setup Guide

### Prerequisites
-   Node.js 18+ & npm/pnpm
-   Python 3.11+
-   Supabase Account
-   Google AI Studio API Key

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:
```ini
PROJECT_NAME="CanvasCal"
BACKEND_CORS_ORIGINS=["http://localhost:5173"]

# Integrations
GEMINI_API_KEY="your_gemini_key"
CANVAS_API_URL="https://canvas.instructure.com" # or your school's instance
CANVAS_ACCESS_TOKEN="your_canvas_token"

# Database
SUPABASE_URL="your_supabase_url"
SUPABASE_KEY="your_supabase_anon_key"
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` in `/frontend`:
```ini
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 3. Database Schema
Run the SQL found in `backend/schema.sql` in your Supabase SQL Editor to create the necessary tables.

### 4. Running the App
We have a unified start script for convenience:
```bash
./start.sh
```
This will launch:
-   Backend: http://localhost:8000 (Docs: /docs)
-   Frontend: http://localhost:5173

## 🧪 Testing

Run the backend test suite:
```bash
cd backend
pytest tests/
```

## 👥 Contributors
-   Max Ratcliff
-   Sharanya Ramanujan
-   Jiya Sawarkar
-   Tarun Nagaraju

---
*Built for CruzHacks 2026*
