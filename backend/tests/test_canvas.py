from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_get_canvas_assignments_success():
    # Mock settings
    settings.CANVAS_API_URL = "https://canvas.instructure.com"
    
    # Mock Canvas API objects
    mock_canvas_instance = MagicMock()
    mock_user = MagicMock()
    mock_course = MagicMock()
    mock_assignment = MagicMock()

    # Setup Mock Data
    mock_course.id = 101
    mock_course.name = "Intro to CS"
    
    mock_assignment.id = 1
    mock_assignment.name = "Assignment 1"
    mock_assignment.description = "<p>Do this</p>"
    mock_assignment.due_at = "2023-10-10T23:59:59Z"
    mock_assignment.html_url = "https://canvas.instructure.com/courses/101/assignments/1"

    # Setup Mock Returns
    mock_canvas_instance.get_current_user.return_value = mock_user
    mock_user.get_courses.return_value = [mock_course]
    mock_course.get_assignments.return_value = [mock_assignment]

    # Patch the Canvas class where it is used (app.api.canvas)
    with patch("app.api.canvas.Canvas") as MockCanvas:
        MockCanvas.return_value = mock_canvas_instance
        
        response = client.get("/canvas/assignments?canvas_token=fake_token")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["title"] == "Assignment 1"
        assert data["data"][0]["course_name"] == "Intro to CS"

def test_get_canvas_assignments_no_url_config():
    # Ensure URL is empty to trigger error
    settings.CANVAS_API_URL = ""
    
    response = client.get("/canvas/assignments?canvas_token=fake_token")
    assert response.status_code == 400
    assert "Canvas API URL or Access Token missing" in response.json()["detail"]

def test_get_canvas_assignments_api_error():
    # Mock settings
    settings.CANVAS_API_URL = "https://canvas.instructure.com"
    
    # Patch the Canvas class to raise an exception
    with patch("app.api.canvas.Canvas") as MockCanvas:
        mock_instance = MockCanvas.return_value
        # When get_current_user is called, raise an exception
        mock_instance.get_current_user.side_effect = Exception("Invalid Access Token")
        
        response = client.get("/canvas/assignments?canvas_token=invalid_token")
        
        assert response.status_code == 500
        assert "Invalid Access Token" in response.json()["detail"]
