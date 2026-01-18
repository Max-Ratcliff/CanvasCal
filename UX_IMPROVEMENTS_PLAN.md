# UX Improvements Plan

This plan outlines minimally invasive fixes to improve user experience, consistent visual feedback, and calendar interactivity.

## 1. Visual Response for Google Calendar Connection

**Goal:** Ensure the user clearly sees when their Google Calendar is successfully connected.

**Current State:**
- The frontend likely checks for a connection but doesn't persist a clear "Connected" state or badge.
- Users might re-click the link button, unsure if it worked.

**Implementation Plan:**
1.  **Backend:**
    -   Ensure `GET /auth/user` or `GET /user/integrations` returns a `google_connected: boolean` flag.
    -   Currently, we check `user_integrations` table.
2.  **Frontend (`app/page.tsx`):**
    -   Fetch user integration status on mount.
    -   Replace the "Link Google Calendar" button with a green "Google Calendar Connected" badge (with a checkmark icon) if connected.
    -   Add a small "Disconnect" option (low priority, but good for UX).
3.  **Consistency:**
    -   Ensure this state persists across refreshes by re-fetching the status in `useEffect`.

## 2. Sync Canvas Button Loading State

**Goal:** Provide immediate visual feedback when the "Sync Canvas" action is triggered.

**Current State:**
-   The button might just click and do nothing visible until the toast appears or the page refreshes.

**Implementation Plan:**
1.  **Frontend (`app/page.tsx`):**
    -   Introduce a `isSyncing` state variable.
    -   On click:
        -   Set `isSyncing(true)`.
        -   Disable the button.
        -   Show a spinner icon (`Loader2` from lucide-react) inside the button.
        -   Change text to "Syncing...".
    -   On success/error:
        -   Set `isSyncing(false)`.
        -   Show Success/Error toast.
        -   Re-enable button.

## 3. Assignments as Google "Tasks" (vs. Events)

**Goal:** Sync assignments to Google Tasks for better "checkbox" completion UX.

**Analysis:**
-   **Current Scope:** `https://www.googleapis.com/auth/calendar.events`
-   **Required Scope:** `https://www.googleapis.com/auth/tasks`
-   **Invasiveness:** High. Requires:
    1.  Changing auth scopes (forces all users to re-login/re-consent).
    2.  Adding a new Google API Client for Tasks.
    3.  Modifying the `sync_events` logic to branch between `events.insert` and `tasks.insert`.

**Recommendation (Minimally Invasive):**
-   **Phase 1 (Immediate):** Stick to **Events**.
    -   Use "All Day" events for assignments (since they usually have a due date, not a specific block time).
    -   Prefix title with `[Assignment]`.
    -   Color code them (e.g., specific `colorId`).
-   **Phase 2 (Future):** Implement Tasks API if users specifically request "checkbox" functionality.

**Plan for Phase 1:**
-   Modify `backend/app/api/canvas.py`:
    -   Ensure assignments are created as "All Day" events (start/end date only, no time) OR short 30-min blocks at the due time.
    -   Use a distinct color ID in the Google Calendar payload.

## 4. Calendar UI Improvements (Blocks vs. Dots)

**Goal:** Replace the "dot" indicators with interactive event blocks, similar to standard calendar apps (Google Cal, Apple Cal).

**Current State:**
-   Custom grid implementation using `react` + `lucide-react`.
-   Shows a simple dot if an event exists.
-   No view of event titles or durations.

**Implementation Plan:**
1.  **Library Choice:**
    -   The legacy app used `react-day-picker` (which is what we have now essentially) and `radix-ui`.
    -   **Proposal:** Switch to `react-big-calendar` or `@fullcalendar/react` is often too heavy.
    -   **Lightweight Fix:** Refactor the existing grid in `components/calendar.tsx`:
        -   Instead of a fixed aspect ratio square, make cells taller.
        -   Inside each cell, map through `events` for that day.
        -   Render a small `div` (pill) for each event with:
            -   Truncated title.
            -   Background color.
            -   Click handler to open details (Popover/Dialog).
2.  **Interaction:**
    -   Clicking an event pill should show a `Dialog` or `Popover` with:
        -   Full Title.
        -   Description/Link.
        -   Due Date/Time.
3.  **Responsive:**
    -   On mobile, stick to dots or "n events" text to avoid overflow.
    -   On desktop, show up to 3 stacked pills per day + "+x more".

## Execution Order
1.  **Frontend:** loading state for Sync button.
2.  **Frontend:** Connected state for Google button.
3.  **Backend/Frontend:** Assignment event styling (Color/Prefix).
4.  **Frontend:** Calendar Grid refactor (Pills vs Dots).
