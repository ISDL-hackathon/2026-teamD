import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

SUPABASE_URL_old: str = os.environ.get("SUPABASE_URL_old")
SUPABASE_KEY_old: str = os.environ.get("SUPABASE_KEY_old")
print("URL =", SUPABASE_URL)
print("KEY =", SUPABASE_KEY[:10] if SUPABASE_KEY else None)
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabaseの環境変数が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
supabase_old: Client = create_client(SUPABASE_URL_old, SUPABASE_KEY_old)
