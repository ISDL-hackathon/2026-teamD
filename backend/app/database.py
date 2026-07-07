import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("database, 環境変数が設定されていません。")

def init_database():
    print("database初期化")
    print("未実装")
    return True

def insert_profile(name, grade, sid, pword):
    print("ユーザー保存")
    print("未実装")

def get_profile(uid):
    print("ユーザー取得")
    print("未実装")