from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import supabase, supabase_auth


# Authorization ヘッダーがない場合も、こちらで統一した401を返す。
bearer_scheme = HTTPBearer(auto_error=False)


# 🌟 学年の日本語表記をフロント用の英数字コードに自動変換するマッピング
GRADE_MAP = {
    "学部1年": "U1", "B1": "U1", "U1": "U1",
    "学部2年": "U2", "B2": "U2", "U2": "U2",
    "学部3年": "U3", "B3": "U3", "U3": "U3",
    "学部4年": "U4", "B4": "U4", "U4": "U4",
    "修士1年": "M1", "M1": "M1",
    "修士2年": "M2", "M2": "M2"
}

def sanitize_user_data(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """フロントに返す前に、学年などのデータをクレンジングする安全ガード"""
    if user_data and "grade" in user_data:
        db_grade = user_data.get("grade")
        if isinstance(db_grade, str):
            # マッピングにあれば変換、なければそのまま（デフォルトはU4にするなど保険をかけるのもアリです）
            user_data["grade"] = GRADE_MAP.get(db_grade, db_grade)
            print(f"🧹 [DEBUG] 学年データをクレンジングしました: '{db_grade}' -> '{user_data['grade']}'")
    return user_data


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Dict[str, Any]:
    """Bearerトークンから、ログイン中のpublic.usersレコードを取得する。"""
    # 🕵️‍♂️ デバッグ用ログ1
    if credentials is None:
        print("🚨 [DEBUG] フロントからトークンが届いていません！(credentials が None)")
        raise _unauthorized("ログインが必要です")

    access_token = credentials.credentials

    try:
        auth_response = supabase_auth.auth.get_user(access_token)
        auth_user = auth_response.user
        print(f"👤 [DEBUG] Supabaseからユーザーの取得に成功しました: {auth_user.email}")
    except Exception as e:
        # 🕵️‍♂️ デバッグ用ログ2（ここで何のエラーが起きているかを暴く）
        print(f"❌ [DEBUG] Supabaseへの問い合わせでエラーが発生しました！ 原因: {e}")
        raise _unauthorized("アクセストークンが無効、または期限切れです")

    if auth_user is None:
        print("🚨 [DEBUG] ユーザーは取得できましたが、中身が空(None)です")
        raise _unauthorized("ログインユーザーを確認できませんでした")

    try:
        profile_response = (
            supabase.table("users")
            .select("*")
            .eq("auth_id", str(auth_user.id))
            .limit(1)
            .execute()
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="プロフィールの取得に失敗しました",
        )

    if not profile_response.data:
        print(f"👤 [DEBUG] usersテーブルにレコードがありません。自動作成を開始します... auth_id: {auth_user.id}")
        
        # ⭐️ フロントの options.data に入れた値を取り出す
        user_metadata = getattr(auth_user, "user_metadata", {}) or {}
        
        # フロントのキー名（name, grade）に完全に合わせる！
        default_name = user_metadata.get("name") or "新規ユーザー"
        raw_grade = user_metadata.get("grade") or "U4"
        default_grade = GRADE_MAP.get(raw_grade, "U4")
        
        try:
            from app.cruds.users import create_user_profile
            # 💡 subject_uid が必要であれば、ここで3（河村一樹など）を仮で入れる
            new_profile = create_user_profile(str(auth_user.id), default_name, default_grade, subject_uid=None)
            
            if new_profile and len(new_profile) > 0:
                print(f"✨ [DEBUG] プロフィールの自動作成に成功しました！ {new_profile[0]}")
                # 🌟 新規作成されたユーザーの学年を綺麗にしてから返す
                return sanitize_user_data(new_profile[0])
                
        except Exception as create_err:
            # 🚨 握りつぶさずに、何のエラーで失敗したかを500エラーとしてフロントに返す！

            import traceback
            print("==================================================")
            print("❌ [CRITICAL] ユーザープロフィールの自動作成に失敗しました！")
            print(f"エラー内容: {create_err}")
            traceback.print_exc()  # 詳細なスタックトレースを表示
            print("==================================================")

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"プロフィールの自動作成に失敗しました: {str(create_err)}",
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロフィールが存在しません",
        )
    
    # 🌟 既存ユーザーの学年も綺麗にしてから返す
    return sanitize_user_data(profile_response.data[0])
