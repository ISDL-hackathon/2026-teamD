from app.cruds.staying import get_staying_flag, change_staying_flag_db
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/staying", tags=["staying"])

class StayingRequest(BaseModel):
    uid : int

#滞在フラグの変更
@router.post("/start")
def change_staying_flag(request_data: StayingRequest):
    uid = request_data.uid
    print(f"フロントから呼び出されました！ UID: {uid}")

    if get_staying_flag(uid) == False:
        change_staying_flag_db(uid)
    else:
        print(f"滞在しています．uid:", uid)
        return False
    return True

