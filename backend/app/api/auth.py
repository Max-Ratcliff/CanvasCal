from fastapi import APIRouter, HTTPException, Depends, Body
from app.schemas.response import APIResponse
from app.core.config import settings
from app.services.crypto import crypto
from app.db import get_service_db
from app.core.security import get_current_user
from pydantic import BaseModel
import httpx
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

class GoogleAuthRequest(BaseModel):
    code: str

@router.post("/google", response_model=APIResponse)
async def google_auth_exchange(request: GoogleAuthRequest, user = Depends(get_current_user)):
    """
    Exchanges Google Auth Code for Refresh Token, encrypts it, and stores in DB.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Client ID/Secret not configured")

    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": request.code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "access_type": "offline" # Crucial for getting refresh_token
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=payload)
            response.raise_for_status()
            token_data = response.json()

        access_token = token_data.get("access_token")
        refresh_token = token_data.get("refresh_token")
        
        if not refresh_token:
            # If user has already granted offline access, Google won't send refresh_token again
            # unless we force prompt='consent'. For now, let's just log warning.
            logger.warning("No refresh_token returned from Google. User might have already authorized.")

        # Encrypt tokens
        enc_access = crypto.encrypt(access_token)
        enc_refresh = crypto.encrypt(refresh_token) if refresh_token else None

        # Upsert into Supabase using Service Role Key to bypass RLS
        # We have already validated the user via get_current_user
        db = get_service_db()
        if not db:
            raise HTTPException(status_code=500, detail="Database configuration error (Service Key missing)")

        data = {
            "user_id": user.id,
            "google_access_token": enc_access,
            "updated_at": "now()"
        }
        if enc_refresh:
            data["google_refresh_token"] = enc_refresh

        result = db.table("user_integrations").upsert(data).execute()

        return APIResponse(success=True, message="Google Calendar connected successfully", data=None)

    except httpx.HTTPStatusError as e:
        logger.error(f"Google Token Exchange Failed: {e.response.text}")
        return APIResponse(success=False, message=f"Failed to exchange token: {e.response.text}", data=None)
    except Exception as e:
        logger.error(f"Auth Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)

@router.get("/integrations", response_model=APIResponse)
async def get_integrations_status(user = Depends(get_current_user)):
    """
    Checks which integrations are active for the user.
    """
    try:
        db = get_service_db()
        result = db.table("user_integrations").select("*").eq("user_id", user.id).execute()
        
        status = {
            "google_calendar": False,
            "canvas": False
        }
        
        if result.data:
            row = result.data[0]
            # Check for tokens
            if row.get("google_access_token") and row.get("google_refresh_token"):
                status["google_calendar"] = True
            
            # For canvas, we check if access token exists (either manual or oauth in future)
            if row.get("canvas_access_token"):
                status["canvas"] = True
                
        return APIResponse(success=True, message="Integrations status fetched", data=status)
    except Exception as e:
        logger.error(f"Integrations Check Error: {e}")
        return APIResponse(success=False, message="Failed to check integrations", data=None)