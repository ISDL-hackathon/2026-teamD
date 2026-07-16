from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app import supabase


# Authorization ヘッダーがない場合も、こちらで統一した401を返す。
bearer_scheme = HTTPBearer(auto_error=False)


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
    print(f"🔑 [DEBUG] フロントからトークンが届きました: {access_token[:15]}...")

    try:
        auth_response = supabase.auth.get_user(access_token)
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
            .select("uid, auth_id, name, grade, is_stay")
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
        
        default_name = auth_user.email.split("@")[0] if auth_user.email else "新規ユーザー"
        default_grade = "U4"
        
        try:
            from app.cruds.users import create_user_profile
            # 💡 subject_uid が必要であれば、ここで3（河村一樹など）を仮で入れる
            new_profile = create_user_profile(str(auth_user.id), default_name, default_grade, subject_uid=3)
            
            if new_profile and len(new_profile) > 0:
                print(f"✨ [DEBUG] プロフィールの自動作成に成功しました！ {new_profile[0]}")
                return new_profile[0]
                
        except Exception as create_err:
            # 🚨 握りつぶさずに、何のエラーで失敗したかを500エラーとしてフロントに返す！
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"プロフィールの自動作成に失敗しました: {str(create_err)}",
            )

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="プロフィールが存在しません",
        )
    return profile_response.data[0]

    # cruds/auth.py の末尾に追記

