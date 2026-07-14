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
        print(response.data)
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
    
#相手の所持キャラ，trade -> users -> user_characters


def get_trade_user(uid):
    try:
        result = (
            supabase
            .table("trade")
            .select("tar_uid")
            .eq("my_uid", uid)
            .eq("is_trade", True)
            .execute()
        )

        if not result.data:
            return None

        return result.data[0]["tar_uid"]

    except Exception as e:
        print(f"交換相手取得失敗: {e}")
        return None

def get_trade_characters(uid):

    try:
        result = (
            supabase
            .table("user_character")
            .select(
                """
                characters(
                    cid,
                    img1,
                    name,
                    rare
                )
                """
            )
            .eq("uid", uid)
            .execute()
        )


        characters = []

        for char in result.data:
            characters.append(
                char["characters"]
            )


        return characters


    except Exception as e:
        print(f"相手キャラ取得失敗: {e}")
        return None