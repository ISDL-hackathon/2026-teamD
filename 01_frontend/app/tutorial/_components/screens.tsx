// app/tutorial/_components/screens.tsx
"use client";

import React, { useState } from 'react';
import { api } from '../../auth/api';
import { supabase } from '../../auth/supabase';

// ==========================================
// 📄 1. タイトル画面 (TitleScreen)
// ==========================================
export default function TitleScreen({ 
  onRegisterClick, 
  onLoginClick 
}: { 
  onRegisterClick: () => void; 
  onLoginClick: () => void; 
 }) {
  const [effect, setEffect] = useState(false);

  const handleTap = (callback: () => void) => {
    setEffect(true);
    setTimeout(() => {
      setEffect(false);
      callback();
    }, 200);
  };

  return (
    <div 
      className="relative w-full h-full bg-black flex flex-col justify-end select-none"
      style={{
        backgroundImage: "url('/title.png')",
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh'
      }}
    >
      <div className="absolute bottom-[12%] left-0 w-full px-6 flex gap-4 h-20 z-10">
        <button 
          onClick={() => handleTap(onRegisterClick)}
          className="flex-1 bg-transparent border-0 opacity-0 cursor-pointer active:bg-white/10 active:opacity-100 transition-all rounded-2xl"
          aria-label="新規登録"
        />
        <button 
          onClick={() => handleTap(onLoginClick)}
          className="flex-1 bg-transparent border-0 opacity-0 cursor-pointer active:bg-white/10 active:opacity-100 transition-all rounded-2xl"
          aria-label="ログイン"
        />
      </div>
    </div>
  );
}

// ==========================================
// 📄 2. 新規登録画面 (RegisterScreen)
// ==========================================
export function RegisterScreen({
  onRegisterSuccess
}: {
  onRegisterSuccess: (name: string, grade: string) => void;
}) {
  // 🌟 学籍番号（studentId）をメールアドレス（email）に変更
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('学部4年');
  const [isLoading, setIsLoading] = useState(false);

  // GB付与 API
  const giftTutorialGB = async () => {
    try {
      console.log("📡 チュートリアルGB配布API呼び出し...");
      await api.post('/gb/tutorial');
      console.log("🎁 GB配布成功！");
    } catch (error) {
      console.error("GB配布通信失敗:", error);
    }
  };

 // 📄 app/tutorial/_components/screens.tsx の中の handleSubmit を以下に差し替え

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      alert("全項目を入力してください！");
      return;
    }
    setIsLoading(true);

    try {
      // 1. Supabase Auth でサインアップ
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            grade: grade,
            email: email
          }
        }
      });

      if (authError) {
        alert(`登録エラー: ${authError.message}`);
        return;
      }

      console.log("📡 Supabase サインアップ成功:", authData);

      // ==========================================
      // ❌ 【削除】 バックエンドの /auth/signup を叩く処理は消去しました
      // ==========================================
      
      localStorage.setItem('loginUid', String(email));
      
      // 2. 16GBの付与 (バックエンド)
      await giftTutorialGB();
      alert("アカウント登録 ＆ 16GBの付与に成功しました！");
      onRegisterSuccess(name, grade);

    } catch (error) {
      console.error("登録プロセス中にエラーが発生しました:", error);
      alert("接続に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm bg-slate-800/90 p-6 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
        <h2 className="text-2xl font-black text-center mb-6 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">新規ユーザー登録</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {/* 🌟 表示を「メールアドレス」に変更 */}
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" placeholder="example@gmail.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">お名前</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white text-sm" placeholder="例: 山田 太郎" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">学年</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white appearance-none text-sm">
              <option value="学部4年">学部4年</option>
              <option value="修士1年">修士1年</option>
              <option value="修士2年">修士2年</option>
            </select>
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 text-sm">
            {isLoading ? "登録中..." : "登録してストーリーへ"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 📄 3. ログイン画面 (LoginScreen)
// ==========================================
export function LoginScreen({
  onLoginSuccess
}: {
  onLoginSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("メールアドレスとパスワードを入力してください！");
      return;
    }
    setIsLoading(true);
    try {
      // 🌟 Supabaseでのサインイン
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(`ログイン失敗: ${error.message}`);
        return;
      }

      console.log("📡 Supabase ログイン成功:", data);
      
      localStorage.setItem('loginUid', String(email));
      alert("ログインしました！");

      // 🌟【重要修正】状態切り替えではなく、URLを直接書き換えてダッシュボードへ強制ジャンプ
      if (typeof window !== "undefined") {
        // あなたのアプリのダッシュボードのURLパスに合わせてください（例: "/dashboard"）
        window.location.href = "/dashboard"; 
      }
      
      // onLoginSuccess(); // 👈 古い遷移方法はコメントアウトします

    } catch (error) {
      console.error("通信エラー:", error);
      alert("サーバーに接続できません。");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col items-center justify-center p-6 text-white select-none">
      <div className="w-full max-w-sm bg-slate-800/90 p-6 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-md">
        <h2 className="text-2xl font-black text-center mb-6 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">ログイン</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">メールアドレス</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm" placeholder="example@gmail.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">パスワード</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white text-sm" placeholder="••••••••" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform active:scale-[0.98] transition-all disabled:opacity-50 text-sm">
            {isLoading ? "認証中..." : "ログインして本編へ"}
          </button>
        </form>
      </div>
    </div>
  );
}