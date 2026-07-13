from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.character import add_character_to_user, get_character_by_id, get_character_rate, demo_get_character
from app.cruds.gb import update_gb


router = APIRouter(prefix="/gacha", tags=["gacha"])

class TutorialRequest(BaseModel):
    uid: int

class DrawRequest(BaseModel):
    uid: int
    cnt: int

#チュートリアルガチャエンドポイント
@router.post("/tutorial")
def tutorial_gacha_endpoint(request_data: TutorialRequest):
    uid = request_data.uid
    print(f"チュートリアルガチャ発生 UID: {uid}")
    
    result = get_kuranuki_to_user(uid)
    
    if not result:
        return {"status": "error", "message": "チュートリアルガチャに失敗しました"}
        
    return {"status": "success", "character": result}

#ガチャを引くAPIの窓口
@router.post("/draw")
def draw_gacha_endpoint(request_data: DrawRequest):
    uid = request_data.uid
    cnt = request_data.cnt

    print(f"フロントから呼び出されました！ UID: {uid}, cnt: {cnt}")
    
    result = get_character_from_user(uid, cnt)
    
    if not result:
        return {"status": "error", "message": "ガチャ排出に失敗しました"}
        
    return {"status": "success", "character": result}



@router.post("kuranuki-gatya")

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
def get_character_from_user(uid, cnt):
    print("ガチャで排出実装")
    
    try:        
        #デモ
        #chosen_cid=demo_get_character(cnt)
        #本番
        chosen_cid=get_character_rate(cnt)
        if not chosen_cid:
            return False

        result = []
        for cid in chosen_cid:
            result.append(get_character_by_id(uid, cid))
            print("ガチャで排出成功")
        
        consume_gb = 16 * cnt
        update_gb(uid, consume_gb)
        return result
    
    except Exception as e:
        print(f"ガチャで排出失敗: {e}")
        return False
    
