import sys
import os
import logging
from datetime import datetime, timedelta

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from canvasapi import Canvas
from canvasapi.exceptions import CanvasException

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("CanvasGenerator")

def generate_data():
    if not settings.CANVAS_API_URL or not settings.CANVAS_ACCESS_TOKEN:
        logger.error("Canvas URL or Token missing in .env")
        return

    logger.info(f"Connecting to {settings.CANVAS_API_URL}...")
    canvas = Canvas(settings.CANVAS_API_URL, settings.CANVAS_ACCESS_TOKEN)

    try:
        user = canvas.get_current_user()
        logger.info(f"Authenticated as: {user.name} (ID: {user.id})")
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        return

    # 1. Get or Create a Course
    course = None
    course_name = "Gemini Demo 101"
    
    # Check existing active courses
    courses = list(user.get_courses(enrollment_state='active'))
    
    # Try to find our demo course, or just use the first available one
    for c in courses:
        if hasattr(c, 'name') and c.name == course_name:
            course = c
            logger.info(f"Found existing course: {course.name}")
            break
    
    if not course:
        if courses:
            # Use the first available course if we didn't find the specific demo one
            course = courses[0]
            logger.info(f"Using existing course: {course.name} (ID: {course.id})")
        else:
            # Try to create a new course (Requires Teacher/Admin rights)
            logger.info(f"No courses found. Attempting to create '{course_name}'...")
            try:
                account = canvas.get_account(1) # Root account usually ID 1
                course = account.create_course(course={'name': course_name, 'course_code': 'GEM101'})
                logger.info(f"Successfully created course: {course.name} (ID: {course.id})")
                
                # Enroll self as teacher if possible
                try:
                    course.enroll_user(user.id, 'TeacherEnrollment', enrollment={'enrollment_state': 'active'})
                    logger.info("Enrolled self as Teacher.")
                except Exception:
                    logger.warning("Could not enroll self (might already be enrolled or restricted).")
                    
            except CanvasException as e:
                logger.error(f"Failed to create course. You might not have permission: {e}")
                return

    if not course:
        logger.error("Could not find or create a course. Aborting.")
        return

    # 2. Create Assignments
    logger.info(f"--- Generating Assignments in {course.name} ---")
    
    assignments_data = [
        {
            "name": "Read Chapter 1",
            "due_at": (datetime.now() + timedelta(days=2)).isoformat(),
            "points_possible": 10,
            "description": "Introduction to the course material."
        },
        {
            "name": "Midterm Exam",
            "due_at": (datetime.now() + timedelta(days=14)).isoformat(),
            "points_possible": 100,
            "description": "Covers chapters 1-5. Online submission."
        },
        {
            "name": "Final Project Proposal",
            "due_at": (datetime.now() + timedelta(days=30)).isoformat(),
            "points_possible": 50,
            "description": "Submit your PDF proposal here."
        }
    ]

    for data in assignments_data:
        try:
            assign = course.create_assignment(data)
            logger.info(f"Created Assignment: {assign.name} (Due: {assign.due_at})")
        except CanvasException as e:
            logger.error(f"Failed to create assignment '{data['name']}': {e}")

    # 3. Create Announcements
    logger.info(f"--- Generating Announcements in {course.name} ---")
    
    announcements_data = [
        {
            "title": "Welcome to the Course!",
            "message": "Hi everyone, welcome to Gemini Demo 101. Please check the syllabus.",
            "delayed_post_at": None 
        },
        {
            "title": "Midterm Date Change",
            "message": "The midterm has been moved to next Friday. Please update your calendars.",
            "delayed_post_at": None
        }
    ]

    for data in announcements_data:
        try:
            # Canvas API usually treats announcements as 'discussion_topics' with is_announcement=True
            ann = course.create_discussion_topic(
                title=data['title'],
                message=data['message'],
                is_announcement=True
            )
            logger.info(f"Created Announcement: {ann.title}")
        except CanvasException as e:
            logger.error(f"Failed to create announcement '{data['title']}': {e}")

    logger.info("\n--- Generation Complete ---")

if __name__ == "__main__":
    generate_data()
