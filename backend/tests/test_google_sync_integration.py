import pytest
from unittest.mock import MagicMock, patch
from dotenv import load_dotenv
import os
import uuid
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Load env before importing app modules
load_dotenv()

from app.services.google_calendar import GoogleCalendarService
from app.services.crypto import crypto
from app.db import get_db

# Use a specific UUID for the test user
TEST_USER_ID = "00000000-0000-0000-0000-000000000000"

@pytest.fixture
def db():
    return get_db()

@pytest.fixture
def setup_test_data(db):
    user_id = TEST_USER_ID
    
    # Check for Service Role Key to bypass RLS
    service_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    client = db
    if service_key:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL")
        client = create_client(url, service_key)
    else:
        print("\nWARNING: No SUPABASE_SERVICE_KEY found. RLS might block this test.")

    # 1. Clean up potential leftovers
    client.table("user_integrations").delete().eq("user_id", user_id).execute()
    client.table("events").delete().eq("user_id", user_id).execute()
    
    # 2. Create User Integration Entry
    enc_token = crypto.encrypt("fake_token")
    client.table("user_integrations").insert({
        "user_id": user_id,
        "google_access_token": enc_token,
        "google_refresh_token": enc_token,
        "google_calendar_id": "primary"
    }).execute()
    
    yield user_id
    
    # 3. Cleanup
    client.table("user_integrations").delete().eq("user_id", user_id).execute()
    client.table("events").delete().eq("user_id", user_id).execute()

@patch('app.services.google_calendar.build')
def test_sync_flow_integration(mock_build, db, setup_test_data):
    """
    Tests the sync engine using REAL Supabase but MOCKED Google API.
    """
    user_id = setup_test_data
    
    # Setup Google Mock
    mock_service = MagicMock()
    mock_build.return_value = mock_service
    
    # Mock Google Insert Response
    mock_service.events().insert.return_value.execute.return_value = {"id": "gcal_test_id"}
    
    # Mock Calendar List
    mock_service.calendarList().list.return_value.execute.return_value = {"items": []}
    mock_service.calendars().insert.return_value.execute.return_value = {"id": "new_canvas_cal_id"}

    # 1. Insert a local event into Supabase
    event_id = str(uuid.uuid4())
    db.table("events").insert({
        "id": event_id,
        "user_id": user_id,
        "summary": "Integration Test Event",
        "start_time": "2026-01-01T10:00:00Z",
        "end_time": "2026-01-01T11:00:00Z",
        "event_type": "test",
        "google_event_id": None
    }).execute()

    # 2. Init Service
    service = GoogleCalendarService(user_id)
    
    # 3. Verify Calendar Logic
    assert service.calendar_id == "primary" 

    # 4. Trigger Sync
    events_to_sync = db.table("events").select("*").eq("id", event_id).execute().data
    count = service.sync_events(events_to_sync)
    
    assert count == 1
    
    # 5. Verify Google API called
    mock_service.events().insert.assert_called_once()
    
    # 6. Verify Supabase updated
    updated_event = db.table("events").select("google_event_id").eq("id", event_id).execute().data[0]
    assert updated_event["google_event_id"] == "gcal_test_id"