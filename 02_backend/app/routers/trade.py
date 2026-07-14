import json
from fastapi import APIRouter
from pydantic import BaseModel

from app.routers.qr import trade_create_qr
from app.cruds.users import get_name, get_grade
from app.cruds.trade import (
    add_my_uid,
    add_tar_uid,
    change_trade_flag,
    add_trade_character,
    get_opponent_uid,
    select_trade_characters,
    get_my_flag_tar_flag,
    execute_trade,
    get_trade_id
)

router = APIRouter(prefix="/trading", tags=["trading"])

class TradingShowRequest(BaseModel):
    uid : int

class TradingScanRequest(BaseModel):
    uid: int
    trade_id: int

class TradingAllowRequest(BaseModel):
    trade_id: int
    flag: bool

class TradingSelectCharactersRequest(BaseModel):
    uid: int

class TradingRequest(BaseModel):
    uid: int
    cid: int

class TradingCompleteRequest(BaseModel):
    uid: int
#トレードで使用するQRを見せる
@router.post("/showQR")
def trade_show_qr(request_data: TradingShowRequest):
    uid = request_data.uid
    print("交換でユーザを識別するQRを表示")
    trade_id = add_my_uid(uid)
    return trade_create_qr(uid, trade_id)
    
@router.post("/scanQR")
def trade_scan_qr(request_data: TradingScanRequest):
    try:
        tar_uid = request_data.uid
        trade_id = request_data.trade_id
        add_tar_uid(tar_uid, trade_id)
        change_trade_flag(trade_id, True)
        tar_name = get_name(tar_uid)
        tar_grade = get_grade(tar_uid)
        print(f"交換する相手の名前は{tar_name}，学年は{tar_grade}ですか？")
        return {
            "name": tar_name,
            "grade": tar_grade
        }
    except Exception as e:
        print(f"相手を読み込むこと失敗: {e}")
        return False    

@router.post("/allow")
def trade_flag_true(request_data: TradingAllowRequest):
    trade_id = request_data.trade_id
    flag = request_data.flag
    change_trade_flag(trade_id, flag)


@router.post("/select")
def trade_info(request_data: TradingSelectCharactersRequest):
    uid = request_data.uid

    tar_uid = get_opponent_uid(uid)

    if tar_uid is None:
        return {
            "message": "交換相手なし"
        }

    # 自分のuid
    my_uid = uid

    # 相手キャラ取得
    characters = select_trade_characters(my_uid, tar_uid)

    print("自分が所持していないキャラ")
    print("characters:")
    print(characters)


    return {
        "tar_uid":tar_uid,
        "characters":characters
    }

@router.post("/trade")
def confirm_trade_character(request_data: TradingRequest):
    uid = request_data.uid
    cid = request_data.cid

    result = add_trade_character(uid, cid)

    if not result:
        return {
            "message": "登録失敗"
        }

    return {
        "message": "キャラ選択完了"
    }

@router.post("/complete")
def complete_trade(request_data: TradingCompleteRequest):

    uid = request_data.uid

    flags = get_my_flag_tar_flag(uid)

    if flags != (True, True):
        return {
            "message": "相手の選択待ち"
        }


    trade_id = get_trade_id(uid)

    character = execute_trade(trade_id)

    if character is None:
        return {
            "message": "交換失敗"
        }


    return character