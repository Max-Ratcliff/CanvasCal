import pytest
from unittest.mock import MagicMock, patch
from app.services import campus_logic

def test_calculate_transit_time_same_location():
    assert campus_logic.calculate_transit_time("Science Hill", "Science Hill") == 0

def test_calculate_transit_time_known_locations():
    # Based on the simple logic currently implemented
    assert campus_logic.calculate_transit_time("Science Hill", "Oakes") == 20
    assert campus_logic.calculate_transit_time("Kresge", "Cowell") == 15

def test_calculate_transit_time_unknown_locations():
    assert campus_logic.calculate_transit_time("Unknown A", "Unknown B") == 10

@patch('app.services.campus_logic.get_db')
def test_check_availability_free(mock_get_db):
    # Mock DB response for no overlapping events
    mock_client = MagicMock()
    mock_query = MagicMock()
    
    mock_get_db.return_value = mock_client
    mock_client.table.return_value.select.return_value.lte.return_value.gte.return_value = mock_query
    mock_query.execute.return_value.data = []  # No events found
    
    is_free = campus_logic.check_availability("2026-01-18T10:00:00", "2026-01-18T11:00:00")
    assert is_free is True

@patch('app.services.campus_logic.get_db')
def test_check_availability_busy(mock_get_db):
    # Mock DB response for overlapping events
    mock_client = MagicMock()
    mock_query = MagicMock()
    
    mock_get_db.return_value = mock_client
    mock_client.table.return_value.select.return_value.lte.return_value.gte.return_value = mock_query
    # Return one conflicting event
    mock_query.execute.return_value.data = [{"id": "123", "summary": "Conflict"}]
    
    is_free = campus_logic.check_availability("2026-01-18T10:00:00", "2026-01-18T11:00:00")
    assert is_free is False

@patch('app.services.campus_logic.get_db')
def test_check_availability_db_failure(mock_get_db):
    # Mock DB failure
    mock_get_db.return_value = None
    
    # If DB is down, we currently default to True (Fail Open) as per implementation
    is_free = campus_logic.check_availability("2026-01-18T10:00:00", "2026-01-18T11:00:00")
    assert is_free is True
