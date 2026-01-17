from fastapi import APIRouter, UploadFile, File, HTTPException
from app.schemas.response import APIResponse
from app.services import parser

router = APIRouter()

@router.post("/syllabus", response_model=APIResponse)
async def process_syllabus(file: UploadFile = File(...)):
    """
    Upload PDF; returns a "Draft Schedule" JSON.
    """
    # TODO: Implement PDF upload and processing logic
    # raw_text = parser.extract_text_from_pdf(file)
    # events = parser.parse_syllabus_with_gemini(raw_text)
    return APIResponse(success=True, message="Not implemented", data=None)
