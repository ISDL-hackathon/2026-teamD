import qrcode
import io

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.cruds.qr import get_grade, get_mission_id, verify_conversation_qr

router = APIRouter(prefix="/qr", tags=["qr"])

class QrShowRequest(BaseModel):
    uid : int

class QrScanRequest(BaseModel):
    data: str

@router.post("/showQR")
def create_qr(request_data: QrShowRequest):
    uid = request_data.uid
    grade = get_grade(uid)
    mission_id = get_mission_id(uid)

    #uid=__&grade=___&mission_id=__
    data = f"uid={uid}&grade={grade}&mission_id={mission_id}"

    img = qrcode.make(data)
    #仮
    img.save("qr_images/qr.png")

    # 画像をメモリ上に保存
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="image/png"
    )

@router.post("/scanQR")
def scan_qr(request: QrScanRequest):
    try:
        data = request.data
        values = dict(
            item.split("=")
            for item in data.split("&")
        )

        tar_id = int(values["uid"])
        tar_grade = values["grade"]
        mission_id = int(values["mission_id"])
        print(tar_id, tar_grade, mission_id)

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
    except Exception as e:
        return {
            "error": str(e)
        }