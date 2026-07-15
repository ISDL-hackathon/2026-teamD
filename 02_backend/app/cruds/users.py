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
    
def get_user_by_sid(sid: str) -> dict | None:
    """
    学籍番号(sid)をキーにして、usersテーブルからユーザー情報を取得する。
    """
    try:
        # 学籍番号が一致するレコードを検索
        result = (
            supabase
            .table("users")
            .select("uid, name, grade, sid, gb")  # 💡 必要なカラムを指定（すべてなら "*" に変更）
            .eq("sid", sid)
            .execute()
        )

        # 該当するユーザーが見つかった場合、その1件目のデータを返す
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        print(f"学籍番号(sid: {sid}) のユーザーは存在しません。")
        return None

    except Exception as e:
        print(f"ユーザー取得エラー (sid: {sid}): {e}")
        return None
    
def update_user_gb(uid: int, additional_gb: int) -> dict | None:
    """
    指定されたユーザー(uid)の所持GBに、指定した額(additional_gb)を加算する。
    """
    try:
        # 1. 現在の所持GB（gb）をデータベースから取得
        user_result = (
            supabase
            .table("users")
            .select("gb")
            .eq("uid", uid) # 💡 テーブルの主キーが 'id' の場合は "id" に変更してください
            .execute()
        )

        if not user_result.data:
            print(f"ユーザー(UID: {uid}) が見つかりません。")
            return None

        # 現在のGBを取得（デフォルト値として0を設定）
        current_gb = user_result.data[0].get("gb") or 0

        # 2. 新しい合計GBを計算
        new_gb = current_gb + additional_gb

        # 3. データベースを更新
        update_result = (
            supabase
            .table("users")
            .update({"gb": new_gb})
            .eq("uid", uid)
            .execute()
        )

        if update_result.data:
            print(f"ユーザー(UID: {uid}) のGBを更新しました: {current_gb} -> {new_gb}")
            return update_result.data[0]
        
        return None

    except Exception as e:
        print(f"GB更新処理エラー (uid: {uid}): {e}")
        return None