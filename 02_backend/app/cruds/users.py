from app import supabase

def create_user_profile(auth_id, name, grade):
    try:
        response = (
            supabase
            .table("users")
            .insert({
                "auth_id": auth_id,
                "name": name,
                "grade": grade
                "subject_uid": subject_uid, # 👈 追加！
                "gb": 0,
                "is_stay": False
            })
            .execute()
        )

        return response.data

    except Exception as e:
        # 🕵️‍♂️ 何のエラーで落ちたかをコンソールに赤裸々に表示させる
        print(f"❌ [DB ERROR] プロフィール登録に失敗しました: {e}")
        raise e # 呼び出し元（auth.py）にエラーをそのまま投げる

# 2. 【超重要】フロントの名前入力画面から叩く「更新用」の関数
def update_user_profile(uid: int, name: str, grade: str):
    try:
        response = (
            supabase
            .table("users")
            .update({
                "name": name,
                "grade": grade
            })
            .eq("uid", uid)
            .execute()
        )
        return response.data
    except Exception as e:
        print(f"❌ [DB ERROR] プロフィール更新に失敗しました: {e}")
        return False


    
#create_user_profile()
#get_user()
#update_user()