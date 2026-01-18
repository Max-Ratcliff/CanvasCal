# Master Blueprint: CanvasCal Titanium-Grade Calendar Engine

## 1. Objective
Build a resilient, high-performance, and security-first synchronization engine that bridges Canvas LMS, AI-driven scheduling, and Google Calendar.

---

## 2. Security & Authentication [COMPLETED]
-   **Auth:** Supabase Magic Link (App) + Google OAuth2 (Calendar Sync).
-   **Encryption:** AES-256 for all third-party tokens (Google Refresh & Canvas Access).
-   **RLS:** Row Level Security enforced on all tables; Service Role used for background sync.

---

## 3. Synchronization Engine [COMPLETED]
-   **Canvas:** Manual token integration with auto-correction for school URLs.
-   **Assignments:** Auto-sync with deterministic UUIDs to prevent duplicates.
-   **Google:** Fully isolated "CanvasCal" secondary calendar support.
-   **Stability:** Handles empty time ranges and S3 redirects for PDFs.

---

## 4. AI Agent & Intelligence [IN PROGRESS]
-   **Memory:** Full conversational history + 7-day "Context Injection" with direct Database IDs.
-   **Timezone:** Automated detection via browser (ISO 8601 with local offsets).
-   **Tools:**
    -   [x] `add_calendar_event`
    -   [x] `get_calendar_events` (Keyword search)
    -   [x] `delete_calendar_event` (Global sync)
    -   [x] `update_calendar_event` (Edit capability)
-   **UI:** Responsive chat window with custom scrolling.

---

## 5. Syllabus Intelligence Hub [IN PROGRESS]
-   **Backend:** Database updated to store `course_insights` (JSONB).
-   **Frontend:** `SyllabusViewer` component designed for course-specific insights.
-   **AI:** Extraction improved to capture Grading, Policies, and Office Hours.

---

## 6. Implementation Roadmap

### Phase 1: Core Foundation [COMPLETED]
- [x] Auth & Security
- [x] Canvas Assignment Sync
- [x] Google Calendar Creation

### Phase 2: Agent Refinement [COMPLETED]
- [x] Editing & Deletion logic
- [x] Context Injection (Event Memory)
- [x] UI Polish (Scrolling/Focus)

### Phase 3: Syllabus "Brain" [NEXT]
- [x] **Backend:** Schema and API for course insights.
- [ ] **UI:** Finalize the Modal/Overlay integration in `page.tsx`.

### Phase 4: External Context [PLANNED]
- [ ] **Visibility:** Fetch external Google events (toggable).
- [ ] **Deployment:** Final Render/Vercel setup.
