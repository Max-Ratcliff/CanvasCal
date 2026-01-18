# Plan: External Calendar Context & Visibility Control

## 1. Objective
Allow the AI Agent to "see" events from the user's *other* Google Calendars (e.g., Primary, Work, Family) to prevent scheduling conflicts, without permanently importing those events into our database.

## 2. Architecture

### A. Data Storage (Supabase)
We need to store the user's preference of *which* calendars the Agent should consider.
-   **Table:** `user_integrations`
-   **New Column:** `selected_calendar_ids` (JSONB or ARRAY of Text)
    -   Example: `['primary', 'c_12345xyz@group.calendar.google.com']`
    -   Default: `['primary']`

### B. Backend Services (`GoogleCalendarService`)
1.  **`list_available_calendars()`**
    -   Wraps `service.calendarList().list()`.
    -   Returns: List of `{ id, summary, primary, selected }`.
    -   "Selected" status is derived by checking the DB's `selected_calendar_ids`.
2.  **`get_external_events(start_time, end_time)`**
    -   Reads `selected_calendar_ids` from DB.
    -   Iterates through IDs and calls `service.events().list()` for each.
    -   Returns: A merged, simplified list of events `{ summary, start, end, source: 'google' }`.
    -   *Optimization:* Run these requests in parallel (asyncio) if possible, or sequential for MVP.

### C. Agent Context Injection (`agent.py`)
Currently, we only query the local `events` table. We will upgrade the "Context Injection" block:
1.  **Local Context:** Query `events` table (Canvas/Agent events).
2.  **External Context:** Call `google_service.get_external_events(now, now+7days)`.
3.  **Merge:** Combine both lists for the System Prompt.
    -   *Format:* `[External] Lunch with Boss (Fri 12pm)` vs `[Canvas] Math 101 (Mon 10am)`.

### D. Frontend UI
1.  **Settings Component:** A new "Calendar Preferences" modal/popover.
2.  **List:** Shows all available Google Calendars with toggles (Switches).
3.  **Action:** Toggling a switch immediately calls `POST /calendar/preferences` to update the DB.

## 3. Implementation Steps

### Step 1: Backend - Service Layer
-   Modify `backend/app/services/google_calendar.py`:
    -   Add `list_calendars()`.
    -   Add `get_events_from_calendars(calendar_ids, start, end)`.

### Step 2: Backend - API & DB
-   Modify `backend/app/api/calendar.py` (or create `integrations.py`):
    -   `GET /integrations/google/calendars` -> Returns list with active status.
    -   `POST /integrations/google/calendars` -> Updates `selected_calendar_ids`.
-   Run SQL migration (or manual Supabase edit) to add `selected_calendar_ids` to `user_integrations`.

### Step 3: Agent Upgrade
-   Modify `backend/app/services/agent.py`:
    -   Import `GoogleCalendarService`.
    -   Fetch external events.
    -   Append to `upcoming_events_text`.

### Step 4: Frontend UI
-   Create `components/calendar-settings.tsx`.
-   Add a "Gear" icon to the Calendar header.
-   Implement the toggle logic.

## 4. Privacy & Performance Note
-   We do **not** save external events to our DB. They are fetched ephemeral for the Agent's "Working Memory" only.
-   This ensures user privacy (we don't mirror their whole life) and data consistency (no stale sync issues).
