from fastapi import APIRouter
from pydantic import BaseModel

from datetime import datetime, timezone
from app.cruds.staying import  change_staying_flag_db, save_start_time, end_staying_time
from app.cruds.users import  get_start_time, get_staying_flag
from app.cruds.gb import update_gb


router = APIRouter(prefix="/staying", tags=["staying"])

class StayingRequest(BaseModel):
    uid : int

class EndingRequest(BaseModel):
    uid: int

#滞在フラグの変更
@router.post("/start")
def change_staying_flag(request_data: StayingRequest):
    uid = request_data.uid
    print(f"フロントから呼び出されました！ UID: {uid}")

    if get_staying_flag(uid) == False:
        change_staying_flag_db(uid, True)
        # 開始時刻を保存
        save_start_time(uid, datetime.now(timezone.utc))

    else:
        print(f"滞在しています．uid:", uid)
        return False
    return True

@router.post("/end")
def end_staying(request_data: EndingRequest):
    uid = request_data.uid
    end_time = datetime.now(timezone.utc)
    start_time = get_start_time(uid)

    stay_time = int((end_time - start_time).total_seconds())
    hours = stay_time // 3600
    minutes = (stay_time % 3600) // 60
    seconds = stay_time % 60

    print(f"{hours}時間 {minutes}分 {seconds}秒")
    
    get_gb = int (stay_time / 60)
    print(stay_time)

    #出力用
    # now_gb = update_gb(uid, get_gb)
    # now_gb = get_gb[0]["gb"]

    change_staying_flag_db(uid, False)
    end_staying_time(uid)
    return "{hours}時間 {minutes}分 {seconds}秒", get_gb