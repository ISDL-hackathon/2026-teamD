from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.conversation import get_num_is_staying, select_user, get_tar_id, finish_conversation
from app.cruds.users import get_grade
from app.gemini import create_question
from app.cruds.gb import add_gb


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
    question=create_question(data)
    print(question)
    return question

#質問の答え入力
@router.post("/input")
def input_answer(request_data: ConversationRequest):
    my_id=request_data.uid
    my_grade = get_grade(my_id)
    tar_info=get_tar_id(my_id)

    tar_id = tar_info["tar_id"]
    tar_grade = tar_info["tar_grade"]

    print(tar_id, tar_grade)
    add_gb(my_id, my_grade, tar_id, tar_grade, 1)
    print("GB付与完了")
    check = finish_conversation(my_id, tar_id)
    print(f"is_con :", check)
    return True

    


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