# 📄 Product Requirements Document: Canvas Cal

**Vision:** Eliminating the administrative overhead of student life by turning static syllabi into an active, intelligent schedule.

## 1. Feature Progress

### Feature 1: The "Smart Ingest" Engine [90% Complete]
- **Implementation:** Backend uses `PyMuPDF` + `Gemini-2.0-Flash-Lite`.
- **UX:** **Split-View Verification** is implemented. Users can view the original PDF and verify AI output side-by-side.
- **Backend:** `proxy-pdf` endpoint handles Canvas document access.

### Feature 2: Canvas API Live Sync [100% Complete]
- **Implementation:** Fetches assignments, announcements, and courses directly.
- **Enrichment:** Automatic course-coloring and metadata tagging.

### Feature 3: The AI Academic Agent [40% Complete]
- **Implementation:** Persistent Sidebar UI created.
- **Next:** Hook up "Action Chips" to backend scheduling logic.

### Feature 4: Buffer & Travel Logic [Planned]
- **Focus:** UCSC specific travel buffers based on class location extraction.

## 2. Prize Track Alignment (Updated)
*   **Best AI Hack:** Highlights the structured JSON extraction and PDF-to-Event reconciliation.
*   **Best UI/UX Hack:** Showcases the "Paper" aesthetic and the sophisticated Split-View verification tool.
*   **Education Hacks:** Removing the "Week 0" manual planning barrier.

## 3. Critical Technical Constraints
- **Latency:** Proxy streaming used for PDFs to ensure fast load times.
- **Privacy:** Local storage cache allows for rapid interaction without constant external API calls.