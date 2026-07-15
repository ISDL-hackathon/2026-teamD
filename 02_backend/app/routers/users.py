from fastapi import APIRouter, Depends, HTTPException
from app.cruds.auth import get_current_user  # 💡プロジェクトの認証関数に合わせてください
from app.cruds.get_users_table import get_user_by_sid, update_user_gb  # 💡CRUD側の関数

router = APIRouter(prefix="/users", tags=["users"])

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