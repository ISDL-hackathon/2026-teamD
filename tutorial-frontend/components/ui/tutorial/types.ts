// types.ts
export type AppStep = 
  | 'TITLE'
  | 'AUTH_SELECT'
  | 'REGISTER'
  | 'TUTORIAL_BEFORE_GACHA' // ガチャ前の会話
  | 'GACHA'                 // ガチャ画面（募集）
  | 'GACHA_PULLING'         // ガチャ演出中
  | 'TUTORIAL_AFTER_GACHA';  // ガチャ後の会話・結果確認

export type UserData = {
  user_id: string;
  name: string;
  grade: string; // 'U4' | 'M1' | 'M2'
};