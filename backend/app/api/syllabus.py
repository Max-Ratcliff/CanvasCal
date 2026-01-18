from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.response import APIResponse
from app.services import parser, storage
from app.schemas.event import EventSchema
from typing import List

router = APIRouter()

@router.post("/syllabus", response_model=APIResponse[List[EventSchema]])
async def process_syllabus(file: UploadFile = File(...)):
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
        
        # Save to storage
        storage.save_events(events)
        
        return APIResponse(success=True, message="Syllabus parsed successfully", data=events)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
