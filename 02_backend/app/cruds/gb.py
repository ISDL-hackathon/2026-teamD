from app import supabase

#GB増減処理
def update_gb(uid, gb):
    print(f"uid: {uid}, gb: {gb}")
    print("GB増減実装中")
    try:
        #GB増減
        now_gb = get_user_gb(uid)
        new_gb = now_gb + gb
        if new_gb < 0:
            print("GBが0未満になるため、処理を中止します。")
            return False
        
        print(f"new_gb:", new_gb)
        response = supabase.table("users").update({"gb": new_gb}).eq("uid", uid).execute()
        print("GB増減成功")
        return response.data
    except Exception as e:
        print(f"GB増減失敗: {e}")
        return False

#交換によるgb付与
def add_gb(my_id, my_grade, tar_id, tar_grade, flag):
    try:
        if flag == 1:
            gb = calc_conversation_gb(my_grade, tar_grade)
        elif flag == 2:
            gb = calc_exchange_gb(my_grade, tar_grade)

        update_gb(my_id, gb)
        update_gb(tar_id, gb)
        return gb
    except Exception as e:
        print(f"交換によるGB付与失敗: {e}")
        return False


#現在のユーザのgb所得
def get_user_gb(uid):
    try:
        now_gb = supabase.table("users").select("gb").eq("uid", uid).execute()
        now_gb = now_gb.data[0]["gb"]
        print(now_gb)
        return now_gb
    except Exception as e:
        print(f"現在のgb所得失敗: {e}")
        return False    

def calc_exchange_gb(my_grade, tar_grade):
    if my_grade == tar_grade:
        return 32
    else:
        return 16

def calc_exchange_gb(my_grade, tar_grade):
    if my_grade == tar_grade:
        return 64
    else:
        return 128