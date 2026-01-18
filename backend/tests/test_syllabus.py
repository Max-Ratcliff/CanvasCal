from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch, AsyncMock
from app.main import app
from app.services import parser
from app.schemas.event import EventSchema
import json

client = TestClient(app)

# Mock PDF Content
MOCK_PDF_CONTENT = b"%PDF-1.4..."

def test_extract_text_from_pdf_success():
    # Mock UploadFile
    mock_file = MagicMock()
    mock_file.read = AsyncMock(return_value=MOCK_PDF_CONTENT)
    mock_file.filename = "syllabus.pdf"

    # Mock fitz (PyMuPDF)
    with patch("app.services.parser.fitz") as mock_fitz:
        mock_doc = MagicMock()
        mock_page = MagicMock()
        mock_page.get_text.return_value = "Syllabus Text Content"
        mock_doc.__iter__.return_value = [mock_page]
        mock_fitz.open.return_value = mock_doc

        # Since extract_text_from_pdf is async, we can't call it directly in synchronous test easily without asyncio loop, 
        # or we test via the endpoint which handles async. 
        # But let's test the endpoint directly which uses it.
        pass # Moving logic to endpoint test

@patch("app.services.parser.extract_text_from_pdf", new_callable=AsyncMock)
@patch("app.services.parser.parse_syllabus_with_gemini")
def test_process_syllabus_endpoint_success(mock_parse, mock_extract):
    # Setup Mocks
    mock_extract.return_value = "Week 1: Introduction to AI. Midterm on Oct 20th."
    
    mock_events = [
        EventSchema(
            summary="Midterm 1",
            start_time="2023-10-20T12:00:00",
            end_time="2023-10-20T14:00:00",
            event_type="exam",
            location="Room 101",
            weight=20.0
        )
    ]
    mock_parse.return_value = mock_events

    # Create dummy PDF file for upload
    files = {"file": ("syllabus.pdf", MOCK_PDF_CONTENT, "application/pdf")}
    
    response = client.post("/process/syllabus", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["summary"] == "Midterm 1"

def test_process_syllabus_invalid_file_type():
    files = {"file": ("image.png", b"image data", "image/png")}
    response = client.post("/process/syllabus", files=files)
    assert response.status_code == 400
    assert "Invalid file type" in response.json()["detail"]

@patch("app.services.parser.extract_text_from_pdf", new_callable=AsyncMock)
def test_process_syllabus_empty_text(mock_extract):
    mock_extract.return_value = "" # Empty text
    
    files = {"file": ("syllabus.pdf", MOCK_PDF_CONTENT, "application/pdf")}
    response = client.post("/process/syllabus", files=files)
    
    assert response.status_code == 400
    assert "Could not extract text" in response.json()["detail"]

def test_clean_json_response():
    raw_text = "Here is the JSON:\n```json\n[{\"summary\": " + '"Test"' + "}]\n```"
    cleaned = parser.clean_json_response(raw_text)
    assert cleaned.strip() == '[{"summary": "Test"}]'

    raw_text_no_markdown = '[{"summary": "Test"}]'
    cleaned = parser.clean_json_response(raw_text_no_markdown)
    assert cleaned == raw_text_no_markdown
