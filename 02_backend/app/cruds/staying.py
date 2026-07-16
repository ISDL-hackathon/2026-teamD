from app import supabase

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
        response = (
            supabase.table("users")
            .update({
                "stay_start_time": start_time.isoformat()
            })
            .eq("uid", uid)
            .execute()
        )
    except Exception as e:
        print(f"スタート時間の記録失敗: {e}")
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