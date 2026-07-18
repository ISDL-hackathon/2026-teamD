# 2026-teamD

# ISDL
  ## トモラボ
  
## 研究室の対面コミュニケーションとモチベーション向上を支援するフルスタックWebアプリケーションです。
## データ通信量（所持GB）のリアルタイム同期、研究室メンバーをモチーフにしたキャラクターガチャ、Gemini AIによる対話チャット、QRコード連携など、研究室生活をより楽しく・便利にする機能を提供します。`

# 1, 主な機能
## 🚀 主な機能

| 機能 | 説明 |
|------|------|
| 📡 データ通信量同期 | 研究室全体のGB使用状況をダッシュボードで可視化 |
| 🎲 キャラクターガチャ | メンバーをモチーフにした限定キャラクターを収集 |
| 🤖 Gemini AIチャット | Gemini APIを利用したリアルタイムAIチャット |
| 📷 QRコード生成・読取 | QRコードを用いた対面での連携・キャラクター交換 |
| 🔐 ログイン・認証 | Supabase Authenticationによるユーザー認証 |
| 🎵 音声演出 | Web Audio APIを利用したBGM・ボイス再生 |

## 🛠️ 技術スタック

| 分類 | 使用技術 |
|------|----------|
| Frontend | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Backend | FastAPI, Uvicorn |
| Database | Supabase (PostgreSQL) |
| AI / Computer Vision | Gemini API, OpenCV |
| HTTP Client | Axios |
| Audio | Web Audio API |

## 📂 ディレクトリ構成
2026-TEAMD/
├── 00_docs/ # 設計書・ドキュメント類
│
├── 01_frontend/ # フロントエンド（Next.js）
│ ├── app/
│ │ ├── auth/
│ │ │ └── api.ts # Axios設定・認証インターセプター
│ │ ├── dashboard/ # ダッシュボード画面
│ │ └── main/ # メイン画面
│ │
│ ├── components/ # 共通UIコンポーネント
│ ├── public/ # 画像・音声・動画アセット
│ └── .env.local # フロントエンド環境変数
│
└── 02_backend/ # バックエンド（FastAPI）
├── app/
│ ├── main.py # FastAPI起動・CORS設定
│ ├── routers/ # APIルーティング定義
│ ├── cruds/ # データベース操作（CRUD）
│ ├── gemini.py # Gemini API連携ロジック
│ └── qrcode.py # QRコード生成・読み取り処理
│
├── qr_img/ # 生成したQRコード画像の保存先
└── .env # バックエンド環境変数

## 🚀 セットアップ

リポジトリをクローンし、バックエンドとフロントエンドを**それぞれ別ターミナル**で起動してください。

### 1. リポジトリをクローン

```bash
git clone https://github.com/ISDL-hackathon/2026-teamD.git
cd 2026-teamD
```

---

## ⚙️ バックエンド起動 (`02_backend`)

### ディレクトリへ移動

```bash
cd 02_backend
```

### 環境変数を設定

`.env.example` をコピーして `.env` を作成します。

```bash
cp .env.example .env
```

`.env` に以下の値を設定してください。

```env
SUPABASE_URL=xxxxxxxxxxxxxxxx
SUPABASE_KEY=xxxxxxxxxxxxxxxx
GEMINI_API_KEY=xxxxxxxxxxxxxxxx
```

### 依存ライブラリをインストール

```bash
pip install -r requirements.txt
```

### バックエンドを起動

```bash
uvicorn app.main:app --reload --port 8000
```

### API仕様書（Swagger UI）

ブラウザで以下にアクセスしてください。

```
http://localhost:8000/docs
```

---

## 💻 フロントエンド起動 (`01_frontend`)

### ディレクトリへ移動

```bash
cd 01_frontend
```

### 環境変数を設定

`.env.example` をコピーして `.env.local` を作成します。

```bash
cp .env.example .env.local
```

`.env.local` の例

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### パッケージをインストール

```bash
npm install
```

### 開発サーバーを起動

```bash
npm run dev
```

### ブラウザでアクセス

```
http://localhost:3000
```

---

## 🌱 Git運用ルール

### ブランチ命名規則

新しいブランチは、**最新の `dev` ブランチ**から作成してください。

| 種類 | 命名規則 | 例 |
|------|----------|----|
| 新機能 | `feature/機能名` | `feature/tutorial-voice` |
| バグ修正 | `fix/イニシャル-修正内容` | `fix/f-typofix` |
| ドキュメント | `docs/内容` | `docs/readme-update` |
| リファクタリング | `refactor/内容` | `refactor/auth-api` |

---

## 🔀 Pull Request（PR）ルール

PRを作成する前に、必ず動作確認とビルドを行ってください。

### フロントエンド

```bash
npm run build
```

### バックエンド

起動エラーがないことを確認してください。

```bash
uvicorn app.main:app --reload
```

### チェックリスト

- [ ] 最新の `dev` ブランチを取り込んでいる
- [ ] コンフリクトが解消されている
- [ ] アプリが正常に起動する
- [ ] ビルドが成功する
- [ ] 不要なログ・デバッグコードを削除している

### ⚠️ 注意事項
[!WARNING]
以下のファイルにはAPIキーや認証情報が含まれるため、絶対にGitHubへPushしないでください。
02_backend/.env
01_frontend/.env.local
👥 Team D
ISDL Hackathon 2026 Team D
