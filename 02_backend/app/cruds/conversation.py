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
        .select("uid, sid, grade")
        .eq("is_stay", True)
        .execute()
    )
    
    print(f"true users",response.data)
    users = [u for u in response.data if u["uid"] != uid]
    print(f"users",users)
    if not users:
        return False

    #会話相手
    tar_user = random.choice(users)
    print("conversation user :", tar_user)
    save_conversation(uid, tar_user)

    #自分の所持キャラ
    response = (
        supabase.table("user_character")
        .select("characters(id, sid, name, grade, prefix)")
        .eq("uid", uid)
        .execute()
    )

    characters = []

    for row in response.data:
        character = row["characters"]
        if character is None:
            continue
        characters.append(character)


    if not characters:
        return False


    # prefix持ちだけ抽出
    prefix_characters = [
        character
        for character in characters
        if character["prefix"] is not None
    ]


    if prefix_characters:
        selected_character = random.choice(prefix_characters)
    else:
        selected_character = random.choice(characters)


    print("selected character:", selected_character)

    return selected_character

#会話内容DB保存
def save_conversation(uid, tar_id):
    try:
        # 自分の情報取得
        my_data = (
            supabase.table("users")
            .select("grade")
            .eq("uid", uid)
            .execute()
        )

        if not my_data.data:
            print("自分のユーザー情報がありません")
            return False

        my_grade = my_data.data[0]["grade"]

        # conversationsへ保存
        response = (
            supabase.table("conversations")
            .insert({
                "my_id": uid,
                "my_grade": my_grade,
                "tar_id": tar_id["uid"],
                "tar_grade": tar_id["grade"],
                "is_con": True
            })
            .execute()
        )

        print("conversation saved:", response.data)
        return True

    except Exception as e:
        print(f"会話保存失敗: {e}")
        return False

def get_grade(uid):
    grade = supabase.table("users").select("grade").eq("uid", uid).execute()
    if grade:
        return grade
    return None

#会話した相手のid
def get_tar_id(my_id):
    try:
        tar_info = (
            supabase.table("conversations")
            .select("tar_id, tar_grade")
            .eq("my_id", my_id)
            .eq("is_con", True)
            .execute()
        )
        return tar_info.data[0]
    except Exception as e:
        print(f"tar_id 失敗: {e}")
        return False   

#会話終了  
def finish_conversation(my_id, tar_id):
    try:
        response = (
            supabase.table("conversations")
            .update({
                "is_con": False
            })
            .select("is_con")
            .eq("my_id", my_id)
            .eq("tar_id", tar_id)
            .execute()
        )

        print("会話終了")
        return response.data

    except Exception as e:
        print(f"会話終了失敗: {e}")
        return False