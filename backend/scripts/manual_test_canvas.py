import asyncio
import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from canvasapi import Canvas

async def test_live_canvas():
    print("--- Starting Live Canvas API Test ---")
    
    url = settings.CANVAS_API_URL
    token = settings.CANVAS_ACCESS_TOKEN

    if not url or not token or token == "your_canvas_access_token":
        print("Error: CANVAS_API_URL or CANVAS_ACCESS_TOKEN is missing or invalid in backend/.env")
        print(f"URL: {url}")
        print(f"Token: {'*' * 5 if token else 'None'}")
        return

    print(f"Connecting to Canvas at: {url}")
    
    try:
        canvas = Canvas(url, token)
        user = canvas.get_current_user()
        print(f"Successfully authenticated as: {user.name} (ID: {user.id})")
        
        courses = user.get_courses(enrollment_state='active')
        print(f"\nFetching active courses...")
        
        count = 0
        for course in courses:
            if not hasattr(course, 'name'):
                continue
            
            print(f"\n[Course] {course.name} (ID: {course.id})")
            
            # Check for direct Syllabus Body (HTML)
            if hasattr(course, 'syllabus_body') and course.syllabus_body:
                print(f"  - Syllabus Body Found: Yes ({len(course.syllabus_body)} chars)")
            else:
                print(f"  - Syllabus Body Found: No")

            # Check for Syllabus Files
            try:
                # Search for files with 'syllabus' in the name
                files = course.get_files(search_term='syllabus')
                s_files = list(files)
                if s_files:
                    for f in s_files:
                        ctype = getattr(f, 'content-type', 'unknown')
                        print(f"  - Syllabus File Found: {f.display_name} (ID: {f.id}, Type: {ctype})")
                else:
                    print("  - No files named 'syllabus' found.")
            except Exception as e:
                print(f"  - Could not search files: {e}")

            try:
                assignments = course.get_assignments() # fetch all assignments
                a_count = 0
                for assign in assignments:
                    print(f"  - Assignment: {assign.name} (Due: {assign.due_at})")
                    a_count += 1
                if a_count == 0:
                    print("  - No assignments found.")
            except Exception as e:
                print(f"  - Error fetching assignments: {e}")
            
            count += 1
            if count >= 3:
                print("\n(Stopping after 3 courses for brevity)")
                break
        
        if count == 0:
            print("No active courses found.")
        else:
            print(f"\nFetching announcements for active courses...")
            course_ids = [f"course_{c.id}" for c in courses if hasattr(c, 'id')]
            if course_ids:
                announcements = canvas.get_announcements(context_codes=course_ids[:10]) # limit to first 10 for speed
                ann_count = 0
                for ann in announcements:
                    print(f"  - Announcement: {ann.title} (Posted: {ann.posted_at})")
                    ann_count += 1
                if ann_count == 0:
                    print("  - No announcements found.")

        print("\n--- Live Test Complete: SUCCESS ---")

    except Exception as e:
        print(f"\n--- Live Test Failed ---")
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_live_canvas())
