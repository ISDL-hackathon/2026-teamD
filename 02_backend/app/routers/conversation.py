from fastapi import Depends
from app.cruds.auth import get_current_user

from fastapi import APIRouter
from pydantic import BaseModel


from app.cruds.conversation import get_num_is_staying, select_user, get_tar_id, finish_conversation
from app.cruds.get_users_table import get_grade
from app.gemini import create_question
from app.cruds.gb import add_gb


router = APIRouter(prefix="/staying", tags=["staying"])

#会話呼び出し
@router.post("/conversation")
def conversation_start(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    data = init_conversation(uid)
    if data is None:
        return {"message": "あなたは1人だけです"}
    question=create_question(data)
    print(question)
    return question

#質問の答え入力
@router.post("/input")
def input_answer(current_user=Depends(get_current_user)):
    my_id=current_user["uid"]
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
        char_data = select_user(uid)
        if not char_data:
            print("data none")
            return None
        print(f"prefix_name : {char_data['prefix']}{char_data['name']}")
        return char_data["prefix"]
    else:
        print("あなたは1人だけです")
        return None