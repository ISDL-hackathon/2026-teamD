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
    # is_stay=True のユーザー取得（自分以外）
    response = (
        supabase.table("users")
        .select("uid")
        .eq("is_stay", True)
        .execute()
    )

    users = [u for u in response.data if u["uid"] != uid]
    print(f"users",users)
    if not users:
        return False
    
    users = get_serect_priority(users)
    one_user = random.choice(users)

    # そのユーザーの所持キャラ取得
    response = (
        supabase.table("user_character")
        .select("characters(name, grade, prefix)")
        .eq("uid", one_user["uid"])
        .execute()
    )
    print(f"select a user", response.data)
    return response.data
    
    
#prefixもち優先
def get_serect_priority(response):
    print("prefixのみ")
    if response.data["prefix"]:
        pre_char = (
            supabase.table("characters")
            .select("uid, name, grade, prefix)")
            .not_.is_("prefix", "null")
            .execute()
        )
        print(f"character", pre_char)
        return pre_char.data
    else:
        return response.data

#prefixもち関係なく
def get_serect_random(response):
    characters = [
        row["characters"]
        for row in response.data
        if row["characters"] is not None
    ]
    if not characters:
        return False
    return random.choice(characters)