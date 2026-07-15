from fastapi import Depends
from app.cruds.auth import get_current_user
from fastapi import APIRouter
from pydantic import BaseModel

from datetime import datetime, timezone
from app.cruds.staying import  change_staying_flag_db, save_start_time, end_staying_time
from app.cruds.get_users_table import  get_start_time, get_staying_flag
from app.cruds.gb import update_gb


router = APIRouter(prefix="/staying", tags=["staying"])


#滞在フラグの変更
@router.post("/start")
def change_staying_flag(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    print(f"フロントから呼び出されました！ UID: {uid}")

    if get_staying_flag(uid) == False:
        change_staying_flag_db(uid, True)
        save_start_time(uid, datetime.now(timezone.utc))

    else:
        print(f"滞在しています．uid:", uid)
        return False
    return True

@router.post("/end")
def end_staying(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    end_time = datetime.now(timezone.utc)
    start_time = get_start_time(uid)

    if start_time is None:
        return {
            "status":"error",
            "message":"開始時間がありません"
        }
    
    stay_time = int((end_time - start_time).total_seconds())
    hours = stay_time // 3600
    minutes = (stay_time % 3600) // 60
    seconds = stay_time % 60
    print(f"{hours}時間 {minutes}分 {seconds}秒")
    
    get_gb = int (stay_time / 60)    
    update_gb(uid, get_gb)

    change_staying_flag_db(uid, False)
    end_staying_time(uid)
    return {"{hours}時間 {minutes}分 {seconds}秒", get_gb}