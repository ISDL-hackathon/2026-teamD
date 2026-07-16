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
    
def update_user_gb(uid: int, additional_gb: int) -> dict | None:
    try:
        user_result = (
            supabase
            .table("users")
            .select("gb")
            .eq("uid", uid)
            .execute()
        )
        if not user_result.data:
            print(f"ユーザー(UID: {uid}) が見つかりません。")
            return None

        current_gb = user_result.data[0].get("gb") or 0

        new_gb = current_gb + additional_gb

        update_result = (
            supabase
            .table("users")
            .update({"gb": new_gb})
            .eq("uid", uid)
            .execute()
        )

        if update_result.data:
            print(f"ユーザー(UID: {uid}) のGBを更新しました: {current_gb} -> {new_gb}")
            return update_result.data[0]
        
        return None

    except Exception as e:
        print(f"GB更新処理エラー (uid: {uid}): {e}")
        return None