from app import supabase

# tradeテーブルにmy_uid追加
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

# tradeテーブルにtar_uid追加
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

def change_trade_flag(trade_id, is_allowed):
    try:
        # ⭕️ 案A採用：許可(True)なら取引継続(is_trade=False)
        # 拒否(False)なら取引終了/キャンセル(is_trade=True)
        is_trade_value = not is_allowed

        response = (
            supabase.table("trade")
            .update({"is_trade": is_trade_value})
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
            .eq("is_trade", False)
            .execute()
        )

        print(result.data)

        if not result.data:
            return None

        return result.data[0]["trade_id"]

    except Exception as e:
        print(f"trade_id取得失敗: {e}")
        return None
    
def get_is_add_gb(trade_id):
    try:
        result = (
            supabase
            .table("trade")
            .select("is_add_gb")
            .eq("trade_id", trade_id)
            .execute()
        )

        print(f"is_add_gb:", result.data)

        if not result.data:
            return None

        return result.data[0]["is_add_gb"]

    except Exception as e:
        print(f"trade_id取得失敗: {e}")
        return None

def get_trade_info(trade_id):
    try:
        result = (
            supabase
            .table("trade")
            .select("""
                my_uid,
                tar_uid,
                my_user:users!trade_my_uid_fkey(
                    grade
                ),
                tar_user:users!table_tar_uid_fkey(
                    grade
                )
            """)
            .eq("trade_id", trade_id)
            .execute()
        )
        print(result.data)
        return result.data
    except Exception as e:
        print(f"gradeの取得失敗: {e}")
        return None
    
def get_opponent_uid(uid):
    try:
        result = (
            supabase
            .table("trade")
            .select("my_uid, tar_uid")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", False)
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
                if char.get("cid") not in my_cids and char.get("characters") is not None:
                    characters.append(char["characters"])

        if characters:
            return characters
        else:
            print("相手が所持していてあなたが所持していないキャラがいません")

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
            return trade_data["my_uid"]
        else:
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
        tar_uid = get_opponent_uid(uid)

        if tar_uid is None:
            print("交換相手なし")
            return False

        if not check_trade_character(uid, tar_uid, cid):
            print("交換できないキャラです")
            return False
        
        tar_uid = get_opponent_uid(uid)

        if tar_uid is None:
            print("交換相手なし")
            return False

        result = (
            supabase
            .table("trade")
            .select("trade_id, my_uid, tar_uid")
            .or_(f"my_uid.eq.{uid},tar_uid.eq.{uid}")
            .eq("is_trade", False)
            .execute()
        )

        if not result.data:
            return False

        trade = result.data[0]

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
    

def execute_trade(trade_id, uid):
    try:
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

        my_cid = trade["my_cid"]   # 自分が欲しいキャラ (疋田さん: 2)
        tar_cid = trade["tar_cid"] # 相手が欲しいキャラ (河村くん: 12)

        # ⭕️ 変数のあべこべを修正：自分と相手で消費・獲得するキャラを正しく入れ替え
        if my_uid == uid:
            if trade["my_flag"]:
                remove_character(my_uid, tar_cid)  # 相手にあげるキャラ(河村くん:12)を自分の手持ちから削除
                print("削除完了")
                add_character(my_uid, my_cid)     # 相手から貰うキャラ(疋田さん:2)を自分の手持ちに追加
                print("追加完了")
        else:
            if trade["tar_flag"]:
                remove_character(tar_uid, my_cid)  # 自分にあげるキャラ(疋田さん:2)を相手の手持ちから削除
                print("削除完了")
                add_character(tar_uid, tar_cid)    # 自分から貰うキャラ(河村くん:12)を相手の手持ちに追加
                print("追加完了")

        # 自分の交換完了フラグをOFF
        if uid == my_uid:
            supabase \
                .table("trade") \
                .update({
                    "my_flag": False
                }) \
                .eq("trade_id", trade_id) \
                .execute()

        elif uid == tar_uid:
            supabase \
                .table("trade") \
                .update({
                    "tar_flag": False
                }) \
                .eq("trade_id", trade_id) \
                .execute()

        # 最新状態取得
        flag_result = (
            supabase
            .table("trade")
            .select("my_flag, tar_flag")
            .eq("trade_id", trade_id)
            .execute()
        )

        flags = flag_result.data[0]

        # 両方完了なら交換終了
        if (
            flags["my_flag"] == False
            and flags["tar_flag"] == False
        ):
            supabase \
                .table("trade") \
                .update({
                    "is_add_gb": True
                }) \
                .eq("trade_id", trade_id) \
                .execute()

        # ⭕️ 修正：自分が最終的に受け取った（画面に表示する）キャラIDに修正
        received_cid = my_cid if uid == my_uid else tar_cid

        character = (
            supabase
            .table("characters")
            .select("""
                cid,
                img1,
                name,
                rare
            """)
            .eq("cid", received_cid)
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
        characters = select_trade_characters(my_uid, tar_uid)

        if characters is None:
            return False

        trade_cids = {
            char["cid"]
            for char in characters
        }

        return cid in trade_cids

    except Exception as e:
        print(f"交換可能キャラ確認失敗:{e}")
        return False
    
def finish_trade(trade_id):
    try:
        # ⭕️ 案A採用：GB付与フェーズが終了したタイミングで is_trade も True に更新し、取引を完了（閉鎖）とする
        response = (
            supabase.table("trade")
            .update({
                "is_add_gb": False,
                "is_trade": True
            })
            .eq("trade_id", trade_id)
            .eq("is_add_gb", True)
            .execute()
        )

        return response.data

    except Exception as e:
        print(f"is_add_gbおよびis_trade更新失敗: {e}")
        return False