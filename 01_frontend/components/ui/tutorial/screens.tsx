"use client";

import React, { useState } from 'react';

// ==========================================
// 📄 1. タイトル画面 (TitleScreen) - 透明ボタン版
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
      {/* 💥 タップ時のフラッシュ演出エフェクト */}
      {effect && (
        <div className="absolute inset-0 bg-white/20 animate-ping pointer-events-none z-50" />
      )}

      {/* 🗺️ 画像内の「新規登録」「ログイン」の箱の上にぴったり重ねる透明なコンテナ
        下からの位置（bottom）や高さ（h-24など）は、ブラウザを見ながら微調整してください！
      */}
      <div className="absolute bottom-[12%] left-0 w-full px-6 flex gap-4 h-20 z-10">
        
        {/* 左側：新規登録用の透明ボタン */}
        <button 
          onClick={() => handleTap(onRegisterClick)}
          className="flex-1 bg-transparent border-0 opacity-0 cursor-pointer active:bg-white/10 active:opacity-100 transition-all rounded-2xl"
          aria-label="新規登録"
        />
        
        {/* 右側：ログイン用の透明ボタン */}
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
  onRegisterSuccess: (userId: number, name: string, grade: string) => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  // 🎓 初期値を「学部4年」に変更
  const [grade, setGrade] = useState('学部4年');
  const [isLoading, setIsLoading] = useState(false);

  const giftTutorialGB = async (userId: number) => {
    try {
      console.log(`📡 チュートリアルGB配布API呼び出し... UID: ${userId}`);
      const res = await fetch('http://localhost:8000/gb/gb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId })
      });
      if (res.ok) console.log("🎁 GB配布成功！");
    } catch (error) {
      console.error("GB配布通信失敗:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password || !name) {
      alert("全項目を入力してください！");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, grade, sid: studentId, pword: password })
      });
      
      if (res.ok) {
        const data = await res.json();
        console.log("📡 ユーザー登録成功:", data);
        const userId = data.user_id || 1;
        
        await giftTutorialGB(userId);
        alert("アカウント登録 ＆ 16GBの付与に成功しました！");
        onRegisterSuccess(userId, name, grade);
      } else {
        alert("登録失敗: サーバー側でエラーが発生しました。");
      }
    } catch (error) {
      console.error("通信エラー:", error);
      alert("バックエンドサーバーに接続できません。");
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
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">学籍番号</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-500 text-white font-mono text-sm" placeholder="例: 12345678" />
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
            {/* 🎓 要望通り、選択肢を3つに修正 */}
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
// 📄 3. ログイン画面 (LoginScreen) 🌟 新設！
// ==========================================
export function LoginScreen({
  onLoginSuccess
}: {
  onLoginSuccess: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 📄 Screens.tsx 内の LoginScreen の中身

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!studentId || !password) {
    alert("学籍番号とパスワードを入力してください！");
    return;
  }
  setIsLoading(true);
  try {
    // ❌ 修正前: fetch('http://localhost:8000/auth/login', {
    // ⭕ 修正後: バックエンドの「/signin」に名前を合わせる！
    const res = await fetch('http://localhost:8000/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: studentId, pword: password })
    });

    if (res.ok) {
      const data = await res.json();
      console.log("📡 ログイン成功:", data);
      
      // ⚠️ 【おまけの超重要チェック！】
      // もしパスワードが違っても、バックエンドは「200 OK」のまま 
      // {"status": "error", "message": "..."} を返してくるコードになっているので、
      // ここでそれを受け止められるようにしておくと完璧です！
      if (data.status === "error") {
        alert(data.message); // 「学生番号かパスワードが違います」と表示
        return;
      }

      alert("ログインしました！");
      onLoginSuccess();
    } else {
      alert("サーバーエラーが発生しました。");
    }
  } catch (error) {
    console.error("通信エラー:", error);
    alert("バックエンドサーバーに接続できません。");
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
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">学籍番号</label>
            <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-white font-mono text-sm" placeholder="例: 12345678" />
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