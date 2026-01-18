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

def parse_syllabus_with_gemini(text: str):
    """
    Sends text to Gemini to extract events and overall course insights.
    Returns a dict: {"events": [...], "insights": {...}, "course_name": "..."}
    """
    if not settings.GEMINI_API_KEY:
        raise Exception("GEMINI_API_KEY is not configured.")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    current_year = datetime.now().year
    
    prompt = f"""
    You are an expert academic assistant. Analyze the following syllabus text.
    
    Extract two things:
    1. A list of scheduled EVENTS (deadlines, exams, classes).
    2. COURSE INSIGHTS (course name, professor, grading scale, office hours, important policies).

    Return a strict JSON object with this structure:
    {{
        "course_name": "Full Course Name",
        "professor": "Professor Name",
        "events": [
            {{
                "summary": "string",
                "description": "string",
                "start_time": "ISO 8601 (YYYY-MM-DDTHH:MM:SS)",
                "end_time": "ISO 8601 (YYYY-MM-DDTHH:MM:SS)",
                "location": "string",
                "event_type": "class|assignment|exam|study|travel"
            }}
        ],
        "insights": {{
            "grading_scale": "Description of grading",
            "office_hours": "When and where",
            "key_policies": ["policy 1", "policy 2"],
            "summary": "One sentence summary of the course"
        }}
    }}

    Rules:
    1. Infer the year as {current_year} unless specified otherwise.
    2. Return ONLY valid JSON.
    
    Syllabus Text:
    {text[:25000]}
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        cleaned_json = clean_json_response(response.text)
        data = json.loads(cleaned_json)
        
        # Validate events against schema
        validated_events = []
        for item in data.get("events", []):
            try:
                validated_events.append(EventSchema(**item))
            except:
                continue
        
        data["events"] = validated_events
        return data
    except Exception as e:
        print(f"Gemini Parsing Error: {e}")
        raise Exception(f"Failed to parse syllabus with AI: {str(e)}")
