from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from canvasapi import Canvas
from app.schemas.response import APIResponse
from app.core.config import settings
from app.services import parser
from app.schemas.event import EventSchema
from app.core.security import get_current_user
from app.db import get_db
from app.services.google_calendar import get_calendar_service
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
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
    from app.services.crypto import crypto
    from app.db import get_service_db
    
    db = get_service_db()
    
    # 1. Use Override if provided (usually from manual testing/demo)
    if token_override:
        logger.info(f"Using provided token override for user {user_id}")
        return Canvas(settings.CANVAS_API_URL, token_override)

    # 2. Check DB for stored integration
    result = db.table("user_integrations").select("canvas_access_token", "canvas_base_url").eq("user_id", user_id).execute()
    
    if result.data and result.data[0].get("canvas_access_token"):
        row = result.data[0]
        try:
            enc_token = row["canvas_access_token"]
            decrypted_token = crypto.decrypt(enc_token)
            
            # Use stored URL or fallback to global setting
            base_url = row.get("canvas_base_url")
            if not base_url or base_url == "":
                base_url = settings.CANVAS_API_URL
            
            if not base_url:
                base_url = "https://canvas.instructure.com" # Ultimate fallback

            logger.info(f"Connecting to Canvas at {base_url} (Token length: {len(decrypted_token)})")
            return Canvas(base_url, decrypted_token)
        except Exception as e:
            logger.error(f"Failed to decrypt/initialize Canvas client: {e}")
            raise HTTPException(status_code=500, detail="Secure token decryption failed")
    
    # 3. Fallback to System Default (if configured in .env)
    if settings.CANVAS_ACCESS_TOKEN and settings.CANVAS_API_URL:
        logger.info(f"Using system-default Canvas credentials for user {user_id}")
        return Canvas(settings.CANVAS_API_URL, settings.CANVAS_ACCESS_TOKEN)

    raise HTTPException(status_code=400, detail="Canvas connection not found. Please link your account first.")

class CanvasConnectRequest(BaseModel):
    canvas_url: str
    access_token: str

