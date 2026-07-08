from app import supabase

#GB増減処理
def update_gb(uid, gb):
    print(f"uid: {uid}, gb: {gb}")
    print("GB増減実装中")
    try:
        #GB増減
        now_gb = (supabase.table("users").select("gb").eq("uid", uid).execute().data[0]["gb"])
        print(f"現在のGB: {now_gb}")
        new_gb = now_gb + gb
        if new_gb < 0:
            print("GBが0未満になるため、処理を中止します。")
            return False
        
        response = supabase.table("users").update({"gb": new_gb}).eq("uid", uid).execute()
        print("GB増減成功")
        return response.data
    except Exception as e:
        print(f"GB増減失敗: {e}")
        return False
