from app import supabase

#キャラクターが排出
def get_character_by_id(uid, cid):
    print("キャラクター排出実装")
    try:
        response = supabase.table("characters").select("*").eq("cid", cid).single().execute()
        print("キャラクター取得成功")       

        add_character_to_user(uid, cid)
        return response.data
    
    except Exception as e:
        print(f"キャラクター取得失敗: {e}")
        return False

#ユーザにキャラクターを追加
def add_character_to_user(uid, cid):
    print("キャラクター追加実装")
    try:
        # 所持確認
        check = (
            supabase
            .table("user_character")
            .select("id, cnt")
            .eq("uid", uid)
            .eq("cid", cid)
            .execute()
        )

        # すでに所持している場合
        if check.data:
            current_cnt = check.data[0]["cnt"]
            response = (
                supabase
                .table("user_character")
                .update({
                    "cnt": current_cnt + 1
                })
                .eq("id", check.data[0]["id"])
                .execute()
            )

            print("キャラクター重複：count増加")
            return response.data

        # 初取得の場合
        else:
            response = (
                supabase
                .table("user_character")
                .insert({
                    "uid": uid,
                    "cid": cid,
                    "cnt": 1
                })
                .execute()
            )

            print("新規キャラクター追加成功")
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
def get_character_rate(cnt):
    import random
    print("ガチャ確率アルゴリズム実装")
    try:
        rate = supabase.table("characters").select("cid", "rate").execute()
        char_list=rate.data
        if not char_list:
            print("エラー: キャラクターデータがDBにありません。")
            return False
        
        char_ids = [char["cid"] for char in char_list]
        rates = [char["rate"] for char in char_list]

        chosen_id = random.choices(char_ids, weights=rates, k=cnt)
        print(f"ガチャ確率アルゴリズム成功: ガチャ当選キャラID: {chosen_id}")
        return chosen_id
    
    except Exception as e:
        print(f"ガチャ排出失敗: {e}")
        return False
    
#デモ用
def demo_get_character(cnt):
    import random
    print("デモ版ガチャ確率アルゴリズム実装")
    chosen_id  = []
    try:
        chosen_id = (
        supabase.table("characters")
        .select("cid")

        .in_("cid", list(range(1, 8)))
        .execute()
        )
        print(f"ガチャ確率アルゴリズム成功: ガチャ当選キャラID: {chosen_id}")
        chosen_id = chosen_id.data
        random.shuffle(chosen_id)
        return chosen_id.data
    except Exception as e:
        print(f"ガチャ排出失敗: {e}")
        return False


def get_owned_character_db(uid):
    try:
        response = (
            supabase
            .table("user_character")
            .select("""
                cid,
                cnt,
                characters!user_character_cid_fkey(
                    cid,
                    name,
                    grade,
                    img1,
                    rare
                )
            """)
            .eq("uid", uid)
            .execute()
        )


        print(response.data)

        for character in response.data:
            print(character["characters"]["name"])
            print(character["characters"]["grade"])
            print(character["characters"]["img1"])

        return response.data

    except Exception as e:
        print(f"所持キャラクター取得失敗: {e}")
        return False
    
#uidからキャラクターデータを返す
def get_character_profile_db(uid, cid):
    try:
        response = (
            supabase
            .table("user_character")
            .select("""
                cid,
                characters (
                    name,
                    grade,
                    quote,
                    rare,
                    town,
                    hobby,
                    role,
                    lab,
                    birth,
                    img1
                )
             """)
            .eq("uid", uid)
            .eq("cid", cid)
            .execute()
        )
        print(response.data)
        return response.data
    except Exception as e:
        print(f"所持キャラクター取得失敗: {e}")
        return False

def update_home_character(uid, cid):
    try:
        # 所持確認
        if not has_character(uid, cid):
            return False

        response = (
            supabase
            .table("home_character")
            .upsert({
                "uid": uid,
                "cid": cid
            })
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"ホームキャラ更新失敗: {e}")
        return False

def has_character(uid, cid):
    try:
        result = (
            supabase
            .table("user_character")
            .select("cid")
            .eq("uid", uid)
            .eq("cid", cid)
            .execute()
        )

        return len(result.data) > 0

    except Exception as e:
        print(f"所持確認失敗: {e}")
        return False
    
def get_character_info(cid):
    try:
        result = (
            supabase
            .table("characters")
            .select("name, img1")
            .eq("cid", cid)
            .single()
            .execute()
        )

        return result.data

    except Exception as e:
        print(f"キャラ名取得失敗: {e}")
        return None