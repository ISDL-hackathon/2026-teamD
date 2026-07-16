from fastapi import Depends, APIRouter, HTTPException
from app.cruds.auth import get_current_user
from datetime import datetime, timezone
from app.cruds.staying import change_staying_flag_db, save_start_time, end_staying_time
from app.cruds.get_users_table import get_start_time, get_staying_flag
from app.cruds.gb import update_gb

router = APIRouter(prefix="/staying", tags=["staying"])

# --- 1. 滞在開始（入室） ---
@router.post("/start")
def change_staying_flag(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    print(f"フロントから呼び出されました！ UID: {uid}")

    # get_staying_flag が None や False を返す可能性を考慮して「if not」で判定
    if not get_staying_flag(uid):
        change_staying_flag_db(uid, True)
        save_start_time(uid, datetime.now(timezone.utc))
        return {"status": "success", "message": "滞在を開始しました"}
    else:
        print(f"すでに滞在しています。UID: {uid}")
        # すでに滞在している場合は 400 Bad Request などを返しておくと親切です
        raise HTTPException(status_code=400, detail="すでに滞在しています")

# --- 2. 滞在終了（退室） ---
@router.post("/end")
def end_staying(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    end_time = datetime.now(timezone.utc)
    start_time = get_start_time(uid)

    if not start_time or isinstance(start_time, bool):
        print("⚠️ 滞在開始時間が設定されていない、または不正です。処理をスキップします。")
        # 必要に応じて、ここで例外を投げるか、正常終了としてダミーを返す
        return {"status": "ok", "message": "滞在時間が存在しないため、時間は計算されませんでした"}
    
    # 💡 タイムゾーンの不一致エラー（TypeError）を防ぐ安全処理
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    
    # 時間計算
    stay_time_seconds = int((end_time - start_time).total_seconds())
    hours = stay_time_seconds // 3600
    minutes = (stay_time_seconds % 3600) // 60
    seconds = stay_time_seconds % 60
    
    time_str = f"{hours}時間 {minutes}分 {seconds}秒"
    print(f"滞在時間: {time_str}")
    
    # GB計算（1分 = 1GB の場合。もし1分 = 2GB ならここを * 2 にしてください）
    get_gb = int(stay_time_seconds / 60)    
    
    # 獲得GBが 1 以上の場合のみDBを更新する（無駄な更新を防ぐ）
    if get_gb > 0:
        update_gb(uid, get_gb)

    # 滞在フラグをオフにする
    change_staying_flag_db(uid, False)
    end_staying_time(uid)
    
    # ⭕️ 辞書型（JSON）で綺麗に結果を返却します
    return {
        "status": "success",
        "time": time_str,
        "gb": get_gb
    }