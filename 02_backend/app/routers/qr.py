import qrcode
import io
import os
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.cruds.qr import get_mission_id, verify_conversation_qr
from app.cruds.users import get_grade

router = APIRouter(prefix="/qr", tags=["qr"])

class QrShowRequest(BaseModel):
    uid : int

class QrScanRequest(BaseModel):
    uid: int
    grade: str
    mission_id: int

@router.post("/enter")
def enter():
    #URLはまた変更
    url = "http://127.0.0.1:8000/staying/start"
    img = qrcode.make(url)
    img.save("qr_img/enter_qr.png")

class EnterRequest(BaseModel):
    uid : int

@router.post("/enter")
def enter():
    #URLはまた変更
    url = "http://127.0.0.1:8000/staying/start"
    img = qrcode.make(url)
    img.save("qr_img/enter_qr.png")


@router.post("/showQR")
def create_qr(request_data: QrShowRequest):
    uid = request_data.uid

    user_data = conversation_show_qr_info(uid)
    json_data = json.dumps(user_data)
    qr_data = create_qr_image(json_data)
    return StreamingResponse(qr_data, media_type="image/png")

@router.post("/scanQR")
def scan_qr(request_data: QrScanRequest):
    try:
        uid = request_data.uid
        grade = request_data.grade
        mission_id = request_data.mission_id

        # DB照合
        conversation = verify_conversation_qr(mission_id)
        if conversation is False:
            return {
                "message": "無効なQRです"
            }

        return {
            "message": "会話開始可能",
            "conversation_id": mission_id
        }

    except json.JSONDecodeError:
        return {
            "message": "QRデータの形式が不正です"
        }

    except Exception as e:
        return {
            "error": str(e)
        }
    
def create_qr_image(data):
    img = qrcode.make(data)

    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return buffer

#qrにする情報
def conversation_show_qr_info(uid):
    info = {
        "uid": uid,
        "grade": get_grade(uid),
        "mission_id": get_mission_id(uid)
    }
    return info

def trade_create_qr(uid, trade_id):
    json_data = json.dumps({
        "uid": uid,
        "trade_id": trade_id
    })
    qr_data = create_qr_image(json_data)
    return StreamingResponse(qr_data, media_type="image/png")