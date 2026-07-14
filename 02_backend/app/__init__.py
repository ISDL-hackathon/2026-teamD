import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_KEY: str = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Supabaseの環境変数が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)