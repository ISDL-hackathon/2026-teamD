import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .envの読み込み
load_dotenv()

SUPABASE_URL: str = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY")

SUPABASE_URL_old: str = os.environ.get("SUPABASE_URL_old")
SUPABASE_ANON_KEY_old: str = os.environ.get("SUPABASE_ANON_KEY_old")


if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("Supabase_newの環境変数が設定されていません。")

if not SUPABASE_URL_old or not SUPABASE_ANON_KEY_old:
    print("Supabase_oldの環境変数が設定されていません。")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_old: Client = create_client(SUPABASE_URL_old, SUPABASE_ANON_KEY_old)

