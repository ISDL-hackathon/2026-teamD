from app.cruds.gb import  update_gb

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/gb", tags=["gb"])

class GachaRequest(BaseModel):
    uid: int

@router.post("/gb")
def tutorial_gb_endpoint(request_data: GachaRequest):
    uid = request_data.uid
    print(f"チュートリアルGB配布発生 UID: {uid}")
    
    result = get_tutorial(uid)
    if not result:
        return {"status": "error", "message": "チュートリアルGB配布に失敗しました"}
        
    return {"status": "success", "message": "チュートリアルGB配布成功"}

#チュートリアルで16GB配布
def get_tutorial(uid):
    print("チュートリアルGB配布実装中")
    try:
        update_gb(uid, 16)
        print("チュートリアルGB配布成功")
        return True
    except Exception as e:
        print(f"チュートリアルGB配布失敗: {e}")
        return False
    
