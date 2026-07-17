from fastapi import Depends
from app.cruds.auth import get_current_user

from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.character import (
    get_character_profile_db,
    get_owned_character_db,
    update_home_character,
    get_character_info,
)

router = APIRouter(prefix="/character", tags=["character"])

# 💡 エラーの原因だった空の CharacterRequest は削除しました。
# もし今後使う場合は、以下のように「pass」を入れておけばエラーになりません。
# class CharacterRequest(BaseModel):
#     pass

class CharacterProfileRequest(BaseModel):
    cid: int

class HomeCharacterRequest(BaseModel):
    cid: int


# 🌟 "/owend" から "/owned" にスペルミスを修正しました！これでフロントと繋がります
@router.post("/owned")
def get_owned_character(
    current_user=Depends(get_current_user),
):
    """音声フィールドを含む所持キャラクター一覧を返す。"""

    uid = current_user["uid"]
    print(f"キャラクター詳細のトップ画面 uid: {uid}")

    owned_characters = get_owned_character_db(uid)

    if not owned_characters:
        print("所持キャラクターはいません")
        return None

    return owned_characters

@router.post("/profile")
def get_character_profile(
    request_data: CharacterProfileRequest,
    current_user=Depends(get_current_user),
):
    """音声フィールドを含むキャラクタープロフィールを返す。"""

    uid = current_user["uid"]
    cid = request_data.cid

    print(f"キャラクタープロフィールを表示 uid: {uid}, cid: {cid}")

    character_data = get_character_profile_db(uid, cid)

    if not character_data:
        print("所持キャラクターがいません")
        return None

    return character_data


@router.post("/home-character")
def set_home_character(request_data: HomeCharacterRequest, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    cid = request_data.cid
    result = update_home_character(uid, cid)
    char_info = get_character_info(cid)

    if not result:
        return {
            "status": "error",
            "message": "所持していないキャラクターです"
        }

    name = char_info["name"]
    img1 = char_info["img1"]
    vc_home = char_info["vc_home"]
    vc_quote_home = char_info["vc_quote_home"]

    return {
        "cid": cid,
        "name": name,
        "img1": img1,
        "vc_home" : vc_home,
        "vc_quote_home" : vc_quote_home
    }