from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse
from canvasapi import Canvas
from app.core.config import settings
from typing import List, Dict, Any

router = APIRouter()

@router.get("/assignments", response_model=APIResponse[List[Dict[str, Any]]])
async def get_canvas_assignments(canvas_token: str):
    """
    Fetches all live deadlines from Canvas API.
    """
    if not settings.CANVAS_API_URL:
        raise HTTPException(status_code=500, detail="Canvas API URL not configured.")

    try:
        canvas = Canvas(settings.CANVAS_API_URL, canvas_token)
        user = canvas.get_current_user()
        courses = user.get_courses(enrollment_state='active')
        
        all_assignments = []
        for course in courses:
            try:
                if not hasattr(course, 'name'):
                    continue
                
                # Fetch upcoming assignments
                assignments = course.get_assignments(bucket='upcoming')
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
            except Exception:
                # Some courses might not be accessible or have other issues
                continue

        return APIResponse(success=True, message="Assignments fetched successfully", data=all_assignments)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
