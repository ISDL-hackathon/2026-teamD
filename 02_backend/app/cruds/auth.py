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
):
    if credentials is None:
        raise _unauthorized("ログインが必要です")

    access_token = credentials.credentials

    auth_response = supabase.auth.get_user(access_token)
    auth_user = auth_response.user

    if auth_user is None:
        raise _unauthorized("ログインユーザーを確認できませんでした")

    profile_response = (
        supabase.table("users")
        .select("uid, auth_id, name, grade, gb, is_stay")
        .eq("auth_id", str(auth_user.id))
        .limit(1)
        .execute()
    )

    print(profile_response.data)

    if not profile_response.data:
        raise HTTPException(
            status_code=404,
            detail="ログインユーザーに対応するプロフィールがありません"
        )

    return profile_response.data[0]