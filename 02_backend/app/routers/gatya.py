from fastapi import Depends, APIRouter
from pydantic import BaseModel
from app.cruds.auth import get_current_user
from app.cruds.character import add_character_to_user, get_character_by_id, get_character_rate
from app.cruds.gb import get_user_gb, update_gb
from app.cruds.character import demo_get_character

router = APIRouter(prefix="/gacha", tags=["gacha"])

class DrawRequest(BaseModel):
    cnt: int

# チュートリアルガチャエンドポイント
@router.post("/tutorial")
def tutorial_gacha_endpoint(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    print(f"チュートリアルガチャ発生 UID: {uid}")
    
    result = get_kuranuki_to_user(uid)
    
    if not result:
        return {"status": "error", "message": "チュートリアルガチャに失敗しました"}
        
    return {"status": "success", "character": result}

# ガチャを引くAPIの窓口
@router.post("/draw")
def draw_gacha_endpoint(request_data: DrawRequest, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    cnt = request_data.cnt

    print(f"フロントから呼び出されました！ UID: {uid}, cnt: {cnt}")
    consume_gb = 16 * cnt
    
    # 1. GBの残高確認
    if get_user_gb(uid) < consume_gb:
        print("GBが足りません")
        # ❌ successで返すのをやめ、エラーとしてメッセージを返す
        return {"status": "error", "message": f"GB（ガチャパワー）が足りません。必要: {consume_gb}GB"}

    # 2. GBを減算
    update_gb(uid, -consume_gb)
    
    # 3. キャラクターの抽選とDB保存
    result = get_character_from_user(uid, cnt)
    if not result:
        return {"status": "error", "message": "キャラクターの排出に失敗しました"}
        
    return {"status": "success", "character": result}

# チュートリアルでイライラした倉貫さんを排出
def get_kuranuki_to_user(uid, id=10):
    print("倉貫さん排出実装")
    try:
        print("イライラした倉貫さん排出成功")
        return add_character_to_user(uid, id)
    except Exception as e:
        print(f"イライラした倉貫さん排出失敗: {e}")
        return False
    
# ガチャから排出
def get_character_from_user(uid, cnt):
    print("ガチャで排出実装")
    try:        
        #デモ
        chosen_cid=demo_get_character(cnt)
        # 本番の確率テーブルからcidを選択
        #chosen_cid = get_character_rate(cnt)
        if not chosen_cid:
            return False

        result = []
        for cid in chosen_cid:
            # get_character_by_id の戻り値に、prefix, name, img1, quote が含まれていることを確認してください
            char_data = get_character_by_id(uid, cid)
            result.append(char_data)
            print(f"ガチャでキャラ(ID: {cid})の排出成功")
        
        return result
    except Exception as e:
        print(f"ガチャで排出失敗: {e}")
        return False