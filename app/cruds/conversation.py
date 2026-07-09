from app import supabase
import random

def get_num_is_staying():
    print("is_stayがTrueの人数カウント処理")
    try:
        response = supabase.table("users").select("is_stay").eq("is_stay", True).execute()
        print(f"Trueの数:", len(response.data))
        return len(response.data)
    except Exception as e:
        print(f"人数カウント処理失敗: {e}")
        return False    
    

def select_user(uid):
    try:
        print("is_trueの中から一人選択")
        response = (
            supabase.table("users")
            .select("uid, name, grade, rare, prefix")
            .eq("is_stay", True)
            .execute()
        )
        users = [u for u in response.data if u["uid"] != uid]
        return random.choice(users)
    except Exception as e:
        print(f"一人選択失敗: {e}")
        return False