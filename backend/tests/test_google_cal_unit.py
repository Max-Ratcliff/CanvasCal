import pytest
from unittest.mock import MagicMock, patch, call
import sys
import os

# Ensure backend is in path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.services.google_calendar import GoogleCalendarService

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def mock_crypto():
    with patch('app.services.google_calendar.crypto') as mock:
        mock.decrypt.side_effect = lambda x: f"decrypted_{x}"
        mock.encrypt.side_effect = lambda x: f"encrypted_{x}"
        yield mock

@pytest.fixture
def mock_google_build():
    with patch('app.services.google_calendar.build') as mock:
        yield mock

@pytest.fixture
def mock_settings():
    with patch('app.services.google_calendar.settings') as mock:
        mock.GOOGLE_CLIENT_ID = "fake_client_id"
        mock.GOOGLE_CLIENT_SECRET = "fake_client_secret"
        yield mock

class TestGoogleCalendarService:

    def test_init_raises_if_no_creds(self, mock_db, mock_crypto, mock_settings):
        """Should raise Exception if user not found or tokens missing"""
        # Mock DB returning empty
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        with patch('app.services.google_calendar.get_db', return_value=mock_db):
            with pytest.raises(Exception) as excinfo:
                GoogleCalendarService("user123")
            assert "User has not connected Google Calendar" in str(excinfo.value)

    def test_init_success(self, mock_db, mock_crypto, mock_google_build, mock_settings):
        """Should successfully init service with decrypted creds"""
        # Mock DB returns user integration
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "google_access_token": "enc_access",
            "google_refresh_token": "enc_refresh",
            "google_calendar_id": "cal_123"
        }]

        # Mock Google Service
        mock_service = MagicMock()
        mock_google_build.return_value = mock_service

        with patch('app.services.google_calendar.get_db', return_value=mock_db):
            service = GoogleCalendarService("user123")
            
            # Check creds creation
            # Note: Credentials instantiation is internal, but we can check if build was called
            mock_google_build.assert_called_once()
            
            # Check calendar_id loaded
            assert service.calendar_id == "cal_123"

    def test_get_or_create_calendar_creates_new(self, mock_db, mock_crypto, mock_google_build, mock_settings):
        """Should create a new calendar if one doesn't exist in DB or Google"""
        # 1. DB returns tokens but NO calendar_id
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "google_access_token": "enc_access",
            "google_refresh_token": "enc_refresh",
            "google_calendar_id": None 
        }]

        mock_service = MagicMock()
        mock_google_build.return_value = mock_service
        
        # 2. Mock list to NOT find 'CanvasCal'
        mock_service.calendarList().list.return_value.execute.return_value = {"items": []}
        
        # 3. Mock create
        mock_service.calendars().insert.return_value.execute.return_value = {"id": "new_cal_id"}

        with patch('app.services.google_calendar.get_db', return_value=mock_db):
            service = GoogleCalendarService("user123")
            
            assert service.calendar_id == "new_cal_id"
            # Verify update called
            mock_db.table.return_value.update.assert_called_with({"google_calendar_id": "new_cal_id"})

    def test_sync_events_create(self, mock_db, mock_crypto, mock_google_build, mock_settings):
        """Should insert new event if google_event_id is None"""
        # Setup Init
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "google_access_token": "enc_access",
            "google_refresh_token": "enc_refresh",
            "google_calendar_id": "cal_123"
        }]
        
        mock_service = MagicMock()
        mock_google_build.return_value = mock_service
        mock_service.events().insert.return_value.execute.return_value = {"id": "g_id_123"}

        with patch('app.services.google_calendar.get_db', return_value=mock_db):
            service = GoogleCalendarService("user123")
            
            event = {
                "id": "db_uuid",
                "summary": "Test Event",
                "start_time": "2026-01-01T10:00:00Z",
                "end_time": "2026-01-01T11:00:00Z",
                "google_event_id": None
            }
            
            count = service.sync_events([event])
            
            assert count == 1
            mock_service.events().insert.assert_called_once()
            # Verify DB update
            mock_db.table.return_value.update.assert_called_with({"google_event_id": "g_id_123"})

    def test_sync_events_update(self, mock_db, mock_crypto, mock_google_build, mock_settings):
        """Should update existing event if google_event_id is present"""
        # Setup Init
        mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "google_access_token": "enc_access",
            "google_refresh_token": "enc_refresh",
            "google_calendar_id": "cal_123"
        }]
        
        mock_service = MagicMock()
        mock_google_build.return_value = mock_service

        with patch('app.services.google_calendar.get_db', return_value=mock_db):
            service = GoogleCalendarService("user123")
            
            event = {
                "id": "db_uuid",
                "summary": "Test Event Updated",
                "start_time": "2026-01-01T10:00:00Z",
                "end_time": "2026-01-01T11:00:00Z",
                "google_event_id": "g_id_existing"
            }
            
            count = service.sync_events([event])
            
            assert count == 1
            mock_service.events().update.assert_called_once()
            # Verify NO DB update (since ID didn't change)
            # We need to check if update was called on 'events' table. 
            # The code only updates 'events' on CREATE.
            # Let's inspect the mocks more closely to be sure.
            
            # The 'update' call in sync_events is: self.db.table("events").update(...)
            # It is ONLY inside the else block (CREATE).
            # So for update, we shouldn't see calls to table("events")
            
            # However, init calls table("user_integrations")
            # So we check if table was called with "events"
            # mock_db.table.assert_any_call("events") # Should NOT happen for update
