import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .env ファイルから環境変数を読み込む
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 本番用のSupabaseクライアント
supabase: Client = None

def init_database():
    """データベースの接続テストを行う関数"""
    global supabase
    print("🔌 Supabase に接続中...")
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("⚠️ 警告: .env に SUPABASE_URL または SUPABASE_KEY が設定されていません。")
        print("まずはテスト用としてダミーで初期化します。")
        # 本番時は .env を用意すれば自動で繋がります
        return False

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase との接続に成功しました！")
        return True
    except Exception as e:
        print(f"❌ Supabase 接続エラー: {e}")
        return False