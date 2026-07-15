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
            })
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"プロフィール登録失敗: {e}")
        return False
    
create_user_profile()
get_user()
update_user()