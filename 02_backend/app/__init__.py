import os

from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")

# ログインやアクセストークン確認に使用する低権限キー
SUPABASE_PUBLISHABLE_KEY = (
    os.environ.get("SUPABASE_PUBLISHABLE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
)

# DB操作専用。Render以外には絶対に設定しない
SUPABASE_SECRET_KEY = (
    os.environ.get("SUPABASE_SECRET_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

missing_variables = [
    name
    for name, value in {
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_PUBLISHABLE_KEY": SUPABASE_PUBLISHABLE_KEY,
        "SUPABASE_SECRET_KEY": SUPABASE_SECRET_KEY,
    }.items()
    if not value
]

if missing_variables:
    raise RuntimeError(
        "Supabase環境変数が不足しています: "
        + ", ".join(missing_variables)
    )

# CRUD専用。Secret Keyを使うためRLSをバイパスする
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
)

# ログイン・アクセストークン確認専用
supabase_auth: Client = create_client(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
)