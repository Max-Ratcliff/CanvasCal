# Detailed Plan: Syllabus UI & Agent Enhancements

## 1. Chatbot Polish
**Goal:** Improve usability and interactivity of the AI Assistant.

-   **Scrollbar:** The chat window currently grows indefinitely.
    -   *Fix:* Apply `max-height` and `overflow-y-auto` to the message container.
    -   *Style:* Use a custom, thin scrollbar (or `scrollbar-width: thin`) to keep it clean.
-   **Editing Capabilities:**
    -   *Tool:* `update_calendar_event(event_id, ...)`
    -   *Flow:* Agent searches for matched event -> Gets ID -> Calls update with new params.
    -   *Backend:* Update DB -> Call `GoogleCalendarService.update_event`.
-   **Fuzzy Deletion:**
    -   Refine the prompt: "If multiple events match 'study', list them with times and ask user to confirm."

## 2. Syllabus Intelligence Hub ("View Syllabi")
**Goal:** Transform the "Upload" feature into a rich, interactive course manager.

### UI Architecture
-   **Trigger:** "View Syllabi" button (replaces Upload).
-   **Layout:** A specific Modal or Overlay (using `radix-ui/dialog` or custom).
    -   **Left Sidebar:** List of courses (fetched from Canvas + Manual Uploads).
    -   **Main Content:**
        -   **Header:** Course Name + Professor + "Sync Status".
        -   **Tabs:** "Events" (Dates) | "Insights" (Policies, Grading) | "Raw Text".
        -   **Action:** "Resync this Syllabus" (Trigger AI re-parse).

### Backend Requirements
-   **New Table:** `course_insights` or JSONB column in `courses` (if we tracked courses).
    -   Since we don't strictly track courses in a table yet (just in `events`), we might need a `syllabi` table:
    ```sql
    create table syllabi (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users(id),
      course_id text, -- Canvas ID or Manual Name
      course_name text,
      raw_text text, -- content extracted from PDF
      ai_insights jsonb, -- { "grading_scale": ..., "office_hours": ... }
      created_at timestamp
    );
    ```
-   **Endpoints:**
    -   `GET /syllabus`: List all parsed syllabi.
    -   `GET /syllabus/{id}`: Get details.
    -   `POST /syllabus/parse`: Upload + Parse + Store + Create Events.

## 3. Calendar Isolation Strategy
**Goal:** Ensure all events live in "CanvasCal" and not "Primary".

-   **Investigation:** The current code falls back to 'primary' if `CanvasCal` creation fails (403 Forbidden).
-   **Fix:**
    1.  Check Scopes: Ensure `services/google_calendar.py` requests `calendar` scope (read/write access to *all* calendars) or `calendar.app.created`.
        -   *Current Scope:* `calendar.events` (might be insufficient for creating a *new calendar*).
        -   *Need:* `https://www.googleapis.com/auth/calendar` to create secondary calendars.
    2.  **Retry Logic:** If `CanvasCal` doesn't exist, Create it. If creation fails, *then* maybe warn user instead of silently polluting primary.

## Execution Order
1.  **UI Polish:** Chat scrollbar (Quick win).
2.  **Backend:** Agent `update_event` tool.
3.  **Backend:** Check/Fix Google Scopes for Calendar Creation.
4.  **Backend:** Create `syllabi` table and endpoints.
5.  **UI:** Build `SyllabusViewer` component.
