from app import supabase
from app.cruds.conversation import get_num_is_staying, select_user
from app.gemini import create_question
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/staying", tags=["staying"])

class ConversationRequest(BaseModel):
    uid: int

#会話呼び出し
@router.post("/conversation")
def conversation_start(request_data: ConversationRequest):
    uid = request_data.uid
    data = init_conversation(uid)
    if data is None:
        return {"message": "あなたは1人だけです"}

    return create_question(data)


def init_conversation(uid):
    if get_num_is_staying() > 1:
        print("select users")
        data = select_user(uid)
        if not data:
            print("data none")
            return None
        print(data)
        return data["prefix"]
    else:
        print("あなたは1人だけです")
        return None