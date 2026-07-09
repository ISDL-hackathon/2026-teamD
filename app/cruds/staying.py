from app import supabase

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
    
def change_staying_flag_db(uid):
    print("is_stayの真偽反転処理開始")
    try:
        response = supabase.table("users").select("is_stay").eq("uid", uid).single().execute()
        current_flag = response.data["is_stay"]
        supabase.table("users").update({"is_stay": not current_flag}).eq("uid", uid).execute()
        print(f"is_stayの反転成功")
        return not current_flag
    except Exception as e:
        print(f"is_stayの反転失敗: {e}")
        return False