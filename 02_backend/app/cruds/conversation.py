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
    # 自分以外で滞在中のユーザー取得
    response = (
        supabase
        .table("users")
        .select("""
            uid,
            subject_uid,
            grade,
            characters(
                cid,
                name,
                grade,
                prefix
            )
        """)
        .eq("is_stay", True)
        .neq("uid", uid)
        .execute()
    )

    users = response.data
    if not users:
        return False

    # prefixを持つキャラを所持しているユーザーだけ抽出
    prefix_users = []
    for user in users:
        character = user["characters"]
        if character is None:
            continue
        if character["prefix"] is not None:
            prefix_users.append(user)

    print("\n===== prefix持ちユーザー =====")
    for user in prefix_users:
        char = user["characters"]

        print(
            f"uid: {user['uid']} | "
            f"character: {char['prefix']}{char['name']} "
            f"(cid:{char['cid']})"
        )
    if not prefix_users:
        return False

    # prefix持ちユーザーから会話相手選択
    tar_user = random.choice(prefix_users)

    print("\n===== 選択された会話相手 =====")
    print(
        f"uid: {tar_user['uid']}\n"
        f"subject_uid: {tar_user['subject_uid']}\n"
        f"grade: {tar_user['grade']}"
    )

    # 会話保存
    save_conversation(uid, tar_user)

    # 使用するキャラクター
    selected_character = tar_user["characters"]
    print("\n===== 使用キャラクター =====")
    print(
        f"cid: {selected_character['cid']}\n"
        f"name: {selected_character['name']}\n"
        f"grade: {selected_character['grade']}\n"
        f"prefix: {selected_character['prefix']}"
    )
    return selected_character

def get_prefix_users(uid):
    response = (
        supabase
        .table("users")
        .select("""
            uid,
            subject_uid,
            grade,
            characters(
                cid,
                name,
                grade,
                prefix
            )
        """)
        .eq("is_stay", True)
        .neq("uid", uid)
        .execute()
    )

    prefix_users = []

    for user in response.data:
        character = user["characters"]

        if character is None:
            continue

        if character["prefix"] is not None:
            prefix_users.append(user)

    return prefix_users

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