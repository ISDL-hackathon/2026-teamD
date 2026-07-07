import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("auth, 環境変数が設定されていません。")

def sign_up_user(name, grade, sid, pword):
    print("ユーザー登録")
    print("未実装")

def sign_in_user(sid, pword):
    print("ユーザーログイン")
    print("未実装")

def sign_out_user(sid, pword):
    print("ユーザーログアウト")
    print("未実装")