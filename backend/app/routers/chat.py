from fastapi import APIRouter
# こちらも直接 services から始める
from services.gemini import test_gemini_response

router = APIRouter()

@router.get("/api/chat")
def chat_test(message: str = "こんにちは"):
    reply = test_gemini_response(message)
    return {"status": "success", "reply": reply}