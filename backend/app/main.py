from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

#別ファイル関数
from database import init_database
from routers.auth import sign_up_user, sign_in_user, sign_out_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- サーバー起動時の処理 ----
    print("サーバー起動とDB初期化")
    print("未実装")
    init_database()
    
    yield  # ここでサーバーが起動し、リクエストを待ち受けます
    
    # ---- サーバー終了時の処理（あればここに書く） ----
    print("[LOG] サーバーを停止します")

# lifespanをFastAPIに登録
app = FastAPI(lifespan=lifespan)



app.add_middleware(
    #後々変更
    CORSMiddleware,
    #どのサイトからのアクセスを許すか
    allow_origins=["*"],
    #クッキーやログイン情報などの送信を許すか
    allow_credentials=True,
    #どんな操作（取得、追加、削除など）を許すか
    allow_methods=["*"],
    #どんな情報（ヘッダー）の送信を許すか
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI Server is running!"}

@app.post("/login")
def handle_login(data: dict):
    print(f"[LOG] ログインリクエストを受信: {data.get('email')}")
    return sign_in_user(data.get("email"), data.get("password"))


# main.py の一番最後に追加

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)