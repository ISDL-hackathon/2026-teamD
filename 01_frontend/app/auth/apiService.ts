// app/auth/apiService.ts
import { api } from './api';

// ==========================================
// 🧑‍💻 キャラクター関連 (Character API)
// ==========================================
export const characterService = {
  /** 所持キャラクター一覧取得 (Bodyなし) */
  getOwned: async () => {
    const res = await api.post('/character/owned');
    return res.data;
  },

  /** キャラクター詳細プロフィール取得 (Body: cid) */
  getProfile: async (cid: number) => {
    const res = await api.post('/character/profile', { cid });
    return res.data;
  },

  /** ホーム画面用のキャラクター設定 (Body: cid) */
  setHomeCharacter: async (cid: number) => {
    const res = await api.post('/character/home-character', { cid });
    return res.data;
  },
};

// ==========================================
// 💬 研究室滞在関連 (Staying API)
// ==========================================
export const stayingService = {
  /** 滞在中の会話履歴の取得 (Bodyなし) */
  getConversation: async () => {
    const res = await api.post('/staying/conversation');
    return res.data;
  },

  /** 会話の入力/送信 (Bodyなし ※要件通り。必要ならテキストを引数に) */
  sendInput: async () => {
    const res = await api.post('/staying/input');
    return res.data;
  },

  /** 滞在開始 (Bodyなし) */
  startStaying: async () => {
    const res = await api.post('/staying/start');
    return res.data;
  },

  /** 滞在終了 (Bodyなし) */
  endStaying: async () => {
    const res = await api.post('/staying/end');
    return res.data;
  },
};

// ==========================================
// 🎰 ガチャ関連 (Gacha API)
// ==========================================
export const gachaService = {
  /** チュートリアルガチャ (Bodyなし) */
  drawTutorial: async () => {
    const res = await api.post('/gacha/tutorial');
    return res.data;
  },

  /** 通常ガチャを引く (Body: cnt) */
  draw: async (cnt: number) => {
    const res = await api.post('/gacha/draw', { cnt });
    return res.data;
  },
};

// ==========================================
// 💰 通貨・GB関連 (GB API)
// ==========================================
export const gbService = {
  /** 現在のGB残高などの情報取得 (Bodyなし) */
  getGbInfo: async () => {
    const res = await api.get('/users/me');
    // レスポンスの user の中身を、直下の階層に展開して返す
    return {
      ...res.data.user, // uid, name, grade, gb がすべて直下に入ります
      status: res.data.status
    };
  },
};

// ==========================================
// 🔍 QRコード/ミッション関連 (QR API)
// ==========================================
export const qrService = {
  /** QR認証（学籍番号などの情報入力） (Body: 必要なら任意の内容) */
  enter: async (content?: any) => {
    const res = await api.post('/qr/enter', content ? { content } : {});
    return res.data;
  },

  /** QRコード表示用データ取得 (Bodyなし) */
  showQR: async () => {
    const res = await api.post('/qr/showQR');
    return res.data;
  },

  /** QRコードスキャン成功時の処理 (Body: grade, mission_id) */
  scanQR: async (grade: string, missionId: number) => {
    const res = await api.post('/qr/scanQR', {
      grade,
      mission_id: missionId,
    });
    return res.data;
  },
};

// ==========================================
// 🤝 キャラクター交換関連 (Trading API)
// ==========================================
export const tradingService = {
  /** 交換用のQR表示用データ取得 (Bodyなし) */
  showQR: async () => {
    const res = await api.post('/trading/showQR');
    return res.data;
  },

  /** 相手の交換QRコードのスキャン (Body: trade_id) */
  scanQR: async (tradeId: string) => {
    const res = await api.post('/trading/scanQR', { trade_id: tradeId });
    return res.data;
  },

  /** 交換申請の承認/拒否 (Body: trade_id, flag) */
  allowTrade: async (tradeId: string, flag: boolean) => {
    const res = await api.post('/trading/allow', {
      trade_id: tradeId,
      flag,
    });
    return res.data;
  },

  /** 交換の選択肢や状況取得 (Bodyなし) */
  selectTrade: async () => {
    const res = await api.post('/trading/select');
    return res.data;
  },

  /** 特定キャラクターを交換対象に設定 (Body: cid) */
  tradeCharacter: async (cid: number) => {
    const res = await api.post('/trading/trade', { cid });
    return res.data;
  },

  /** 交換の最終完了処理 (Bodyなし) */
  completeTrade: async () => {
    const res = await api.post('/trading/complete');
    return res.data;
  },

  /** 交換で獲得したGBなどの反映 (Bodyなし) */
  tradeGb: async () => {
    const res = await api.post('/trading/gb');
    return res.data;
  },
};