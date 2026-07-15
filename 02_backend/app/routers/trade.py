import json
from fastapi import APIRouter
from pydantic import BaseModel

from app.routers.qr import trade_create_qr
from app.cruds.trade import add_my_uid, add_tar_uid, change_trade_flag, get_trade_characters, get_trade_user
from app.cruds.users import get_name, get_grade

router = APIRouter(prefix="/trading", tags=["trading"])

class TradingShowRequest(BaseModel):
    uid : int

class TradingScanRequest(BaseModel):
    uid: int
    trade_id: int

class TradingSelectCharactersRequest(BaseModel):
    uid: int


#トレードで使用するQRを見せる
@router.post("/trade/showQR")
def trade_show_qr(request_data: TradingShowRequest):
    uid = request_data.uid
    print("交換でユーザを識別するQRを表示")
    trade_id = add_my_uid(uid)
    return trade_create_qr(uid, trade_id)
    
@router.post("/trade/scanQR")
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
    

@router.get("/trade/select")
def trade_info(request_data: TradingSelectCharactersRequest):
    uid = request_data.uid
    # 交換相手取得
    tar_uid = get_trade_user(uid)
    print(tar_uid)
    if tar_uid is None:
        return {
            "message":"交換相手なし"
        }


    # 相手キャラ取得
    characters = get_trade_characters(tar_uid)
    
        # コンソール出力
    print("tar_uid:", tar_uid)
    print("characters:")
    print(characters)

    return {
        "tar_uid":tar_uid,
        "characters":characters
    }