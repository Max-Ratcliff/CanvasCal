from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.db import get_db
from supabase import Client

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validates the Bearer token against Supabase Auth and returns the user object.
    """
    token = credentials.credentials
    db = get_db()
    
    try:
        # db is the Supabase Client initialized with the ANON key.
        # auth.get_user(token) verifies the JWT and returns the user data.
        user_response = db.auth.get_user(token)
        
        if not user_response or not user_response.user:
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user
        
    except Exception as e:
        # Broad exception handling because Supabase client might raise different errors
        # for invalid tokens, network issues, etc.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