@router.post("/connect", response_model=APIResponse)
async def connect_canvas(request: CanvasConnectRequest, user = Depends(get_current_user)):
    """
    Saves Canvas URL and Access Token to the DB.
    """
    try:
        from app.services.crypto import crypto
        from app.db import get_service_db
        
        db = get_service_db()
        
        # Clean URL (remove trailing slashes)
        base_url = request.canvas_url.strip().rstrip('/')
        if not base_url.startswith('http'):
            base_url = f"https://{base_url}"
            
        # Common typo correction: instructure.edu -> instructure.com
        if "canvas.instructure.edu" in base_url:
            base_url = base_url.replace("canvas.instructure.edu", "canvas.instructure.com")
            logger.info(f"Corrected Canvas URL typo to: {base_url}")

        # Encrypt the token (strip whitespace)
        token_to_encrypt = request.access_token.strip()
        enc_token = crypto.encrypt(token_to_encrypt)

        data = {
            "user_id": user.id,
            "canvas_base_url": base_url,
            "canvas_access_token": enc_token,
            "updated_at": "now()"
        }

        db.table("user_integrations").upsert(data).execute()
        
        return APIResponse(success=True, message="Canvas connected successfully", data=None)
    except Exception as e:
        logger.error(f"Canvas Connect Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)

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
        pdf_content = b""
        async with httpx.AsyncClient() as client:
            # Follow redirects as Canvas often redirects file URLs to AWS/S3
            res = await client.get(syllabus_file.url, follow_redirects=True)
            res.raise_for_status()
            pdf_content = res.content
        
        if not pdf_content:
            logger.warning(f"Empty PDF content for course {course.id}")
            return []

        # Mock UploadFile
        from starlette.datastructures import UploadFile as StarletteUploadFile
        syllabus_mock_file = StarletteUploadFile(filename=syllabus_file.display_name, file=io.BytesIO(pdf_content))
        
        text = await parser.extract_text_from_pdf(syllabus_mock_file)
        
        # New parser returns {"course_name": ..., "events": [...], "insights": {}}
        result = parser.parse_syllabus_with_gemini(text)
        
        events = result.get("events", [])
        insights = result.get("insights", {})
        # Force use of the official Canvas name so the frontend can match it to the sidebar entry
        official_course_name = getattr(course, 'name', f"Course {course.id}")
        
        # Enrich events
        processed_events = []
        for e in events:
            # e is already an EventSchema object from the parser
            e.course_id = str(course.id)
            e.source = "ai_syllabus"
            e.verified = False
            e.description = f"Extracted from {syllabus_file.display_name}: {e.description or ''}"
            processed_events.append(e)
            
        # Store syllabus record in DB for the Viewer
        from app.services.storage import save_syllabus
        # We store the Canvas file ID so we can proxy it on demand
        save_syllabus(
            user_id, 
            official_course_name, 
            text[:50000], 
            insights, 
            pdf_url=str(syllabus_file.id) # Use ID as a reference
        )
            
        return processed_events
    except Exception as e:
        logger.error(f"Syllabus processing failed for course {course.id}: {e}")
        raise e

@router.get("/file/{file_id}")
async def proxy_canvas_file(file_id: int, user = Depends(get_current_user)):
    """
    Proxies a file from Canvas on demand so we don't store it.
    """
    try:
        canvas = get_canvas_client(user.id)
        file = canvas.get_file(file_id)
        
        async with httpx.AsyncClient() as client:
            # We must follow redirects as Canvas URLs point to S3
            res = await client.get(file.url, follow_redirects=True)
            res.raise_for_status()
            
            from fastapi.responses import Response
            return Response(
                content=res.content,
                media_type="application/pdf",
                headers={"Content-Disposition": f"inline; filename={file.display_name}"}
            )
    except Exception as e:
        logger.error(f"File Proxy Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch file from Canvas")

@router.get("/courses", response_model=APIResponse)
async def get_canvas_courses(user = Depends(get_current_user)):
    """
    Fetches list of active courses and checks for syllabus files.
    """
    try:
        canvas = get_canvas_client(user.id)
        canvas_user = canvas.get_current_user()
        courses = canvas_user.get_courses(enrollment_state='active')
        
        course_list = []
        for course in courses:
            # Check for syllabus file
            files = course.get_files()
            syllabus_file_id = None
            for f in files:
                if "syllabus" in f.display_name.lower() and f.display_name.endswith(".pdf"):
                    syllabus_file_id = f.id
                    break
            
            course_list.append({
                "id": course.id,
                "name": getattr(course, 'name', f"Course {course.id}"),
                "syllabus_file_id": syllabus_file_id
            })
            
        return APIResponse(success=True, message="Courses fetched", data=course_list)
    except Exception as e:
        logger.error(f"Canvas Courses Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)

@router.post("/process-course/{course_id}", response_model=APIResponse)
async def process_specific_course(course_id: int, user = Depends(get_current_user)):
    """
    Triggers AI processing for a specific course on-demand.
    """
    try:
        canvas = get_canvas_client(user.id)
        course = canvas.get_course(course_id)
        
        # This is the existing logic but for one course
        events = await process_syllabus_for_course(course, user.id)
        
        # Trigger Google Sync for found events
        if events:
            from app.services.google_calendar import get_calendar_service
            gcal = get_calendar_service(user.id)
            gcal.sync_events([e.model_dump(mode='json') for e in events])

        return APIResponse(success=True, message="Course processed successfully", data=None)
    except Exception as e:
        logger.error(f"Process Course Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)

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
                    
                    # Parse due_at and ensure valid range
                    try:
                        due_dt = datetime.fromisoformat(assign.due_at.replace('Z', '+00:00'))
                        # Google requires a duration, so we set start to 30 mins before
                        start_dt = due_dt - timedelta(minutes=30)
                    except Exception as e:
                        logger.warning(f"Failed to parse due_at '{assign.due_at}': {e}")
                        continue

                    # Generate deterministic ID
                    unique_string = f"{user.id}-{assign.name}-{assign.due_at}"
                    event_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, unique_string))

                    event_data = {
                        "id": event_id,
                        "user_id": user.id,
                        "summary": assign.name,
                        "description": getattr(assign, 'description', '') or '',
                        "start_time": start_dt.isoformat(),
                        "end_time": due_dt.isoformat(),
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