# 2026-teamD
.env
    環境変数
    
main.py
    FastAPI
        サーバの起動
        フロントエンドからのアクセス許可する設定
        各APIのルーティング設定（/routers）
    (uvicorn)

database.py
    Supabase
        データベースの初期化
        随時更新
        
/services/
    gemini
        クライアントの初期化
        フロントから届いた文章をAPIに送信して返答
        routers/chat.pyから呼び出し
    qrcode
        QRコードの生成
        OpenCVの処理でQRコード読み取り
    (gTTS)
        音声合成

routers/
    chat.py
        フロントエンドからのリクエストを受け取り、geminiサービスに送信
        geminiサービスからの返答をフロントエンドに返す

geminiAPIはGemini 2.5 Flash-Lite または　Gemini 2.5 Flashを使用
共に無料
Gemini 2.5 Flash-Lite   大量のタスクや簡単なチャット向き    30回 / 分、1,500回 / 日
Gemini 2.5 Flash        スピードと賢さのバランスが抜群      15回 / 分、1,500回 / 日
無料枠で送信したプロンプトや回答データは、Googleのサービス改善（AIの学習など）に利用される可能性があります。個人情報や会社の機密情報などは絶対に入力しないようにしてください。（有料プランに切り替えると学習には使われなくなります）
https://ai.google.dev/gemini-api/docs/models?hl=ja&_gl=1*1yxapu7*_up*MQ..*_ga*MTg3OTE0MjM2LjE3ODMzOTI2NzQ.*_ga_P1DBVKWT6V*czE3ODMzOTI2NzMkbzEkZzAkdDE3ODMzOTI2NzMkajYwJGwwJGgyNjYzNjcxNDE.