from app import supabase
from app.cruds.character import add_character_to_user, get_character_by_id, get_character_rate

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gacha", tags=["gacha"])

class GachaRequest(BaseModel):
    uid: int

#ガチャを引くAPIの窓口
@router.post("/draw")
def draw_gacha_endpoint(request_data: GachaRequest):
    uid = request_data.uid
    print(f"フロントから呼び出されました！ UID: {uid}")
    
    result = get_character_from_user(uid)
    
    if not result:
        return {"status": "error", "message": "ガチャ排出に失敗しました"}
        
    print(f"result:",result)
    return result

#チュートリアルガチャエンドポイント
@router.post("/tutorial")
def tutorial_gacha_endpoint(request_data: GachaRequest):
    uid = request_data.uid
    print(f"チュートリアルガチャ発生 UID: {uid}")
    
    result = get_kuranuki_to_user(uid)
    
    if not result:
        return {"status": "error", "message": "チュートリアルガチャに失敗しました"}
        
    print(f"result:",result)
    return result

#チュートリアルでイライラした倉貫さんを排出
def get_kuranuki_to_user(uid, id=1):
    print("倉貫さん排出実装")
    try:
        #所持キャラ追加        
        print("イライラした倉貫さん排出成功")
        return add_character_to_user(uid, id)
    
    except Exception as e:
        print(f"イライラした倉貫さん排出失敗: {e}")
        return False
    
#ガチャから排出
def get_character_from_user(uid):
    print("ガチャで排出実装")
    
    try:
        chosen_cid=get_character_rate()
        if not chosen_cid:
            return False

        print("ガチャで排出成功")
        return get_character_by_id(uid, chosen_cid)
    
    except Exception as e:
        print(f"ガチャで排出失敗: {e}")
        return False
    
