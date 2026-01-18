import sys
import os
import json
import logging
from datetime import datetime

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from canvasapi import Canvas
from app.services.storage import save_events
from app.schemas.event import EventSchema

# Setup basic logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CanvasFetcher")

OUTPUT_FILE = "backend/data/canvas_data.json"

def fetch_and_save_data():
    if not settings.CANVAS_API_URL or not settings.CANVAS_ACCESS_TOKEN:
        logger.error("Canvas URL or Token missing in .env")
        return

    logger.info(f"Connecting to {settings.CANVAS_API_URL}...")
    try:
        canvas = Canvas(settings.CANVAS_API_URL, settings.CANVAS_ACCESS_TOKEN)
        user = canvas.get_current_user()
        logger.info(f"Authenticated as: {user.name}")

        courses = list(user.get_courses(enrollment_state='active'))
        logger.info(f"Found {len(courses)} active courses.")

        extracted_events = []
        raw_data = {
            "assignments": [],
            "announcements": []
        }

        # 1. Fetch Assignments
        for course in courses:
            if not hasattr(course, 'name'):
                continue
            
            logger.info(f"Scanning Course: {course.name}")
            try:
                assignments = course.get_assignments()
                for assign in assignments:
                    # Save raw data for inspection
                    raw_data["assignments"].append({
                        "id": assign.id,
                        "title": assign.name,
                        "due_at": assign.due_at,
                        "course": course.name,
                        "url": assign.html_url
                    })

                    # Convert to EventSchema if it has a due date
                    if assign.due_at:
                        # assign.due_at is typically an ISO string from Canvas
                        extracted_events.append(EventSchema(
                            summary=f"{course.name}: {assign.name}",
                            description=f"Canvas Assignment. Link: {assign.html_url}",
                            start_time=assign.due_at,
                            end_time=assign.due_at, # Assignments are point-in-time
                            location="Canvas",
                            event_type="assignment",
                            weight=getattr(assign, 'points_possible', 0)
                        ))
            except Exception as e:
                logger.warning(f"  Failed to fetch assignments for {course.name}: {e}")

        # 2. Fetch Announcements
        logger.info("Fetching Announcements...")
        course_ids = [f"course_{c.id}" for c in courses if hasattr(c, 'id')]
        if course_ids:
            try:
                # Limit context_codes if there are too many (Canvas limit is usually ~10)
                announcements = canvas.get_announcements(context_codes=course_ids[:10])
                for ann in announcements:
                    raw_data["announcements"].append({
                        "id": ann.id,
                        "title": ann.title,
                        "posted_at": ann.posted_at,
                        "author": getattr(ann, 'user_name', 'Unknown')
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch announcements: {e}")

        # 3. Save Raw Data (for reference)
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w") as f:
            json.dump(raw_data, f, indent=4, default=str)
        logger.info(f"Raw Canvas data saved to: {OUTPUT_FILE}")

        # 4. Save to App's Event Storage
        if extracted_events:
            logger.info(f"Saving {len(extracted_events)} Canvas assignments to local event storage...")
            save_events(extracted_events)
            logger.info("Success! These events will now appear in your app.")
        else:
            logger.info("No assignments with due dates found to save.")

    except Exception as e:
        logger.error(f"Fatal error fetching data: {e}")

if __name__ == "__main__":
    fetch_and_save_data()
