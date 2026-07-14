from app import supabase
from datetime import datetime

#dbからuidの滞在フラグ
def get_staying_flag(uid):
    print("is_stayのフラグ獲得処理")
    try:
        response = supabase.table("users").select("is_stay").eq("uid", uid).single().execute()
        is_stay = response.data["is_stay"]
        print("is_stay:", is_stay)
        return is_stay

    except Exception as e:
        print(f"is_stayのエラー: {e}")
        return False
    
def change_staying_flag_db(uid: int, is_stay: bool):
    print("is_stay更新開始")

    try:
        supabase.table("users").update({
            "is_stay": is_stay
        }).eq("uid", uid).execute()

        print("is_stay更新成功")
        return True

    except Exception as e:
        print(f"is_stay更新失敗: {e}")
        return False

def save_start_time(uid, start_time):
    try:
        supabase.table("users").update({
            "stay_start_time": start_time.isoformat()
            }).eq("uid", uid).execute()
    except Exception as e:
        print(f"スタート時間の記録失敗: {e}")
        return False
    
def get_start_time(uid):
    try:
        response = supabase.table("users").select("stay_start_time").eq("uid", uid).single().execute()
        start_time = datetime.fromisoformat(
            response.data["stay_start_time"]
        )
        print(f"start time :", start_time)
        return start_time
    except Exception as e:
        print(f"スタート時間の取り出し失敗: {e}")
        return False
    
def end_staying_time(uid):
    print("stay_start_timeをNULLにします")

    try:
        response = (
            supabase.table("users")
            .update({"stay_start_time": None})
            .eq("uid", uid)
            .execute()
        )

        print("stay_start_timeリセット成功")
        return response.data

    except Exception as e:
        print(f"stay_start_timeリセット失敗: {e}")
        return False