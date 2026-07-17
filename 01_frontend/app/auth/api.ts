// app/auth/api.ts
import axios, { InternalAxiosRequestConfig, AxiosError } from 'axios';
import { supabase } from './supabase';

// バックエンドのURL（環境変数から取得、なければローカルの8000番）
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========================================================
// 📡 1. リクエストインターセプター (通信を送信する前の自動処理)
// ========================================================
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    try {
      // Supabaseのセッションから最新のアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // バックエンドに「Bearer トークン」の形で認証情報を送りつける
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log("🔑 [Axios] Authorizationヘッダーにトークンをセットしました");
      } else {
        console.warn("⚠️ [Axios] ログインセッションが見つからないため、トークンなしで通信します");
      }
    } catch (err) {
      console.error('❌ [Axios] トークン取得エラー:', err);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ========================================================
// 📥 2. レスポンスインターセプター (通信が返ってきた後の自動処理)
// ========================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // バックエンドから 「401 Unauthorized (認証エラー)」 が返ってきた場合
    if (error.response?.status === 401) {
      console.warn("🚨 セッションの有効期限が切れました。再ログインしてください。");
      
     // if (typeof window !== "undefined") {
      //  localStorage.clear(); // 古いキャッシュ情報を一掃
        
        // ログイン画面（/tutorial）へ強制リダイレクト
      //  window.location.href = "/tutorial"; 
     // }
    }
    return Promise.reject(error);
  }
);