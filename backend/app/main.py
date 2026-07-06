from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.chat import router as chat_router
# データベースの初期化関数をインポート
from database import init_database

app = FastAPI()

# サーバー起動時にデータベースの接続テストを走らせる
@app.on_event("startup")
def on_startup():
    init_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router)

@app.get("/")
def read_root():
    return {"message": "FastAPI Server is running!"}