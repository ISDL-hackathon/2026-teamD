from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.cruds.auth import get_current_user
from app.cruds.character import (
    get_character_profile_db,
    get_owned_character_db,
    update_home_character,
    get_character_info,
)

router = APIRouter(prefix="/character", tags=["character"])


class CharacterProfileRequest(BaseModel):
    cid: int


class HomeCharacterRequest(BaseModel):
    cid: int


@router.post("/owned")
def get_owned_character(
    current_user=Depends(get_current_user),
):
    """音声情報を含む所持キャラクター一覧を返す。"""

    uid = current_user["uid"]
    print(f"所持キャラクター一覧取得 uid: {uid}")

    owned_characters = get_owned_character_db(uid)

    if not owned_characters:
        print("所持キャラクターはいません")
        return []

    return owned_characters


@router.post("/profile")
def get_character_profile(
    request_data: CharacterProfileRequest,
    current_user=Depends(get_current_user),
):
    """音声情報を含むキャラクタープロフィールを返す。"""

    uid = current_user["uid"]
    cid = request_data.cid

    print(f"キャラクタープロフィール取得 uid: {uid}, cid: {cid}")

    character_data = get_character_profile_db(uid, cid)

    if not character_data:
        print("対象キャラクターを所持していません")
        return []

    return character_data


@router.post("/home-character")
def set_home_character(
    request_data: HomeCharacterRequest,
    current_user=Depends(get_current_user),
):
    """ホームキャラクターを設定し、ホーム用音声情報を返す。"""

    uid = current_user["uid"]
    cid = request_data.cid

    result = update_home_character(uid, cid)

    if not result:
        return {
            "status": "error",
            "message": "所持していないキャラクターです",
        }

    character_info = get_character_info(cid)

    if not character_info:
        return {
            "status": "error",
            "message": "キャラクター情報を取得できませんでした",
        }

    return {
        "status": "success",
        "cid": cid,
        "name": character_info.get("name"),
        "img1": character_info.get("img1"),
        "vc_home": character_info.get("vc_home"),
        "vc_quote_home": character_info.get("vc_quote_home"),
    }