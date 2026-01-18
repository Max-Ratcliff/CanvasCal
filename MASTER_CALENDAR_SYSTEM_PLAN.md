# Master Blueprint: CanvasCal Titanium-Grade Calendar Engine

## 1. Objective
Build a resilient, high-performance, and security-first synchronization engine that bridges Canvas LMS, AI-driven scheduling, and Google Calendar.

---

## 2. Security & Authentication [COMPLETED]
-   **Auth:** Supabase Magic Link (App) + Google OAuth2 (Calendar Sync).
-   **Encryption:** AES-256 for stored Google Refresh Tokens.
-   **RLS:** Row Level Security enabled on `events` and `user_integrations`, with Service Role bypass for background tasks.

---

## 3. High-Performance Synchronization Engine [COMPLETED]
-   **Canvas Sync:** Auto-scrapes active courses, assignments, and parses PDF syllabi via Gemini 2.0.
-   **Deterministic IDs:** Uses UUIDv5 (User+Name+Date) to prevent duplicates during re-syncs.
-   **Google Sync:** `GoogleCalendarService` handles Create/Update/Delete operations.
    -   *Note: Isolation logic (CanvasCal vs Primary) needs verification.*

---

## 4. AI Agent & Intelligence [IN PROGRESS]
-   **Context:** Agent is timezone-aware and context-aware (history).
-   **Tools:**
    -   [x] `add_calendar_event` (with local time support)
    -   [x] `get_calendar_events` (with keyword search)
    -   [x] `delete_calendar_event` (Syncs to Google)
    -   [ ] `update_calendar_event` (Edit capability)
-   **Fuzzy Logic:** Improved deletion matching (Search -> Verify -> Delete).

---

## 5. Syllabus Intelligence & UI [PLANNED]
-   **Dashboard:** "View Syllabi" modal replacing simple upload button.
-   **Structure:**
    -   **Sidebar:** List of Canvas Courses.
    -   **Main View:** Scraped insights (Exams, Office Hours, Policies).
    -   **Sync:** Toggleable sync for "AI Insights" to Calendar.
-   **Storage:** Need schema updates to store parsed syllabus *content/insights*, not just resulting events.

---

## 6. Implementation Roadmap

### Phase 1: Core Foundation [COMPLETED]
- [x] Auth & Security
- [x] Canvas Assignment Sync
- [x] Basic Google Calendar Sync

### Phase 2: Agent Refinement [IN PROGRESS]
- [ ] **Editing:** Implement `update_event` tool.
- [ ] **UI:** Fix chat scrollbar and fuzzy delete confirmation.

### Phase 3: Syllabus "Brain" [NEXT]
- [ ] **UI:** Build `SyllabusViewer` component.
- [ ] **Backend:** Create `course_insights` table.
- [ ] **AI:** Tune prompts to extract "Key Dates" vs "Policies".

### Phase 4: Polish & Isolation
- [ ] **Isolation:** Ensure 'CanvasCal' is strictly used; fix 'primary' fallback.
- [ ] **Deployment:** Render/Vercel setup.

---

## 7. Data Schema (Supabase)
```sql
-- Planned Schema for Insights
create table course_insights (
  id uuid primary key,
  course_id text,
  user_id uuid,
  category text, -- 'exam', 'policy', 'office_hours'
  content text,
  extracted_at timestamp
);
```