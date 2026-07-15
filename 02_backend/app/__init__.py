import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY")
SUPABASE_ROLE_KEY: str = os.environ.get("SUPABASE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_ROLE_KEY:
    print("Supabase_anonの環境変数が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

if not SUPABASE_URL or not SUPABASE_ROLE_KEY:
    print("Supabase_roleの環境変数が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ROLE_KEY)