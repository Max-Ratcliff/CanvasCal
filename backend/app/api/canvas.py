from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from app.schemas.response import APIResponse
from canvasapi import Canvas
from app.core.config import settings
from app.services import parser
from app.schemas.event import EventSchema
from app.core.security import get_current_user
from app.db import get_db
from app.services.google_calendar import get_calendar_service
from typing import List, Dict, Any, Optional
import logging
import uuid
import httpx
import tempfile
import os
import io

router = APIRouter()
logger = logging.getLogger(__name__)

def get_canvas_client(user_id: str, token_override: str = None) -> Canvas:
    """
    Gets Canvas client using stored user token or override.
    """
    if token_override:
        return Canvas(settings.CANVAS_API_URL, token_override)

    db = get_db()
    # Check for stored integration
    result = db.table("user_integrations").select("canvas_access_token").eq("user_id", user_id).execute()
    
    if result.data and result.data[0].get("canvas_access_token"):
        # TODO: Decrypt token here once we implement Canvas token encryption
        return Canvas(settings.CANVAS_API_URL, result.data[0]["canvas_access_token"])
    
    # Fallback to env var for demo/single-user mode if not in DB
    if settings.CANVAS_ACCESS_TOKEN:
        return Canvas(settings.CANVAS_API_URL, settings.CANVAS_ACCESS_TOKEN)

    raise HTTPException(status_code=400, detail="Canvas Access Token missing. Please link Canvas first.")

@router.get("/assignments", response_model=APIResponse)
async def get_canvas_assignments(canvas_token: str = None, user = Depends(get_current_user)):
    """
    Fetches assignments from all active courses in Canvas (Passthrough).
    """
    try:
        canvas = get_canvas_client(user.id, canvas_token)
        user_canvas = canvas.get_current_user()
        courses = user_canvas.get_courses(enrollment_state='active')
        
        all_assignments = []
        for course in courses:
            try:
                assignments = course.get_assignments()
                for assignment in assignments:
                    all_assignments.append({
                        "id": assignment.id,
                        "title": assignment.name,
                        "description": getattr(assignment, 'description', ''),
                        "due_at": getattr(assignment, 'due_at', None),
                        "course_id": course.id,
                        "course_name": getattr(course, 'name', f"Course {course.id}"),
                        "html_url": getattr(assignment, 'html_url', '')
                    })
            except Exception as e:
                logger.warning(f"Failed to fetch assignments for course {course.id}: {e}")
                continue
                
        return APIResponse(success=True, message="Assignments fetched", data=all_assignments)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Canvas API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_syllabus_for_course(course, user_id: str):
    """
    Helper to find, download, and parse syllabus for a course.
    """
    try:
        files = course.get_files()
        syllabus_file = None
        for f in files:
            if "syllabus" in f.display_name.lower() and f.display_name.endswith(".pdf"):
                syllabus_file = f
                break
        
        if not syllabus_file:
            return []

        # Download
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            async with httpx.AsyncClient() as client:
                async with client.stream("GET", syllabus_file.url) as r:
                    async for chunk in r.aiter_bytes():
                        tmp.write(chunk)
            tmp_path = tmp.name

        # Parse
        with open(tmp_path, "rb") as f:
            pdf_content = f.read()
        
        # Mock UploadFile
        from starlette.datastructures import UploadFile as StarletteUploadFile
        mock_file = StarletteUploadFile(filename=syllabus_file.display_name, file=io.BytesIO(pdf_content))
        
        text = await parser.extract_text_from_pdf(mock_file)
        os.remove(tmp_path)
        
        events = parser.parse_syllabus_with_gemini(text)
        
        # Enrich events
        for e in events:
            e.course_id = str(course.id)
            e.source = "ai_syllabus"
            e.verified = False # Needs user verification
            e.description = f"Extracted from {syllabus_file.display_name}: {e.description or ''}"
            
        return events
    except Exception as e:
        logger.warning(f"Syllabus processing failed for course {course.id}: {e}")
        return []

@router.post("/sync", response_model=APIResponse)
async def sync_canvas_data(
    background_tasks: BackgroundTasks,
    canvas_token: Optional[str] = None,
    user = Depends(get_current_user)
):
    """
    Auto-Syncs everything from Canvas:
    1. Assignments
    2. Announcements
    3. Syllabus Events (AI Parsed)
    Then pushes to Google Calendar.
    """
    try:
        canvas = get_canvas_client(user.id, canvas_token)
        canvas_user = canvas.get_current_user()
        courses = canvas_user.get_courses(enrollment_state='active')
        
        db = get_db()
        new_events_count = 0
        
        for course in courses:
            # A. Assignments
            try:
                assignments = course.get_assignments()
                for assign in assignments:
                    if not getattr(assign, 'due_at', None):
                        continue
                    
                    # Generate deterministic ID
                    unique_string = f"{user.id}-{assign.name}-{assign.due_at}"
                    event_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_string))

                    event_data = {
                        "id": event_id,
                        "user_id": user.id,
                        "summary": assign.name,
                        "description": getattr(assign, 'description', '') or '',
                        "start_time": assign.due_at, # Canvas due_at is usually end time
                        "end_time": assign.due_at,   # Use same for now or subtract 1 hour
                        "location": "Canvas",
                        "event_type": "assignment",
                        "course_id": str(course.id),
                        "source": "canvas_api",
                        "verified": True
                    }
                    
                    # Upsert (no on_conflict needed as 'id' is PK)
                    result = db.table("events").upsert(event_data).execute()
                    if result.data: new_events_count += 1
            except Exception as e:
                logger.warning(f"Assignment sync failed for {course.id}: {e}")

            # B. Announcements (Convert to events?)
            # For now, let's just log them or store as 'notification' type events if they have dates
            # skipping complex NLP on announcements for MVP speed

            # C. Syllabus (AI)
            # We run this in background as it's slow
            background_tasks.add_task(process_and_save_syllabus, course, user.id)

        # Trigger Google Sync for what we have so far
        if new_events_count > 0:
            gcal = get_calendar_service(user.id)
            # Fetch what we just inserted (or all unsynced)
            unsynced = db.table("events").select("*").eq("user_id", user.id).is_("google_event_id", "null").execute()
            if unsynced.data:
                background_tasks.add_task(gcal.sync_events, unsynced.data)

        return APIResponse(success=True, message=f"Sync started. Found {new_events_count} assignments. Syllabus parsing in background.", data={"new_assignments": new_events_count})

    except Exception as e:
        logger.error(f"Canvas Sync Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_and_save_syllabus(course, user_id: str):
    """
    Background task wrapper
    """
    events = await process_syllabus_for_course(course, user_id)
    if events:
        db = get_db()
        gcal = get_calendar_service(user_id)
        
        saved_events = []
        for e in events:
            data = e.model_dump(mode='json')
            data['user_id'] = user_id
            res = db.table("events").insert(data).execute()
            if res.data:
                saved_events.extend(res.data)
        
        # Sync found syllabus events to Google
        if saved_events:
            gcal.sync_events(saved_events)