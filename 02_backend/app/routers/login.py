from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from app import supabase
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(request: LoginRequest):
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })

        if response.session is None:
            raise HTTPException(status_code=401, detail="ログイン失敗")

        return {
            "access_token": response.session.access_token,
            "refresh_token": response.session.refresh_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(type(e))
        print(e)
        raise HTTPException(status_code=401, detail=str(e))