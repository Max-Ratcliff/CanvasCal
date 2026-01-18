# Smart Calendar Integration & Google Sync Plan

## Objective
Enable "Smart" Calendar management where an AI agent can Create, Read, Update, and Delete (CRUD) events, intelligently schedule study blocks, and sync the final schedule to a user's Google Calendar.

## 1. Architecture Overview

The system will operate with a "Local First, Sync Second" approach:
1.  **Local State (`backend/data/events.json`):** The single source of truth for the application. All AI operations modify this local state first.
2.  **AI Layer:** A set of deterministic tools (functions) that the LLM calls to modify the local state (e.g., `add_event`, `find_free_slots`).
3.  **Sync Layer:** A service that takes the confirmed local state and propagates it to Google Calendar via the Google Workspace API.

## 2. LLM Tooling (CRUD Functions)

These functions will be exposed to the AI agent (and the frontend API) to manipulate the calendar. They must reside in `backend/app/services/calendar_ops.py`.

### Core Operations
*   `create_event(event: EventSchema) -> EventSchema`: Adds a new event to the local store. Validates no direct conflicts (unless forced).
*   `read_events(start_date, end_date) -> List[EventSchema]`: Returns events in a range to help the AI "see" the schedule.
*   `update_event(event_id, updates: dict) -> EventSchema`: Moves an event, changes its title, or updates its description.
*   `delete_event(event_id) -> bool`: Removes an event.

### "Smart" Operations (The Brains)
*   `find_optimal_slot(duration_minutes, deadline) -> datetime`: Looks for free time before a deadline.
*   `auto_schedule_study_blocks(assignment) -> List[EventSchema]`: Automatically creates "Study Session" events leading up to a major deadline (backward scheduling).

## 3. Google Calendar Sync Strategy

We will implement a **One-Way Sync (App -> Google)** initially to ensure safety, with an option for "Import" later.

### Workflow
1.  **Auth:** Frontend performs OAuth2 with Google (scopes: `calendar.events`).
2.  **Token Exchange:** Frontend sends the Google Access Token to the Backend `/sync` endpoint.
3.  **Sync Logic (`backend/app/services/google_calendar.py`):**
    *   Connect to Google API using the token.
    *   Check if a dedicated calendar "CanvasCal" exists. If not, create it.
    *   **Diffing:** Compare local events with remote events in that calendar.
        *   *New Local Event* -> `service.events().insert()`
        *   *Updated Local Event* -> `service.events().update()`
        *   *Deleted Local Event* -> `service.events().delete()`
    *   Alternatively (Simpler MVP): Clear the "CanvasCal" range and re-insert all future events (less efficient but robust).

## 4. Implementation Plan

### Phase 1: Local CRUD & Smart Services
- [ ] Create `backend/app/services/calendar_ops.py` with CRUD logic.
- [ ] Implement `find_optimal_slot` using a simple "busy time" mask.
- [ ] Update `backend/app/api/calendar.py` to expose these CRUD ops as API endpoints.

### Phase 2: Google Calendar Integration
- [ ] Setup Google Cloud Project & Credentials (User needs `credentials.json` or Client ID/Secret).
- [ ] Implement `backend/app/services/google_calendar.py` with `GoogleCalendarService` class.
- [ ] Implement "Create Calendar" and "Insert Event" methods using `google-api-python-client`.

### Phase 3: The "Sync" Endpoint
- [ ] Update `POST /api/calendar/sync` to accept a Google OAuth Token.
- [ ] Wire the endpoint to trigger the `GoogleCalendarService` sync process.

### Phase 4: AI Agent Integration
- [ ] Define these tools in the Agent's system prompt or function calling definition.
- [ ] Test the Agent: "I have a test on Friday, schedule 3 study sessions." -> Agent calls `auto_schedule_study_blocks`.

## 5. Data Structures

### Updated EventSchema
We may need to add a field to track the Google Calendar ID to support updates:
```python
class EventSchema(BaseModel):
    # ... existing fields ...
    google_event_id: Optional[str] = None  # To track sync status
```

## 6. Security Note
*   Google Tokens are short-lived. We will handle them per-request or use Refresh Tokens if we need background sync (per-request is safer for MVP).
*   API Credentials (`client_id`, `client_secret`) must be in `.env`.
