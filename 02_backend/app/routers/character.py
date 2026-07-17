from fastapi import Depends
from app.cruds.auth import get_current_user

from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.character import (
    get_character_profile_db, 
    get_owned_character_db,
    update_home_character,
    get_character_info
)

router = APIRouter(prefix="/character", tags=["character"])

class CharacterProfileRequest(BaseModel):
    cid: int

class HomeCharacterRequest(BaseModel):
    cid: int


@router.post("/owend")
def get_owned_character(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    print(f"キャラクター詳細のトップ画面  uid:", uid)
    owner_character = get_owned_character_db(uid)
    print(owner_character)
    if not owner_character:
        print("所持キャラはいません")
        return None
    return owner_character


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