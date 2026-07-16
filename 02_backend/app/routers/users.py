from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.cruds.users import update_user_profile
from app.cruds.auth import get_current_user  # 💡プロジェクトの認証関数に合わせてください
from app.cruds.get_users_table import get_user_by_uid, update_user_gb  # 💡CRUD側の関数
from app import supabase

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me")
def read_user_me(current_user = Depends(get_current_user)):
    """
    ログインしている自分自身の情報を返す
    """
    uid = current_user.get("uid")
    
    # 🟢 直接「users」テーブルから、このユーザーの最新の「gb」の値を取得する
    try:
        response = supabase.table("users").select("gb").eq("uid", uid).single().execute()
        # 本物のGB数を取得。取得できなければ安全に 0 に逃がす
        real_gb = response.data.get("gb", 0) if response and response.data else 0
    except Exception as e:
        print(f"⚠️ DBからGB数の取得に失敗しました: {e}")
        real_gb = 0

    return {
        "status": "success",
        "user": {
            "uid": uid,
            "name": current_user.get("name"),
            "grade": current_user.get("grade"),
            "gb": real_gb  # 💡 ここに本物のGB数がセットされます！
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
            "uid": opponent["uid"],
            "name": opponent["name"],
            "grade": opponent["grade"]
        }
    }