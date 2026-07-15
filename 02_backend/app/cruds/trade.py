from app import supabase

#tradeテーブルにmy_uid追加
def add_my_uid(my_uid):
    try:
        response = (
            supabase.table("trade")
            .insert({
                "my_uid": my_uid
            })
            .execute()
        )
        trade_id = response.data[0]["trade_id"]
        print(response.data[0]["my_uid"])
        return trade_id
    except Exception as e:
        print(f"my_uid登録失敗: {e}")
        return False

#tradeテーブルにtar_uid追加
def add_tar_uid(tar_uid, trade_id):
    try:
        response = (
            supabase.table("trade")
            .update({
                "tar_uid": tar_uid
            })
            .eq("trade_id", trade_id)
            .execute()
        )
        print(response.data)
        return response.data
    except Exception as e:
        print(f"tar_uid登録失敗: {e}")
        return False

def change_trade_flag(trade_id, is_trade):
    try:
        response = (
            supabase.table("trade")
            .update({"is_trade": is_trade})
            .eq("trade_id", trade_id)
            .execute()
        )
        return response.data

    except Exception as e:
        print(f"is_trade更新失敗: {e}")
        return False

def get_trade_id(uid):
    try:
        result = (
            supabase
            .table("trade")
            .select("trade_id")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", True)
            .execute()
        )

        print(result.data)

        if not result.data:
            return None

        return result.data[0]["trade_id"]

    except Exception as e:
        print(f"trade_id取得失敗: {e}")
        return None
    
def get_opponent_uid(uid):
    try:
        result = (
            supabase
            .table("trade")
            .select("my_uid, tar_uid")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", True)
            .execute()
        )

        if not result.data:
            return None

        trade = result.data[0]

        if trade["my_uid"] == uid:
            return trade["tar_uid"]
        else:
            return trade["my_uid"]

    except Exception as e:
        print(e)
        return None

def select_trade_characters(my_uid, tar_uid):
    """相手の所持キャラから、自分が持っていないキャラだけを抽出する"""
    try:
        # 相手のキャラ取得
        tar_result = (
            supabase
            .table("user_character")
            .select("""
                cid,
                characters(
                    cid,
                    img1,
                    name,
                    rare
                )
            """)
            .eq("uid", tar_uid)
            .execute()
        )

        # 自分のキャラ取得
        my_result = (
            supabase
            .table("user_character")
            .select("cid")
            .eq("uid", my_uid)
            .execute()
        )

        # 自分が持っているcid一覧
        my_cids = {char["cid"] for char in my_result.data} if my_result.data else set()

        characters = []

        # 相手のキャラから自分が持ってないものだけ追加
        if tar_result.data:
            for char in tar_result.data:
                # 結合先の characters 情報が正しく取得できているかチェック
                if char.get("cid") not in my_cids and char.get("characters") is not None:
                    characters.append(char["characters"])

        return characters

    except Exception as e:
        print(f"相手キャラ取得失敗: {e}")
        return None

def check_users_my_or_tar(uid):
    try:
        response = (
            supabase
            .table("trade")
            .select("my_uid, tar_uid")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}") 
            .eq("is_trade", True)                   
            .execute()
        )

        if not response.data:
            print("進行中のトレードが見つかりません")
            return None

        trade_data = response.data[0]


        if trade_data["my_uid"] == uid:
            # 自分が my なので、相手の tar_uid を返す
            return trade_data["my_uid"]
        else:
            # 自分が tar なので、相手の my_uid を返す
            return trade_data["tar_uid"]

    except Exception as e:
        print(f"ユーザー判定失敗: {e}")
        return None

def get_my_flag_tar_flag(uid):
    try:
        result = (
            supabase
            .table("trade")
            .select("my_flag, tar_flag")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", True)
            .execute()
        )

        if not result.data:
            return None

        trade = result.data[0]
        print(trade)
        return (
            trade["my_flag"],
            trade["tar_flag"]
        )

    except Exception as e:
        print(f"flag取得失敗:{e}")
        return None

