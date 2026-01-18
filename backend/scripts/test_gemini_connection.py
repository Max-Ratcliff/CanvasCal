import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.parser import parse_syllabus_with_gemini
from app.services.storage import save_events
from app.core.config import settings

def test_connection():
    print("--- Testing Gemini API Connection ---")
    
    if not settings.GEMINI_API_KEY:
        print("Error: GEMINI_API_KEY is missing in .env")
        return

    # A tiny mock syllabus text to test the model
    mock_text = """
    Course: Test 101
    Exam 1: Jan 30, 2026 at 2pm
    """
    
    print(f"Model: gemini-2.0-flash-lite-preview-02-05")
    print("Sending test request...")
    
    # Debug: List available models
    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        # print("Listing available models...")
        # for m in client.models.list(config={"page_size": 100}):
        #     if "gemini" in m.name:
        #         print(f" - {m.name}")
    except Exception as e:
        print(f"Could not list models: {e}")

    try:
        events = parse_syllabus_with_gemini(mock_text)
        print("\n--- Success! ---")
        print(f"Parsed {len(events)} events.")
        for e in events:
            print(f"- {e.summary}: {e.start_time}")
            
        print("\n--- Testing Storage ---")
        save_events(events)
        print("Events saved successfully to backend/data/events.json")
            
    except Exception as e:
        print("\n--- Connection Failed ---")
        print(f"Error: {e}")

if __name__ == "__main__":
    test_connection()
