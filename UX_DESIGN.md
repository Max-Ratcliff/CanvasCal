# UX Design & Design System

## 1. The Design DNA
*   **Palette:** 
    *   `Primary (Blue): #1E3A5F` - Headers, Borders, Action Text.
    *   `Accent (Yellow): #F4B400` - Highlight badges, Important icons.
    *   `Background (Cream): #FDFCF0` - Main workspace panels.
    *   `Surface (White): #FFFFFF` - Interactive cards.
*   **Philosophy:** "Verification over Automation." The AI suggests, but the student confirms.

## 2. Core Screens

### A. Centralized Syllabus Manager (Split-View)
The flagship feature for syllabus ingestion.
*   **Left Pane (55%):** Fixed-scroll PDF Viewer (`react-pdf`). Allows users to read the original source text.
*   **Right Pane (45%):** Scrollable "Extracted Events" list. 
*   **Action:** "Confirm" button on each event creates a verified entry in the calendar.

### B. Smart Calendar
Focuses on clarity and high density.
*   **Cell Logic:** Max 2 text labels per day. If >2, show `+X more` indicator.
*   **Modals:** Clicking a day opens a "Day Detail" view showing all events for that date.
*   **Coloring:** Events are color-coded by Course ID (Blue, Green, Purple, etc.).

### C. Proactive Agent Sidebar
*   **Interaction:** Collapsible drawer.
*   **Capabilities:** Suggests study blocks based on calendar gaps before major exams.

## 3. Implementation Stack
*   **Routing:** `react-router-dom`
*   **Components:** custom theme based on shadcn/ui.
*   **Icons:** Lucide React
*   **Animations:** `framer-motion`
*   **Document Rendering:** `react-pdf`