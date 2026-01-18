import fitz  # PyMuPDF
from google import genai
import json
import re
from fastapi import UploadFile
from typing import List
from app.schemas.event import EventSchema
from app.core.config import settings
from datetime import datetime, timedelta

async def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Uses PyMuPDF to extract text from PDF.
    """
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

def clean_json_response(response_text: str) -> str:
    """
    Cleans markdown code blocks from the response to get raw JSON.
    """
    match = re.search(r"```json\s*(.*?)\s*```", response_text, re.DOTALL)
    if match:
        return match.group(1)
    return response_text

def parse_syllabus_with_gemini(text: str) -> List[EventSchema]:
    """
    Sends text to Gemini to extract events.
    """
    if not settings.GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    current_year = datetime.now().year
    
    prompt = f"""
    You are an expert academic scheduler. Extract all important dates, deadlines, exams, and class times from the following syllabus text.
    
    Return a strict JSON array of objects. Each object must follow this schema:
    {{
        "summary": "string (e.g., 'Midterm 1', 'Assignment 3', 'Class')",
        "description": "string (optional details)",
        "start_time": "ISO 8601 datetime string (YYYY-MM-DDTHH:MM:SS)",
        "end_time": "ISO 8601 datetime string (YYYY-MM-DDTHH:MM:SS)",
        "location": "string (optional)",
        "event_type": "one of ['class', 'assignment', 'exam', 'study', 'travel']",
        "weight": number (optional float, e.g., 20.0 for 20%)
    }}

    Rules:
    1. Infer the year as {current_year} unless specified otherwise.
    2. If a time is not specified for a deadline, assume 23:59:00.
    3. If a time is not specified for an exam/class, assume 12:00:00 start and 13:00:00 end (or infer from context).
    4. Return ONLY valid JSON. No conversational text.
    
    Syllabus Text:
    {text[:20000]}  # Truncate to avoid context limit if huge
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-lite-preview-02-05',
            contents=prompt
        )
        cleaned_json = clean_json_response(response.text)
        data = json.loads(cleaned_json)
        
        events = []
        for item in data:
            # Basic validation/cleanup can happen here if needed
            events.append(EventSchema(**item))
            
        return events
    except Exception as e:
        print(f"Gemini Parsing Error: {e}")
        # In a real app, you might return an empty list or raise, 
        # but for now let's raise so we see the error.
        raise Exception(f"Failed to parse syllabus with AI: {str(e)}")
