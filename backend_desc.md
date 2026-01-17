Here is the comprehensive **`backend_description.md`** for your project. This file serves as the blueprint for your Python development team and ensures all backend logic aligns with the hackathon's prize requirements.

---

# 🛠️ Backend Description: Canvas Cal

**Canvas Cal** utilizes a high-performance Python backend built with **FastAPI**. The system is designed to act as an intelligent intermediary between the Canvas LMS, the user’s Google Calendar, and the Gemini Large Language Model.

## 1. Technical Stack

- **Framework:** FastAPI (Asynchronous Python)
- **Language:** Python 3.11+
- **AI Engine:** Google Generative AI SDK (Gemini 1.5 Pro/Flash)
- **PDF Processing:** PyMuPDF (fitz) for high-speed text extraction.
- **External Integrations:**
- `canvasapi`: Python wrapper for Instructure’s Canvas LMS.
- `google-api-python-client`: Official library for Google Calendar management.

- **Data Validation:** Pydantic v2 (Strict typing for AI outputs).

---

## 2. Project Structure

```text
/backend
├── app/
│   ├── main.py              # Application entry & router inclusion
│   ├── api/                 # Endpoint routers (The "Plumbing")
│   │   ├── auth.py          # OAuth2 (Canvas & Google)
│   │   ├── syllabus.py      # PDF parsing & AI extraction
│   │   ├── canvas.py        # Canvas assignment fetching
│   │   └── calendar.py      # G-Cal event orchestration
│   ├── services/            # Business Logic (The "Brains")
│   │   ├── ai_parser.py     # Gemini prompt engineering & cleaning
│   │   ├── campus_logic.py  # UCSC Transit & Buffer calculations
│   │   └── scheduler.py     # Logic for "Backward Design" study blocks
│   └── schemas/             # Pydantic Models (The "Contract")
│       ├── event.py         # Standardized event objects
│       └── response.py      # Standardized API response wrappers
├── requirements.txt         # Project dependencies
└── .env.example             # Template for API keys & Client IDs

```

---

## 3. Detailed Feature Plans (No Code)

### Feature A: Intelligent Syllabus Extraction

- **The Plan:** The backend receives a `multipart/form-data` PDF upload. PyMuPDF extracts raw text, which is then passed to Gemini. The LLM is instructed to identify "Exam," "Assignment," and "Office Hours" categories.
- **Logic:** If the LLM identifies a "Midterm" with a high weight (e.g., 25%), the backend triggers the `scheduler.py` to calculate three distinct study sessions in the 7 days prior.
- **UCSC Specifics:** The parser will specifically look for UCSC college-specific locations (e.g., "Kresge 321") to prepare for the Transit logic.

### Feature B: Canvas API Synchronization

- **The Plan:** Utilize the user's Canvas token to pull course lists and current assignment due dates.
- **Deduplication Logic:** The system must compare assignments found in the Syllabus PDF vs. the Canvas API. If the Canvas API has a more recent "Modified At" date, it overrides the Syllabus date.
- **Real-time Alerts:** An endpoint designed to poll Canvas for "Announcements" and push "Calendar Updates" if a professor reschedules a class.

### Feature C: The "Slug-Transit" Buffer Engine

- **The Plan:** For every pair of back-to-back events, the `campus_logic.py` service checks the `location` field.
- **Transit Calculation:** If an event ends at Science Hill and the next starts at Oakes, the system injects a 20-minute "Transit Event" into the JSON payload before it ever reaches Google Calendar.

---

## 4. API Endpoint Definitions

| Method | Endpoint              | Description                                          |
| ------ | --------------------- | ---------------------------------------------------- |
| `POST` | `/auth/google`        | Exchange auth code for Google Refresh Token.         |
| `POST` | `/process/syllabus`   | Upload PDF; returns a "Draft Schedule" JSON.         |
| `GET`  | `/canvas/assignments` | Fetches all live deadlines from Canvas API.          |
| `POST` | `/calendar/sync`      | Finalizes the JSON and pushes all events to G-Cal.   |
| `POST` | `/agent/chat`         | Natural language interface for the "Academic Agent." |

---

## 5. LLM Prompt & Schema Guidelines

- **JSON Enforcement:** All calls to the Gemini SDK must use `response_mime_type: "application/json"`.
- **Structure:** The backend will strictly validate the AI's output against the `EventSchema` Pydantic model. If validation fails, the system will automatically retry the prompt with a "Correction Instruction."

---

### Next Steps for the Team

1. **Environment Setup:** Copy `.env.example` and populate with `GEMINI_API_KEY`.
2. **Auth Scaffolding:** Set up the Google Cloud Console project and Enable "Google Calendar API."
3. **Mock Schema:** Finalize the `Event` schema so the Frontend team can begin rendering the Calendar Preview.

---

[Google Calendar + Python: Create Events & Check Free Slots Easily](https://www.youtube.com/watch?v=vEJ8Tf2pc3s)

This video provides a practical, step-by-step guide to integrating the Google Calendar API with Python, which is essential for building the event synchronization logic in your "Canvas Cal" backend.
