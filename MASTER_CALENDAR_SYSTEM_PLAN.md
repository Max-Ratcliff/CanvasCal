# Master Blueprint: CanvasCal Titanium-Grade Calendar Engine

## 1. Objective
Build a resilient, high-performance, and security-first synchronization engine that bridges Canvas LMS, AI-driven scheduling, and Google Calendar.

---

## 2. Security & Authentication (Offline Access)

### A. The "Offline" Auth Flow
1.  **Frontend:** Request an `Authorization Code` with `access_type='offline'` and `prompt='consent'`.
2.  **Backend:** `POST /api/v1/auth/google/token` exchanges the code for a `refresh_token`.
3.  **Encrypted Persistence:** 
    *   **AES-256 Encryption:** All `refresh_tokens` are encrypted before being stored in Supabase.
    *   **Secret Management:** Encryption keys are stored in environment variables (never in the DB).

### B. Minimal Scopes
*   Use `https://www.googleapis.com/auth/calendar.app.created` to limit the app's footprint to its own created calendar, or `...calendar.events` for full primary calendar conflict resolution.

---

## 3. High-Performance Synchronization Engine

### A. Incremental Sync (Delta Sync)
*   **Initial Sync:** Fetch all events and store the `nextSyncToken`.
*   **Delta Sync:** Use the `syncToken` for subsequent updates to fetch only modified/deleted events.
*   **Token Recovery:** Detect `410 Gone` errors; trigger a full cache invalidation and re-sync when tokens expire.

### B. Batch Operations
*   Use **Google Batch Requests** to sync multiple Canvas assignments in a single HTTP round-trip, significantly reducing latency and API usage.

---

## 4. Full-Spectrum Conflict Engine

### A. Aggregated FreeBusy
*   **Discovery:** Call `calendarList.list` to identify all user-selected calendars.
*   **Query:** Pass all discovered IDs to the `freebusy().query()` endpoint.
*   **Constraint Solver:** AI Agent uses this aggregated "Busy" map to find gaps for study sessions.

### B. Time Zone Integrity
*   **UTC-First Policy:** All timestamps are converted to UTC at the API boundary. The UI handles local display offset.

---

## 5. Real-Time Webhooks & Reliability

### A. The Webhook Watchdog
*   **Registration:** Call `service.events().watch()` for the user's primary calendar.
*   **Renewal Job:** A daily cron job identifies `watch_expiration` timestamps nearing the 7-day limit and renews the lease.

### B. Debounce Queue
*   **Mechanism:** Webhooks are pushed to a Redis/Celery queue with a 30-second delay.
*   **Benefit:** Prevents "sync storms" (multiple webhooks for a single user action) by grouping multiple changes into one Delta Sync.

---

## 6. Implementation Roadmap

### Phase 1: Security & Auth [COMPLETED]
- [x] **DB:** Update `users` table with `google_calendar_settings` (JSONB) and `encrypted_refresh_token`.
- [x] **Backend:** Implement AES-256 encryption middleware for tokens.

### Phase 2: The Resilient Sync Service [COMPLETED]
- [x] **Service:** Build `sync_canvas` endpoint with auto-syllabus scraping and background processing.
- [x] **Logic:** Implement deterministic UUID generation and `upsert` logic for bandwidth-efficient updates.

### Phase 3: Conflict & Webhooks [IN PROGRESS]
- [ ] **Conflicts:** Integrate aggregated `freebusy` into the scheduler.
- [ ] **Webhooks:** Implement the `/webhooks/google` debouncer.

### Phase 4: AI Agent Empowerment
- [ ] **Tools:** Expose `check_availability` and `reschedule_conflicts` as LLM tools.

---

## 7. Data Schema (Supabase)
```sql
create table users (
  id uuid primary key,
  email text unique,
  encrypted_refresh_token text,
  google_calendar_settings jsonb default '{
    "preferred_calendars": ["primary"],
    "watch_expiration": null,
    "sync_error_count": 0
  }'::jsonb,
  last_sync_token text
);
```
