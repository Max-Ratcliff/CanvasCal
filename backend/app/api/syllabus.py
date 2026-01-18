from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.schemas.response import APIResponse
from app.services import parser, storage
from app.schemas.event import EventSchema
from app.core.security import get_current_user
from typing import List

router = APIRouter()

@router.post("/syllabus", response_model=APIResponse[List[EventSchema]])
async def process_syllabus(file: UploadFile = File(...), user = Depends(get_current_user)):
    """
    Upload PDF; returns a "Draft Schedule" JSON.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    try:
        raw_text = await parser.extract_text_from_pdf(file)
        if not raw_text.strip():
             raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
             
        events = parser.parse_syllabus_with_gemini(raw_text)
        
        # Save to storage with user_id
        storage.save_events(events, user_id=user.id)
        
        return APIResponse(success=True, message="Syllabus parsed successfully", data=events)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
