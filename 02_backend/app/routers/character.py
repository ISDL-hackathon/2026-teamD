from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.character import (
    get_character_profile_db, 
    get_owned_character_db,
    update_home_character,
    get_character_info
)

router = APIRouter(prefix="/character", tags=["character"])

class CharacterRequest(BaseModel):
    uid: int

class CharacterProfileRequest(BaseModel):
    uid: int
    cid: int

class HomeCharacterRequest(BaseModel):
    uid: int
    cid: int


@router.post("/owend")
def get_owned_character(request_data: CharacterRequest):
    uid = request_data.uid
    print(f"キャラクター詳細のトップ画面  uid:", uid)
    owner_character = get_owned_character_db(uid)
    print(owner_character)
    if not owner_character:
        print("所持キャラはいません")
        return None
    return owner_character


@router.post("/profile")
def get_character_profile(request_data: CharacterProfileRequest):
    uid = request_data.uid
    cid = request_data.cid
    print(f"キャラクタープロフィールを表示 uid:{uid}, cid:{cid}")

    char_data = get_character_profile_db(uid, cid)
    if not char_data:
        print("所持キャラがいません")
        return None
    return char_data


@router.post("/home-character")
def set_home_character(request_data: HomeCharacterRequest):
    uid = request_data.uid
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

    return {
        "cid": cid,
        "name": name,
        "img1": img1
    }