from app import supabase
from datetime import datetime


def get_name(uid):
    name = supabase.table("users").select("name").eq("uid", uid).execute()
    if name:
        return name.data[0]["name"]
    return None


def get_grade(uid):
    print("users.get_grade が呼ばれた")
    grade = supabase.table("users").select("grade").eq("uid", uid).execute()
    print(grade.data)
    if grade:
        
        return grade.data[0]["grade"]
    return None

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