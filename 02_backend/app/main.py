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
    login,
)
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("サーバー起動とDB初期化")
    yield  # ここでサーバーが起動し、リクエストを待ち受けます
    
    
    # ---- サーバー終了時の処理（あればここに書く） ----
    print("[LOG] サーバーを停止します")

# lifespanをFastAPIに登録
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://2026-team-d.vercel.app",
    ],
    allow_origin_regex=(
        r"^https://2026-team-[a-z0-9-]+-"
        r"sukkitis-projects\.vercel\.app$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
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
app.include_router(login.router)


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
