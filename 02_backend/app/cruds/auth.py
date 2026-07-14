from app import supabase_old

#サインアップしたユーザをDBに登録する
def sign_up_user_to_db(name, grade, sid, pword):
    print("ユーザー登録実装中")
    try:
        #ユーザ登録
        response = supabase_old.table("users").insert({
            "name": name,
            "grade": grade,
            "sid": sid,
            "pword": pword
        }).execute()
        
        print("ユーザー登録成功") 
        return response.data
    except Exception as e:
        print(f"ユーザー登録失敗: {e}")
        return False

def sign_in_user_to_db(sid, pword):
    print("ユーザーログイン実装中")
    try:
        response = supabase_old.table("users").select("*").eq("sid", sid).eq("pword", pword).execute()
        print("ユーザーログイン成功")
        return response.data
    except Exception as e:
        print(f"ユーザーログイン失敗: {e}")
        return False

def sign_out_user_to_db(sid, pword):
    print("ユーザーログアウト")
    print("未実装")