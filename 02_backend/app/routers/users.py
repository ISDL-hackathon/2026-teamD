from fastapi import APIRouter, Depends, HTTPException
from app.cruds.auth import get_current_user  # 💡プロジェクトの認証関数に合わせてください
from app.cruds.users import get_user_by_sid, update_user_gb  # 💡CRUD側の関数

router = APIRouter(prefix="/users", tags=["users"])


from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# 1. HTTPBearerのインスタンスを作成
reusable_oauth2 = HTTPBearer()

def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(reusable_oauth2)
):
    """
    ヘッダーから Bearer トークンを抽出し、検証する依存関数
    """
    # credentials.credentials の中に、実際のトークン（文字列）が入ってきます
    token = credentials.credentials
    
    print(f"受け取ったトークン: {token}")

    # --- トークンの検証ロジック（以下は一例です） ---
    # 例：SupabaseのJWTトークンを検証する場合や、デバッグ用に特定文字で通す場合など
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="有効なトークンがありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # ここでDBからユーザーを取得したり、トークンをデコードします
    # user = get_user_by_token(token)
    # return user
    
    return {"token": token}  # テスト用に一旦トークンをそのまま返す


@router.get("/users/me")
def read_users_me(current_user = Depends(get_current_user_from_token)):
    """
    このエンドポイントは、Authorizationヘッダーに有効な
    'Bearer <Token>' が入っていないと 401 Unauthorized になります。
    """
    return {
        "message": "認証成功！",
        "current_user_token_info": current_user
    }

# --- 1. ログイン中の自分の情報を取得する ---
@router.get("/me")
def read_user_me(current_user = Depends(get_current_user)):
    """
    ログインしている自分自身の情報を返す
    """
    return {
        "status": "success",
        "user": {
            "uid": current_user.uid,
            "name": current_user.name,
            "grade": current_user.grade,
            "sid": current_user.sid,
            "gb": current_user.gb  # 所持GBなど
        }
    }

# --- 2. トレード相手を学籍番号(sid)で検索する ---
@router.get("/search/{sid}")
def search_user_by_sid(sid: str, current_user = Depends(get_current_user)):
    """
    トレード申請などを送るために、学籍番号から相手の情報を検索する
    """
    opponent = get_user_by_sid(sid)
    if not opponent:
        raise HTTPException(status_code=404, detail="指定された学籍番号のユーザーが見つかりません")
        
    return {
        "status": "success",
        "user": {
            "uid": opponent.uid,
            "name": opponent.name,
            "grade": opponent.grade,
            "sid": opponent.sid
        }
    }