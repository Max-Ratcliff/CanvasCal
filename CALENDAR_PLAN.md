# Smart Calendar Integration & Google Sync Plan

## Objective
Enable "Smart" Calendar management where an AI agent can CRUD events, intelligently schedule study blocks, and sync to Google Calendar.

## Status: 🟢 Phase 1 & 2 Complete

### Phase 1: Local CRUD & Smart Services [DONE]
- [x] Create `backend/app/services/calendar_ops.py` with CRUD logic.
- [x] Implement `auto_schedule_study_session` backward scheduling.
- [x] Update `backend/app/api/calendar.py` with full REST endpoints.
- [x] Schema: Added `course_id`, `color_hex`, `source`, `verified` to `EventSchema`.

### Phase 2: Google Calendar Integration [DONE]
- [x] Implement `GoogleCalendarService` class.
- [x] One-Way Sync Logic: Propagate local state to Google.
- [x] Support for updating existing Google events via `google_event_id`.

### Phase 3: Frontend Integration [IN PROGRESS]
- [x] Dynamic Course Listing in Sidebar.
- [x] Smart Calendar View with density handling and modals.
- [ ] **Next:** Trigger `/calendar/sync` from the UI using Google OAuth tokens.

### Phase 4: AI Agent Integration [PLANNED]
- [ ] Connect `AgentSidebar.tsx` to the `auto-schedule` backend endpoint.
- [ ] Implement "Quick Action" buttons in chat bubbles.

## Technical Details
- **Source of Truth:** `backend/data/events.json` (Local) / Supabase.
- **Sync Pattern:** One-way (App -> Google) ensures local AI-generated blocks are primary.
- **Colors:** Deterministic hashing based on `course_id` ensures consistent visual identity.