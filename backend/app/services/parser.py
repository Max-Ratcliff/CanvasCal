from fastapi import UploadFile
from typing import List
from app.schemas.event import EventSchema

def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Uses PyMuPDF to extract text from PDF.
    """
    # TODO: Implement PyMuPDF logic
    pass

def parse_syllabus_with_gemini(text: str) -> List[EventSchema]:
    """
    Sends text to Gemini to extract events.
    """
    # TODO: Implement Gemini prompt and parsing
    pass
