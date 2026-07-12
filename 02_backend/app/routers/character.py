from fastapi import APIRouter
from pydantic import BaseModel

from app.cruds.character import get_character_profile_db, get_owned_character_db


router = APIRouter(prefix="/character", tags=["character"])

class CharacterRequest(BaseModel):
    uid: int

class CharacterProfileRequest(BaseModel):
    uid: int
    cid: int

@router.post("owend")
def get_owned_character(request_data: CharacterRequest):
    uid = request_data.uid
    print(f"キャラクター詳細のトップ画面  uid:", uid)
    owner_character = get_owned_character_db(uid)
    if not owner_character:
        print("所持キャラはいません")
        return None
    return owner_character


@router.post("profile")
def get_character_profile(request_data: CharacterProfileRequest):
    uid = request_data.uid
    cid = request_data.cid
    print(f"キャラクタープロフィールを表示 uid:{uid}, cid:{cid}")

    char_data = get_character_profile_db(uid, cid)
    if not char_data:
        print("所持キャラがいません")
        return None
    return char_data