# 🛠️ Backend Description: Canvas Cal

**Canvas Cal** utilizes a high-performance Python backend built with **FastAPI**. The system is designed to act as an intelligent intermediary between the Canvas LMS, the user’s Calendar (stored in Supabase), and the Gemini Large Language Model.

## 1. Technical Stack

-   **Framework:** FastAPI (Asynchronous Python)
-   **Language:** Python 3.11+
-   **AI Engine:** Google Gemini 2.0 Flash (via `google-genai` SDK)
-   **Database:** Supabase (PostgreSQL)
-   **PDF Processing:** PyMuPDF (fitz) for high-speed text extraction.
-   **External Integrations:**
    -   `canvasapi`: Python wrapper for Instructure’s Canvas LMS.

## 2. Project Structure

```text
/backend
├── app/
│   ├── main.py              # Application entry & router inclusion
│   ├── api/                 # Endpoint routers (The "Plumbing")
│   │   ├── auth.py          # Authentication
│   │   ├── agent.py         # AI Agent Endpoint
│   │   ├── syllabus.py      # PDF parsing & AI extraction
│   │   ├── canvas.py        # Canvas assignment fetching
│   │   └── calendar.py      # Event CRUD (Supabase)
│   ├── services/            # Business Logic (The "Brains")
│   │   ├── agent.py         # Gemini Tool-Use & Chat Logic
│   │   ├── parser.py        # Syllabus parsing logic
│   │   ├── campus_logic.py  # UCSC Transit & Buffer calculations
│   │   └── storage.py       # (Legacy) Local storage
│   └── schemas/             # Pydantic Models (The "Contract")
│       ├── event.py         # Standardized event objects
│       └── response.py      # Standardized API response wrappers
├── requirements.txt         # Project dependencies
└── schema.sql               # Database definition
```

## 3. Core Services

### A. Intelligent Syllabus Extraction (`services/parser.py`)
-   **Input:** PDF Upload.
-   **Process:** PyMuPDF extracts text -> Gemini 2.0 parses into JSON Schema.
-   **Output:** List of `Event` objects (Exams, Assignments, Study Blocks).

### B. The AI Agent (`services/agent.py`)
-   **Model:** Gemini 2.0 Flash with `automatic_function_calling` enabled.
-   **Tools Available to Model:**
    -   `get_calendar_events`: Query Supabase for events.
    -   `add_calendar_event`: Create new events.
    -   `check_availability`: Find free slots.
    -   `get_transit_time`: Calculate travel buffers.

### C. Canvas Integration (`api/canvas.py`)
-   **Assignments:** Fetches active course assignments via `canvasapi`.
-   **Announcements:** Pulls recent course announcements.
-   **Syllabus Import:** Downloads syllabus PDF from Canvas file storage for parsing.

## 4. API Endpoint Definitions

| Method | Endpoint              | Description                                          |
| ------ | --------------------- | ---------------------------------------------------- |
| `POST` | `/agent/chat`         | Chat with the AI assistant (Tool-enabled).           |
| `POST` | `/process/syllabus`   | Upload PDF; returns parsed events.                   |
| `GET`  | `/canvas/assignments` | Fetches all live deadlines from Canvas API.          |
| `GET`  | `/calendar/events`    | Fetches events from Supabase (supports date filtering). |
| `POST` | `/calendar/events`    | Adds a new event to the database.                    |

## 5. Database Schema (Supabase)

See `schema.sql` for the full definition.
-   **Table:** `events`
-   **Columns:** `id`, `summary`, `start_time`, `end_time`, `event_type`, `location`, `description`.