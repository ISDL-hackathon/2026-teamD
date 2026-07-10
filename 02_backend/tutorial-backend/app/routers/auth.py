from app import supabase
from fastapi import APIRouter
from pydantic import BaseModel
from app.cruds.auth import sign_up_user_to_db, sign_in_user_to_db, sign_out_user_to_db

router = APIRouter()

router = APIRouter(prefix="/auth", tags=["auth"])

class SignUpRequest(BaseModel):
    name: str
    grade: str
    sid: str
    pword: str

class SignInRequest(BaseModel):
    sid: str
    pword: str

class SignOutRequest(BaseModel):
    sid: str
    pword: str

@router.post("/signup")
def sign_up_endpoint(request_data: SignUpRequest):
    print("ユーザー登録の窓口が呼ばれました")
    # フロントから届いたデータをバラして、既存の関数に渡す
    result = sign_up_user_to_db(
        name=request_data.name,
        grade=request_data.grade,
        sid=request_data.sid,
        pword=request_data.pword
    )
    if not result:
        return {"status": "error", "message": "サインアップに失敗しました"}
    return {"status": "success", "user": result}

@router.post("/signin")
def sign_in_endpoint(request_data: SignInRequest):
    print("ユーザーログインの窓口が呼ばれました")
    result = sign_in_user_to_db(
        sid=request_data.sid,
        pword=request_data.pword
    )
    if not result:
        return {"status": "error", "message": "ログインに失敗しました。学生番号かパスワードが違います"}
    return {"status": "success", "user": result}


@router.post("/signout")
def sign_out_endpoint(request_data: SignOutRequest):
    print("ユーザーログアウトの窓口が呼ばれました")
    result = sign_out_user_to_db(
        sid=request_data.sid,
        pword=request_data.pword
    )
    if not result:
        return {"status": "error", "message": "ログアウトに失敗しました"}
    return {"status": "success", "message": "ログアウトしました"}


def sign_up_user(name, grade, sid, pword):
    print("ユーザー登録実装中")
    return sign_up_user_to_db(name, grade, sid, pword)

def sign_in_user(sid, pword):
    print("ユーザーログイン実装中")
    return sign_in_user_to_db(sid, pword)

def sign_out_user(sid, pword):
    print("ユーザーログアウト未実装")
    return sign_out_user_to_db(sid, pword)
