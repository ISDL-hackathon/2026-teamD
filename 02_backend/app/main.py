from . import SUPABASE_URL, SUPABASE_ANON_KEY
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager

from app.routers import (
    character,
    gatya,
    staying,
    conversation,
    users,
    qr,
    gb,
    trade,
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("サーバー起動とDB初期化")
    yield  # ここでサーバーが起動し、リクエストを待ち受けます
    
    
    # ---- サーバー終了時の処理（あればここに書く） ----
    print("[LOG] サーバーを停止します")

# lifespanをFastAPIに登録
app = FastAPI(lifespan=lifespan)



# app.add_middleware(
#     #後々変更
#     CORSMiddleware,
#     #どのサイトからのアクセスを許すか
#     allow_origins=["*"],
#     #クッキーやログイン情報などの送信を許すか
#     allow_credentials=True,
#     #どんな操作（取得、追加、削除など）を許すか
#     allow_methods=["*"],
#     #どんな情報（ヘッダー）の送信を許すか
#     allow_headers=["*"],
# )

# ⭕️ 修正後の設定例
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # 必要に応じて、今後デプロイするフロントのURLもここに追加    ,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "FastAPI is running!"
    }

app.include_router(gatya.router)
app.include_router(users.router)
app.include_router(gb.router)
app.include_router(staying.router)
app.include_router(conversation.router)
app.include_router(qr.router)
app.include_router(character.router)
app.include_router(trade.router)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)