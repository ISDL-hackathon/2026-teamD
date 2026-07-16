from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
import os

# ルーター定義
router = APIRouter(prefix="/auth", tags=["auth"])

# 💡 本来は環境変数から取得します
SUPABASE_URL = os.getenv("SUPABASE_URL", "あなたのSupabaseのURL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "あなたのSupabaseのAnonKey")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- 1. リクエストを受け取るためのスキーマ設計 ---
class LoginRequest(BaseModel):
    email: EmailStr  # メアドの形式チェックをしてくれます（必要なら str に変更してもOK）
    password: str

# --- 2. ログイン & トークンコンソール出力エンドポイント ---
@router.post("/login-test")
def login_and_print_token(request_data: LoginRequest):
    print("\n--- [Login API Called] ---")
    print(f"入力されたメアド: {request_data.email}")
    
    try:
        # SupabaseのAuthを使って、メアド・パスワード認証を実行
        response = supabase.auth.sign_in_with_password({
            "email": request_data.email,
            "password": request_data.password
        })
        
        session = response.session
        if not session:
            raise HTTPException(status_code=400, detail="セッションの取得に失敗しました。")
            
        # トークンの取り出し
        access_token = session.access_token
        
        # 🌟 【ここがご希望の処理！】コンソールにデカデカと出力します
        print("=" * 60)
        print("🔑 取得したアクセストークン（JWT）はこちらです：")
        print(access_token)
        print("=" * 60)
        
        # フロントエンドにもレスポンスとしてトークンを返す
        return {
            "status": "success",
            "message": "ログイン成功！トークンはコンソールにも出力されています。",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
        
    except Exception as e:
        print(f"❌ ログインエラー発生: {e}")
        raise HTTPException(
            status_code=400, 
            detail=f"ログインに失敗しました。メアドまたはパスワードを確認してください。エラー詳細: {e}"
        )