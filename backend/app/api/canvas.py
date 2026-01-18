from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse
from canvasapi import Canvas
from app.core.config import settings
from typing import List, Dict, Any
import logging

logger = logging.getLogger("CanvasCal")
router = APIRouter()

@router.get("/assignments", response_model=APIResponse[List[Dict[str, Any]]])
async def get_canvas_assignments(canvas_token: str = None):
    """
    Fetches all live deadlines from Canvas API.
    """
    if not settings.CANVAS_API_URL:
        logger.error("CANVAS_API_URL is not configured in settings.")
        raise HTTPException(status_code=500, detail="Canvas API URL not configured.")
    
    # Use provided token, or fallback to server-side configured token
    token = canvas_token or settings.CANVAS_ACCESS_TOKEN
    
    if not token:
         logger.error("No Canvas token found in query param or settings.")
         raise HTTPException(status_code=400, detail="Canvas Access Token required (either via query param or backend .env).")

    try:
        logger.info(f"Connecting to Canvas at {settings.CANVAS_API_URL}")
        canvas = Canvas(settings.CANVAS_API_URL, token)
        user = canvas.get_current_user()
        courses = user.get_courses(enrollment_state='active')
        
        all_assignments = []
        for course in courses:
            try:
                if not hasattr(course, 'name'):
                    continue
                
                # Fetch assignments
                assignments = course.get_assignments()
                for assign in assignments:
                    all_assignments.append({
                        "id": assign.id,
                        "title": assign.name,
                        "description": getattr(assign, 'description', ''),
                        "due_at": assign.due_at,
                        "course_id": course.id,
                        "course_name": course.name,
                        "html_url": assign.html_url
                    })
            except Exception as e:
                # Some courses might not be accessible or have other issues
                logger.warning(f"Error processing course {getattr(course, 'id', 'unknown')}: {e}")
                continue

        return APIResponse(success=True, message="Assignments fetched successfully", data=all_assignments)

    except Exception as e:
        logger.exception("Error fetching Canvas assignments")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/announcements", response_model=APIResponse[List[Dict[str, Any]]])
async def get_canvas_announcements(canvas_token: str = None):
    """
    Fetches announcements from Canvas.
    """
    if not settings.CANVAS_API_URL:
        logger.error("CANVAS_API_URL is not configured in settings.")
        raise HTTPException(status_code=500, detail="Canvas API URL not configured.")
        
    # Use provided token, or fallback to server-side configured token
    token = canvas_token or settings.CANVAS_ACCESS_TOKEN
    
    if not token:
         logger.error("No Canvas token found in query param or settings.")
         raise HTTPException(status_code=400, detail="Canvas Access Token required.")

    try:
        canvas = Canvas(settings.CANVAS_API_URL, token)
        user = canvas.get_current_user()
        courses = list(user.get_courses(enrollment_state='active'))
        course_ids = [course.id for course in courses if hasattr(course, 'id')]
        
        if not course_ids:
            return APIResponse(success=True, message="No active courses found", data=[])

        # get_announcements takes context_codes which are strings like 'course_123'
        context_codes = [f"course_{cid}" for cid in course_ids]
        announcements = canvas.get_announcements(context_codes=context_codes)
        
        all_announcements = []
        for ann in announcements:
            all_announcements.append({
                "id": ann.id,
                "title": ann.title,
                "message": ann.message,
                "posted_at": ann.posted_at,
                "author": getattr(ann, 'user_name', 'Unknown'),
                "html_url": ann.html_url,
                "context_code": ann.context_code
            })

        return APIResponse(success=True, message="Announcements fetched successfully", data=all_announcements)

    except Exception as e:
        logger.exception("Error fetching Canvas announcements")
        raise HTTPException(status_code=400, detail=str(e))
