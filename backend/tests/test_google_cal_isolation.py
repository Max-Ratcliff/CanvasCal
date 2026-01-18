import pytest
from unittest.mock import MagicMock, patch
import os

# Set dummy env vars BEFORE imports
os.environ["SECRET_KEY"] = "GelyUCjKFNiJm6w3D_rQYtCL0AH7pxauY-SR9jNszBg="
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

# Now we can import app modules
from app.services.google_calendar import GoogleCalendarService
from app.core.config import settings

# Mock credentials and DB response
MOCK_USER_ID = "test-user-123"
MOCK_CREDS = MagicMock()
MOCK_DB_RESPONSE = MagicMock()
MOCK_DB_RESPONSE.data = [{
    "google_access_token": "enc_access",
    "google_refresh_token": "enc_refresh",
    "google_calendar_id": None # Simulate first run
}]

@pytest.fixture(autouse=True)
def mock_settings():
    """Ensure settings are mocked for all tests"""
    with patch("app.core.config.settings.SECRET_KEY", "GelyUCjKFNiJm6w3D_rQYtCL0AH7pxauY-SR9jNszBg="):
        yield

@pytest.fixture
def mock_dependencies():
    with patch("app.services.google_calendar.get_db") as mock_db, \
         patch("app.services.google_calendar.crypto") as mock_crypto, \
         patch("app.services.google_calendar.build") as mock_build, \
         patch("app.services.google_calendar.Credentials") as mock_creds_cls:
        
        # Setup DB Mock
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = MOCK_DB_RESPONSE
        
        # Setup Crypto Mock
        mock_crypto.decrypt.return_value = "decrypted_token"
        
        # Setup Google Service Mock
        mock_service = MagicMock()
        mock_build.return_value = mock_service
        
        yield mock_service, mock_db


def test_creates_new_calendar_if_missing(mock_dependencies):
    mock_service, mock_db = mock_dependencies
    
    # Simulate: List calendars returns only 'primary'
    mock_service.calendarList().list().execute.return_value = {
        "items": [{"id": "primary", "summary": "primary"}]
    }
    
    # Simulate: Create calendar returns new ID
    mock_service.calendars().insert().execute.return_value = {"id": "new-canvas-cal-id"}
    
    # Init Service
    service = GoogleCalendarService(MOCK_USER_ID)
    
    # Assertions
    assert service.calendar_id == "new-canvas-cal-id"
    # Verify it tried to create 'CanvasCal'
    mock_service.calendars().insert.assert_called_with(body={'summary': 'CanvasCal', 'timeZone': 'UTC'})
    # Verify it updated DB
    mock_db.return_value.table.return_value.update.assert_called()

def test_uses_existing_calendar_if_found(mock_dependencies):
    mock_service, mock_db = mock_dependencies
    
    # Simulate: List calendars finds 'CanvasCal'
    mock_service.calendarList().list().execute.return_value = {
        "items": [
            {"id": "primary", "summary": "primary"},
            {"id": "existing-cal-id", "summary": "CanvasCal"}
        ]
    }
    
    # Init Service
    service = GoogleCalendarService(MOCK_USER_ID)
    
    # Assertions
    assert service.calendar_id == "existing-cal-id"
    # Should NOT create new
    mock_service.calendars().insert.assert_not_called()
    # Should update DB with found ID
    mock_db.return_value.table.return_value.update.assert_called_with({"google_calendar_id": "existing-cal-id"})

def test_uses_stored_id_if_present():
    with patch("app.services.google_calendar.get_db") as mock_db, \
         patch("app.services.google_calendar.crypto"), \
         patch("app.services.google_calendar.build"), \
         patch("app.services.google_calendar.Credentials"):
        
        # Simulate DB has a stored ID
        mock_response = MagicMock()
        mock_response.data = [
            {
                "google_access_token": "enc",
                "google_refresh_token": "enc",
                "google_calendar_id": "stored-cal-id"
            }
        ]
        mock_db.return_value.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        service = GoogleCalendarService(MOCK_USER_ID)
        
        assert service.calendar_id == "stored-cal-id"
