'use client';

import { useRouter } from 'next/navigation';

export default function CompletePage() {
  const router = useRouter();

  const handleGoHome = () => {
    // 💡 プロジェクトのホーム画面（例: '/checkin' や '/dashboard'）に合わせて変更してください
    router.push('/dashboard'); 
  };

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
      <h1 style={{ 
        fontSize: '32px', 
        color: '#ff8c00', 
        marginBottom: '20px', 
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        fontWeight: 'bold'
      }}>
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
        <p style={{ fontSize: '16px', color: '#1f3b4d', lineHeight: '1.6' }}>
          新しいGBを獲得しました！<br/>
          <span style={{ fontSize: '14px', color: '#666' }}>
            (同級生なら32GB、他学年なら16GB)
          </span>
        </p>
      </div>

      {/* 🏠 ホームへ戻るボタン */}
      <button
        onClick={handleGoHome}
        style={{
          width: '200px', 
          height: '60px',
          borderRadius: '30px',
          backgroundColor: '#1f3b4d',
          color: 'white',
          fontSize: '18px', 
          fontWeight: 'bold',
          border: 'none', 
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          transition: 'transform 0.1s ease',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        ホームに戻る
      </button>
    </div>
  );
}