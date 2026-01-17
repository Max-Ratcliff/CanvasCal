from fastapi import APIRouter, HTTPException
from app.schemas.response import APIResponse

router = APIRouter()

@router.post("/google", response_model=APIResponse)
async def google_auth_exchange(auth_code: str):
    """
    Exchange auth code for Google Refresh Token.
    """
    # TODO: Implement Google OAuth exchange logic
    return APIResponse(success=True, message="Not implemented", data=None)
