from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.agent import chat_with_agent
from app.schemas.response import APIResponse

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat", response_model=APIResponse)
async def agent_chat(request: ChatRequest):
    """
    Endpoint to chat with the AI Agent.
    """
    try:
        # We assume the agent handles the logic and returns a string response
        response_text = chat_with_agent(request.message)
        # Return standard APIResponse with the text in 'data' or a specific field? 
        # APIResponse usually has 'data' as Any. Let's put the text in data using a dict if needed, or just the string.
        # But 'data' is generic. user might expect { response: str }
        return APIResponse(
            success=True, 
            message="Agent response received", 
            data={"response": response_text}
        )
    except Exception as e:
        print(f"Agent Error: {e}")
        return APIResponse(success=False, message=str(e), data=None)
