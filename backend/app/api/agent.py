from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services.agent import chat_with_agent
from app.schemas.response import APIResponse
from app.core.security import get_current_user
from typing import Optional, Any, List, Dict

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = []

@router.post("/chat", response_model=APIResponse)
async def agent_chat(request: ChatRequest, user = Depends(get_current_user)):
    """
    Endpoint to chat with the AI Agent.
    """
    try:
        # Pass the user_id and history to the agent service
        response_text = chat_with_agent(request.message, user_id=user.id, history=request.history)
        return APIResponse(
            success=True, 
            message="Agent response received", 
            data={"response": response_text}
        )
    except Exception as e:
        print(f"Agent Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)
