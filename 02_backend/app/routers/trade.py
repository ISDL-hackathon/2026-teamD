from fastapi import Depends, HTTPException, APIRouter
from app.cruds.auth import get_current_user
from pydantic import BaseModel
import json

from app.routers.qr import trade_create_qr
from app.cruds.get_users_table import get_name, get_grade
from app.cruds.gb import add_gb
from app.cruds.trade import (
    add_my_uid,
    add_tar_uid,
    change_trade_flag,
    add_trade_character,
    get_opponent_uid,
    select_trade_characters,
    execute_trade,
    get_trade_id,
    get_is_add_gb,
    get_trade_info,
    finish_trade
)

router = APIRouter(prefix="/trading", tags=["trading"])


class TradingScanRequest(BaseModel):
    trade_id: int

class TradingAllowRequest(BaseModel):
    trade_id: int
    flag: bool

class TradingSelectRequest(BaseModel):
    cid: int


# ==========================================
# 🌟 送信側（QR表示側）のための状態監視（ポーリング）API
# ==========================================
@router.get("/status")
def get_trading_status(
    trade_id: int = None,  # 👈 【修正】フロントから trade_id を受け取れるように追加
    current_user=Depends(get_current_user)
):
    uid = current_user["uid"]
    
    # 【修正】フロントから trade_id が送られてきたらそれを使い、無ければ自動取得する
    if not trade_id:
        trade_id = get_trade_id(uid)
        
    if not trade_id:
        return {"status": "pending"}
        
    # 2. トレードの進捗情報をDBから取得
    trade_info = get_trade_info(trade_id)
    if not trade_info:
        return {"status": "pending"}
        
    trade = trade_info[0]
    tar_uid = trade.get("tar_uid") # 相手（スキャンした側）のUID
    
    # まだ誰もQRをスキャンしていない状態
    if not tar_uid:
        return {"status": "pending"}
        
    # 相手の基本情報を取得
    tar_name = get_name(tar_uid)
    tar_grade = get_grade(tar_uid)
    partner_info = {
        "name": tar_name,
        "grade": tar_grade
    }
    
    # 3. 相手がすでに /complete を完了し、GB付与フェーズ（交換成立後）に入っているか確認
    if get_is_add_gb(trade_id):
        acquired_character = None
        try:
            acquired_character = execute_trade(trade_id, uid)
        except Exception as e:
            print(f"[STATUS API] 獲得キャラ取得エラー (デモ続行のため許容します): {e}")
            
        return {
            "status": "completed",
            "partner": partner_info,
            "acquired": acquired_character
        }
        
    # 4. 相手がスキャンは完了したが、まだキャラを選んでいない状態
    return {
        "status": "scanned",
        "partner": partner_info
    }


# トレードで使用するQRを見せる
@router.post("/showQR")
def trade_show_qr(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    print("交換でユーザを識別するQRを表示")
    trade_id = add_my_uid(uid)
    return trade_create_qr(uid, trade_id)
    
@router.post("/scanQR")
def trade_scan_qr(request_data: TradingScanRequest, current_user=Depends(get_current_user)):
    try:
        tar_uid = current_user["uid"]
        trade_id = request_data.trade_id
        if not add_tar_uid(tar_uid, trade_id):
            raise HTTPException(
                status_code=400,
                detail="自分自身のQRコード、または無効なQRコードです",
            )
        tar_name = get_name(tar_uid)
        tar_grade = get_grade(tar_uid)
        print(f"交換する相手の名前は{tar_name}，学年は{tar_grade}ですか？")
        return {
            "name": tar_name,
            "grade": tar_grade
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"相手を読み込むこと失敗: {e}")
        raise HTTPException(status_code=400, detail="交換相手の読み込みに失敗しました")

@router.post("/allow")
def trade_flag_true(request_data: TradingAllowRequest, current_user=Depends(get_current_user)):
    trade_id = request_data.trade_id
    flag = request_data.flag
    # 許可(True)なら取引継続(is_trade=False)、拒否(False)なら取引終了(is_trade=True)に更新
    change_trade_flag(trade_id, flag)


@router.post("/select")
def trade_info(current_user=Depends(get_current_user)):
    uid = current_user["uid"]

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
        "tar_uid": tar_uid,
        "characters": characters
    }

@router.post("/trade")
def confirm_trade_character(request_data: TradingSelectRequest, current_user=Depends(get_current_user)):
    uid = current_user["uid"]
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
def complete_trade(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    trade_id = get_trade_id(uid)

    character = execute_trade(trade_id, uid)

    if character is None:
        return {
            "message": "交換失敗"
        }
    print(character)
    return character


# ==========================================
# 🪙 トレード完了後のGB（ギガバイト）付与API
# ==========================================
@router.post("/gb")
def add_gb_for_trade(current_user=Depends(get_current_user)):
    uid = current_user["uid"]
    trade_id = get_trade_id(uid)
    
    if trade_id is None:
        return {"status": "error", "message": "トレードが見つかりません"}

    if not get_is_add_gb(trade_id):
        return {"status": "error", "message": "GB付与フェーズではありません"}

    trade_info = get_trade_info(trade_id)
    
    # ⭕️ 安全対策：None または 空データ のチェックを先に実行
    if not trade_info:
        return {"status": "error", "message": "トレード情報が見つかりません"}

    trade = trade_info[0]

    my_uid = trade["my_uid"]
    tar_uid = trade["tar_uid"]

    my_grade = trade["my_user"]["grade"]
    tar_grade = trade["tar_user"]["grade"]

    print(my_uid, my_grade)
    print(tar_uid, tar_grade)

    # is_add_gb を True → False に更新、同時に is_trade を True（完全終了）に更新できた人だけGB付与
    result = finish_trade(trade_id)

    if result:
        add_gb(my_uid, my_grade, tar_uid, tar_grade, 2)
        print("GB付与完了")
        return {"status": "success"}

    return {"status": "success", "message": "GBは既に付与済み"}
