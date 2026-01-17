This is a comprehensive Product Requirements Document (PRD) for **Canvas Cal**. This document is designed to serve as your "Source of Truth" during the hackathon, ensuring every feature built contributes directly to a winning prize track.

---

# 📄 Product Requirements Document: Canvas Cal

**Vision:** Eliminating the administrative overhead of being a student by turning static syllabi into an active, intelligent schedule.

---

## 1. Project Description

**Canvas Cal** is an AI-native productivity ecosystem that bridges the gap between course requirements and daily action. By integrating directly with the Canvas LMS API and utilizing LLM-powered OCR for PDF syllabi, it automatically populates a Google Calendar with not just deadlines, but intelligently scheduled study blocks, office hours, and campus-specific travel buffers. The "Agentic" interface allows students to manage their entire academic life through natural language, making "I forgot that was due" a thing of the past.

---

## 2. Strategic Goal Categorization

### 🎯 The MVP (The "Must-Haves")

- **OAuth2 Integration:** Secure login for Google and Canvas.
- **Syllabus-to-Calendar Parser:** PDF upload that extracts dates and creates events.
- **Canvas Sync:** Pulling existing assignments and quizzes from the API.
- **Unified Dashboard:** A clean UI that displays the integrated schedule.

### 🚀 Stretch Goals (The "Winning Features")

- **AI Study Architect:** Automatically creates "work blocks" leading up to major deadlines based on assignment weight.
- **Natural Language Agent:** A chat interface to ask "When is my next break?" or "Move my Tuesday study session to Wednesday."
- **UCSC Campus Logic:** Integration of campus map data to add walking/transit buffers between classes.

---

## 3. Feature Breakdown & Requirements

### Feature 1: The "Smart Ingest" Engine (Syllabus PDF Parser)

- **Plan:** User uploads a PDF. The backend sends the text/images to an LLM with a strict JSON schema prompt to extract: Event Name, Date, Time, Location, and Weight (%).
- **Frontend Requirements:** Drag-and-drop file uploader; "Review" screen to confirm extracted dates before syncing to G-Cal.
- **Backend Requirements:** Python/Node.js server to handle PDF-to-Text conversion; API route for LLM processing; Error handling for "No Date Found."

### Feature 2: Canvas API Live Sync

- **Plan:** Fetch assignments and announcements using the student’s Canvas API token.
- **Frontend Requirements:** "Sync Now" button; Status indicators for successful connection.
- **Backend Requirements:** Implementation of OAuth2 flow for Canvas; Data mapping logic to convert Canvas `assignment` objects into G-Cal `event` objects.

### Feature 3: The AI Academic Agent

- **Plan:** A persistent chat sidebar that can read the user's current calendar state and perform "Write" actions.
- **Frontend Requirements:** Chat UI component; Real-time calendar updates (optimistic UI).
- **Backend Requirements:** A "Tools" or "Function Calling" setup where the LLM can trigger functions like `create_event()`, `delete_event()`, or `find_free_time()`.

### Feature 4: Buffer & Travel Logic (UCSC Focus)

- **Plan:** Identify class locations (e.g., "Baskin Engineering") and insert "Travel" events on the calendar.
- **Frontend Requirements:** Settings toggle for "Enable Campus Travel Buffers."
- **Backend Requirements:** A lookup table of UCSC buildings and average walking times between college clusters.

---

## 4. Prize Track Alignment Matrix

| Prize Track               | Strategy for Winning                                                                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Education Hacks**       | Emphasize the "Fostering Stimulating Learning" by removing the stress of manual planning, letting students focus on _learning_ instead of _scheduling_. |
| **Opennote Productivity** | Highlight the "Frictionless" aspect: One-click syllabus ingestion eliminates the 2-hour "Week 0" manual calendar setup.                                 |
| **Best AI Hack / GenAI**  | Showcase the **Structured Output** of the syllabus parser and the **Function Calling** capabilities of the Agent.                                       |
| **Best SlugHacks**        | Demo the UCSC-specific travel buffers and the integration of the UCSC Academic Calendar (holidays, finals week).                                        |
| **Best UI/UX Hack**       | Use a "Dark Mode" aesthetic with high-contrast labels for different categories (Class, Study, Social).                                                  |

---

## 5. LLM & Code Formatting Rules

_To be used when asking AI to generate code snippets during the hackathon:_

1. **Modular Logic:** Always request code in small, testable functions. Avoid "Monolithic" scripts.
2. **Environment Safety:** Never hardcode API keys. Always use `.env` file templates.
3. **Strict Typing:** Use TypeScript for the frontend to prevent runtime errors during the demo.
4. **JSON Schema Enforcement:** When requesting LLM prompts, always specify: _"Return valid JSON only. Do not include conversational filler."_
5. **Documentation:** Every generated function must include a JSDoc-style comment explaining: `Args`, `Returns`, and `Side Effects`.

---

## 6. Critical Technical Constraints (Non-Negotiable)

- **Data Privacy:** All syllabus data must be processed and then deleted from the server to respect student privacy.
- **Latency:** The AI Agent must respond in < 2 seconds (use streaming responses if possible).
- **Mobile Responsiveness:** Judges often view projects on mobile; the calendar view must be responsive.

---

**Next Step:** Would you like me to generate the **Initial LLM Prompt** you’ll use to build the Syllabus Parser, or should we start on the **Canvas API Authentication flow**?
