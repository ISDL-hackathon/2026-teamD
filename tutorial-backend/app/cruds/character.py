from app import supabase

#本番ではハッシュ化


#キャラクターが排出
def get_character_by_id(uid, cid):
    print("キャラクター排出実装")
    try:
        response = supabase.table("characters").select("*").eq("id", cid).single().execute()
        print("キャラクター取得成功")

        #キャラ被り
        if check_character_ownership(uid, cid):
            print("キャラクター被り")
            return False
        else:
            add_character_to_user(uid, cid)
        return response.data
    
    except Exception as e:
        print(f"キャラクター取得失敗: {e}")
        return False

#ユーザにキャラクターを追加
def add_character_to_user(uid, cid):
    print("キャラクター追加実装")
    try:
        #所持キャラ追加
        response = supabase.table("user_character").insert({
            "uid": uid,
            "cid": cid
        }).execute()
        
        print("キャラクター追加成功") 
        return response.data
    
    except Exception as e:
        print(f"キャラクター追加失敗: {e}")
        return False

#キャラ被り
def check_character_ownership(uid, cid):
    print("キャラ被り実装中")
    res = supabase.table("user_character").select("id").eq("uid", uid).eq("cid", cid).execute()
    return len(res.data) > 0  # 1件以上あればTrue（被り）

#キャラ削除
def remove_character_from_user(uid, cid):
    print("キャラクター削除未実装")

#ガチャ確率アルゴリズム
def get_character_rate():
    import random
    print("ガチャ確率アルゴリズム実装")
    try:
        rate = supabase.table("characters").select("id", "rate").execute()
        char_list=rate.data
        if not char_list:
            print("エラー: キャラクターデータがDBにありません。")
            return False
        
        char_ids = [char["id"] for char in char_list]
        rates = [char["rate"] for char in char_list]

        chosen_id = random.choices(char_ids, weights=rates, k=1)[0]
        print(f"ガチャ確率アルゴリズム成功: ガチャ当選キャラID: {chosen_id}")
        return chosen_id
    
    except Exception as e:
        print(f"ガチャ排出失敗: {e}")
        return False