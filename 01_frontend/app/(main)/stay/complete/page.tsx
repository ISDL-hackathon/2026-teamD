'use client';

import { useRouter } from 'next/navigation';

export default function CompletePage() {
  const router = useRouter();

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '400px',
      height: '100vh',
      margin: '0 auto',
      backgroundColor: '#fffae6', // 達成感のある明るい背景色
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'sans-serif',
      color: '#333'
    }}>
      {/* 🎊 タイトル */}
      <h1 style={{ fontSize: '32px', color: '#ff8c00', marginBottom: '20px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
        MISSION CLEAR!
      </h1>

      {/* 🎁 報酬情報 */}
      <div style={{
        backgroundColor: 'white',
        padding: '30px 20px',
        borderRadius: '15px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        textAlign: 'center',
        marginBottom: '40px',
        width: '80%'
      }}>
        <p style={{ fontSize: '18px', marginBottom: '15px', fontWeight: 'bold' }}>会話ミッション達成！</p>
        <p style={{ fontSize: '16px', color: '#1f3b4d' }}>
          新しいGBを獲得しました！<br/>
          (同級生なら32GB、他学年なら16GB)
        </p>
      </div>

      {/* 🏠 ホームへ戻るボタン */}
      <button
        onClick={() => router.push('/home')} // 💡 ホーム画面（checkin）のURLに合わせて変更してください
        style={{
          width: '200px', height: '60px',
          borderRadius: '30px',
          backgroundColor: '#1f3b4d',
          color: 'white',
          fontSize: '18px', fontWeight: 'bold',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
      >
        ホームに戻る
      </button>
    </div>
  );
}