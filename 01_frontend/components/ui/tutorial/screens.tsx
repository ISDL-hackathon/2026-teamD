import React, { useState } from 'react';

// --- タイトル画面（特定の場所のみクリック可能にする） ---
export const TitleScreen = ({ 
  onRegisterClick, 
  onLoginClick 
}: { 
  onRegisterClick: () => void; 
  onLoginClick: () => void; 
}) => {
  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#000'
      }}
    >
      {/* 📐 画像の元サイズ（960 × 1707）の比率を完全に固定するコンテナ。
        画面が小さくなっても、画像とクリック判定エリアが一緒に縮小するため絶対にズレません。
      */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        aspectRatio: '960 / 1707',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        
        {/* 背景画像（title.png） */}
        <img 
          src="/title.png" 
          alt="Title" 
          style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }}
          onError={() => alert("【エラー】public/title.png が見つかりません。")}
        />

        {/* 🟦 「新規登録」ボタンのクリック判定エリア 
          ※位置がズレている場合は、以下の4つの数値を微調整してください。
          ※ background を 'rgba(0, 0, 255, 0.3)' にすると、青い半透明の枠が出てきて調整しやすくなります。
        */}
        <button
          onClick={onRegisterClick}
          style={{
            position: 'absolute',
            left: '8%',          // 左端からの位置（全体の何%目か）
            top: '76%',          // 上端からの位置（全体の何%目か）
            width: '38%',        // ボックスの横幅
            height: '11%',       // ボックスの縦幅
            background: 'rgba(0, 0, 255, 0)', // 完全に透明（デバッグ時は 0.3 に変更）
            border: 'none',
            borderRadius: '16px', // 画像の角丸に合わせる
            cursor: 'pointer',
            zIndex: 10
          }}
        />

        {/* 🟧 「ログイン」ボタンのクリック判定エリア 
          ※ background を 'rgba(255, 165, 0, 0.3)' にすると、オレンジの半透明の枠が出ます。
        */}
        <button
          onClick={onLoginClick}
          style={{
            position: 'absolute',
            right: '8%',         // 右端からの位置
            top: '76%',          // 上端からの位置
            width: '38%',        // ボックスの横幅
            height: '11%',       // ボックスの縦幅
            background: 'rgba(255, 165, 0, 0)', // 完全に透明（デバッグ時は 0.3 に変更）
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            zIndex: 10
          }}
        />
      </div>
    </div>
  );
};

// --- 新規登録画面（モック版） ---
export const RegisterScreen = ({ onRegisterSuccess }: { onRegisterSuccess: (userId: string, name: string, grade: string) => void }) => {
  const [student_id, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('U4');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dummyUserId = `usr_demo_${Math.floor(Math.random() * 10000)}`;
    onRegisterSuccess(dummyUserId, name, grade);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#111', padding: '20px', boxSizing: 'border-box' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '320px', background: 'rgba(255,255,255,0.1)', padding: '25px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)' }}>
        <h3 style={{ color: '#fff', textAlign: 'center', margin: '0 0 10px 0', fontSize: '1.3rem' }}>新規アカウント登録 (デモ)</h3>
        
        <input placeholder="学籍番号" value={student_id} onChange={e => setStudentId(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#fff', color: '#000' }} />
        <input placeholder="パスワード" type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#fff', color: '#000' }} />
        <input placeholder="名前" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '12px', borderRadius: '6px', border: 'none', background: '#fff', color: '#000' }} />
        
        <select value={grade} onChange={e => setGrade(e.target.value)} style={{ padding: '12px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#fff', color: '#000' }}>
          <option value="U4">U4 (学部4年)</option>
          <option value="M1">M1 (修士1年)</option>
          <option value="M2">M2 (修士2年)</option>
        </select>

        <button type="submit" style={{ padding: '15px', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontSize: '1.1rem' }}>
          登録してチュートリアルへ
        </button>
      </form>
    </div>
  );
};