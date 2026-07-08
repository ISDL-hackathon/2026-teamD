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
    
    result = get_16gb(uid)
    if not result:
        return {"status": "error", "message": "チュートリアルGB配布に失敗しました"}
    print(f"result:")
    return {"status": "success", "message": "チュートリアルGB配布成功"}

#チュートリアルで16GB配布
def get_16gb(uid):
    print("チュートリアルGB配布実装中")
    try:
        update_gb(uid, 16)
        print("チュートリアルGB配布成功")
        return True
    except Exception as e:
        print(f"チュートリアルGB配布失敗: {e}")
        return False



# #gbの増減
# def get_gb(uid, gb):
#     print("gbの増減")
#     try:
#         update_gb(uid,gb)
#         return True
#     except Exception as e:
#         print(f"GB配布失敗: {e}")
#         return False