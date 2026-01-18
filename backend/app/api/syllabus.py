from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.schemas.response import APIResponse
from app.services import parser, storage
from app.schemas.event import EventSchema
from app.core.security import get_current_user
from typing import List

router = APIRouter()

@router.post("/syllabus", response_model=APIResponse)
async def process_syllabus(file: UploadFile = File(...), user = Depends(get_current_user)):
    """
    Upload PDF; parses events and course insights, saves to DB.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        raw_text = await parser.extract_text_from_pdf(file)
        if not raw_text.strip():
             raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
             
        result = parser.parse_syllabus_with_gemini(raw_text)
        
        # Save events
        storage.save_events(result["events"], user_id=user.id)
        
        # Save syllabus record
        storage.save_syllabus(
            user_id=user.id,
            course_name=result.get("course_name", "Unknown Course"),
            raw_text=raw_text,
            insights=result.get("insights", {})
        )
        
        return APIResponse(success=True, message="Syllabus parsed and saved successfully", data=result)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/syllabus", response_model=APIResponse)
async def get_all_syllabi(user = Depends(get_current_user)):
    """
    Fetch all syllabi for the user.
    """
    try:
        data = storage.get_syllabi(user.id)
        return APIResponse(success=True, message="Syllabi fetched", data=data)
    except Exception as e:
        return APIResponse(success=False, message=str(e), data=None)
