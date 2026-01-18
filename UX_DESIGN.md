# UX Design & Frontend Architecture

## 1. Design Philosophy
*   **Aesthetic:** "Clean Academic" – Dark mode by default, high contrast for readability, using UCSC-inspired accents (Gold/Blue) sparingly.
*   **Layout:** "Agent-First" – The AI assistant is not hidden in a menu; it is a persistent partner in the sidebar or a floating action button, always ready to reschedule or answer questions.
*   **Interaction:** "Optimistic" – Changes happen instantly on the UI while the backend syncs in the background.

## 2. Core Screens & Components

### A. The App Shell (Layout)
*   **Sidebar (Left):**
    *   Logo ("CanvasCal")
    *   Navigation Links: Dashboard, Calendar, Courses, Settings.
    *   **User Profile:** Avatar + "Sync Status" indicator (Green dot = Synced).
*   **Main Content (Center):** The active page.
*   **Agent Sidebar (Right - Collapsible):** 
    *   Persistent chat history.
    *   "Quick Actions" chips: "When is my next exam?", "Schedule study time".

### B. Dashboard (Home)
The "Command Center" for the student.
1.  **Header:** "Good Morning, [Name]. You have 3 deadlines today."
2.  **Widgets Grid:**
    *   **Assignment Checklist:** A list of items due in the next 7 days. checkbox interactions.
    *   **Announcements Ticker:** Most recent announcements from active courses.
    *   **Today's Timeline:** A vertical list of today's events (Classes, Study Blocks).

### C. Centralized Syllabus Manager (Page/Modal)
The "Knowledge Base" of the application.
1.  **Entry Point:** Single "Syllabus" button in the Sidebar/Nav.
2.  **Automatic State:** On startup, the app attempts to fetch syllabi from Canvas automatically and populate the calendar.
3.  **The UI:**
    *   **Sidebar:** List of active courses.
    *   **Main View:**
        *   **PDF Viewer:** The full syllabus document for the selected course.
        *   **"AI Insights" Panel:** "Important Notes" (e.g., "Late policy: -10%/day", "Professor's Office Hours").
        *   **Parsed Events:** A summary of dates extracted.
    *   **Actions:** 
        *   "Add Manual Syllabus" (Upload button for courses missing a PDF).
        *   "Re-parse" (if things look wrong).

### D. Smart Calendar View
1.  **Visuals:** 
    *   Full-month or Weekly view.
    *   Color-coded events: Blue (Class), Red (Exam), Green (Assignment), Purple (Study Block).
2.  **Interactions:**
    *   Click event -> Modal with details & "Reschedule" button.
    *   Drag & Drop -> Updates time (calls backend `update_event`).

## 3. Component Hierarchy (React/Vite)

```
src/
├── layouts/
│   └── DashboardLayout.tsx  (Sidebar + Outlet + AgentSidebar)
├── pages/
│   ├── Dashboard.tsx        (Widgets)
│   ├── CalendarPage.tsx     (BigCalendar wrapper)
│   └── ImportSyllabus.tsx   (Upload + Review Table)
├── components/
│   ├── ui/                  (shadcn/ui primitives)
│   ├── widgets/
│   │   ├── AssignmentList.tsx
│   │   └── AnnouncementCard.tsx
│   ├── calendar/
│   │   ├── EventModal.tsx
│   │   └── CalendarView.tsx
│   └── agent/
│       ├── ChatInterface.tsx
│       └── ActionChip.tsx
```

## 4. User Flows

### Flow 1: "I have a new class"
1.  User clicks "Import Syllabus" in Sidebar.
2.  Drops `CSE101_Syllabus.pdf`.
3.  App parses 15 events.
4.  User sees "Midterm" listed as "Assignment". User changes type to "Exam" (Weight 30%).
5.  User clicks "Confirm".
6.  App redirects to Calendar, showing the new events.
7.  Agent pops up: "I see a major exam on Oct 15. Want me to schedule study blocks?"

### Flow 2: "I'm behind on work"
1.  User opens Agent Chat.
2.  Types: "I can't finish the essay tonight. Move my study block."
3.  Agent: "I found a free slot tomorrow at 10 AM. Shall I move it?"
4.  User: "Yes."
5.  Calendar updates instantly.

## 5. UI Libraries & Tools
*   **Framework:** React + Vite
*   **Styling:** Tailwind CSS
*   **Components:** shadcn/ui (Radix UI)
*   **Icons:** Lucide React
*   **Calendar:** `react-big-calendar` or `@fullcalendar/react`
*   **Animations:** `framer-motion` (for smooth chat and transitions)