def add_trade_character(uid, cid):
    try:
        # 交換相手取得
        tar_uid = get_opponent_uid(uid)

        if tar_uid is None:
            print("交換相手なし")
            return False


        # ★追加
        # 相手から交換可能なキャラか確認
        if not check_trade_character(tar_uid, uid, cid):
            print("交換できないキャラです")
            return False
        
        # 交換相手取得
        tar_uid = get_opponent_uid(uid)

        if tar_uid is None:
            print("交換相手なし")
            return False

        # 自分がmy_uid側かtar_uid側か確認
        result = (
            supabase
            .table("trade")
            .select("trade_id, my_uid, tar_uid")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", True)
            .execute()
        )

        if not result.data:
            return False

        trade = result.data[0]

        # 自分がmy_uid側ならmy_cidを更新
        if trade["my_uid"] == uid:
            response = (
                supabase
                .table("trade")
                .update({
                    "my_cid": cid,
                    "my_flag": True
                })
                .eq("trade_id", trade["trade_id"])
                .execute()
            )

        # 自分がtar_uid側ならtar_cidを更新
        else:
            response = (
                supabase
                .table("trade")
                .update({
                    "tar_cid": cid,
                    "tar_flag": True
                })
                .eq("trade_id", trade["trade_id"])
                .execute()
            )

        print(response.data)
        return True

    except Exception as e:
        print(f"キャラ登録失敗: {e}")
        return False
    

def execute_trade(trade_id):
    try:
        # trade取得
        result = (
            supabase
            .table("trade")
            .select("*")
            .eq("trade_id", trade_id)
            .execute()
        )

        if not result.data:
            return None

        trade = result.data[0]

        my_uid = trade["my_uid"]
        tar_uid = trade["tar_uid"]

        my_cid = trade["my_cid"]
        tar_cid = trade["tar_cid"]

        if not check_trade_character(my_uid, tar_uid, my_cid):
            print("不正な交換キャラ")
            return None

        if not check_trade_character(my_uid, tar_uid, tar_cid):
            print("不正な交換キャラ")
            return None
        
        # 削除
        remove_character(my_uid, my_cid)
        remove_character(tar_uid, tar_cid)
        print("削除完了")

        # 追加
        add_character(my_uid, tar_cid)
        add_character(tar_uid, my_cid)
        print("追加完了")


        # 交換終了
        (
            supabase
            .table("trade")
            .update({
                "is_trade": False
            })
            .eq("trade_id", trade_id)
            .execute()
        )


        # 自分が受け取ったキャラ情報を返す
        character = (
            supabase
            .table("characters")
            .select("""
                cid,
                img1,
                name,
                rare
            """)
            .eq("cid", tar_cid)
            .execute()
        )

        if character.data:
            return character.data[0]

        return None


    except Exception as e:
        print(f"交換処理失敗:{e}")
        return None


def remove_character(uid, cid):
    result = (
        supabase
        .table("user_character")
        .select("cnt")
        .eq("uid", uid)
        .eq("cid", cid)
        .execute()
    )

    if not result.data:
        return False

    cnt = result.data[0]["cnt"]

    if cnt <= 1:
        # 0枚なら削除
        supabase \
            .table("user_character") \
            .delete() \
            .eq("uid", uid) \
            .eq("cid", cid) \
            .execute()

    else:
        supabase \
            .table("user_character") \
            .update({
                "cnt": cnt - 1
            }) \
            .eq("uid", uid) \
            .eq("cid", cid) \
            .execute()

    return True

def add_character(uid, cid):

    result = (
        supabase
        .table("user_character")
        .select("cnt")
        .eq("uid", uid)
        .eq("cid", cid)
        .execute()
    )


    if result.data:
        # 既に持っている
        cnt = result.data[0]["cnt"]

        supabase \
            .table("user_character") \
            .update({
                "cnt": cnt + 1
            }) \
            .eq("uid", uid) \
            .eq("cid", cid) \
            .execute()

    else:
        # 新規所持
        supabase \
            .table("user_character") \
            .insert({
                "uid": uid,
                "cid": cid,
                "cnt": 1
            }) \
            .execute()

    return True

def check_trade_character(my_uid, tar_uid, cid):
    try:
        # 交換可能キャラ取得
        characters = select_trade_characters(my_uid, tar_uid)

        if characters is None:
            return False

        # 候補のcid一覧
        trade_cids = {
            char["cid"]
            for char in characters
        }

        # 候補内ならOK
        return cid in trade_cids

    except Exception as e:
        print(f"交換可能キャラ確認失敗:{e}")
        return False