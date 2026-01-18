import pytest
from unittest.mock import MagicMock, patch
from app.services import agent

@patch('app.db.get_db')
def test_add_calendar_event(mock_get_db):
    mock_client = MagicMock()
    mock_get_db.return_value = mock_client
    
    # Mock the insert return
    mock_client.table.return_value.insert.return_value.execute.return_value.data = [{
        "id": "1", "summary": "Test Event", "start_time": "2026-01-01T10:00:00+00:00", "end_time": "2026-01-01T11:00:00+00:00"
    }]
    
    result = agent.add_calendar_event(
        summary="Test Event",
        start_time="2026-01-01T10:00:00Z",
        end_time="2026-01-01T11:00:00Z",
        description="Desc",
        location="Loc",
        event_type="study",
        repeat_frequency=None,
        repeat_count=None,
        repeat_until=None
    )
    
    assert result["status"] == "success"
    assert result["events_created"] == 1
    assert result["first_event"]["summary"] == "Test Event"

@patch('app.db.get_db')
def test_get_calendar_events(mock_get_db):
    mock_client = MagicMock()
    mock_get_db.return_value = mock_client
    
    mock_query = MagicMock()
    mock_client.table.return_value.select.return_value.gte.return_value.lte.return_value = mock_query
    mock_query.execute.return_value.data = [{"id": "1", "summary": "Existing Event"}]
    
    events = agent.get_calendar_events("2026-01-01T00:00:00Z", "2026-01-02T00:00:00Z")
    
    assert len(events) == 1
    assert events[0]["summary"] == "Existing Event"

@patch('app.db.get_db')
def test_delete_calendar_event(mock_get_db):
    mock_client = MagicMock()
    mock_get_db.return_value = mock_client
    
    mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = [{"id": "1"}]
    
    result = agent.delete_calendar_event("1")
    
    assert result["status"] == "success"
    assert result["deleted"][0]["id"] == "1"
