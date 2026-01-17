from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse

router = APIRouter()

@router.get("/assignments", response_model=APIResponse)
async def get_canvas_assignments(canvas_token: str):
    """
    Fetches all live deadlines from Canvas API.
    """
    # TODO: Implement Canvas API fetch logic
    return APIResponse(success=True, message="Not implemented", data=None)
