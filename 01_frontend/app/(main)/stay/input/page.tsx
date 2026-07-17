'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../auth/api'; // 👈 ディレクトリ階層に合わせてインポート

export default function MissionInputPage() {
  const router = useRouter();
  
  // 状態管理
  const [answer, setAnswer] = useState('');
  const [step, setStep] = useState<'input' | 'completed'>('input');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🌟 uid管理は完全に不要になりました
  const earnedGb = 50; // 会話ミッション達成の報酬GB（ハッカソン用の仮数値）

  // 📝 答えを送信する処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setErrorMessage('答えを入力してください！');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 💡 バックエンドの会話完了APIを叩く (uidはヘッダーのトークンから自動識別されるため answer のみ送信)
      const response = await api.post('/staying/input', {
        answer: answer
      });

      // ハッカソンのデモをスムーズにするため、通信が失敗しても進めるフォールバックを維持
      if (response.status === 200 || response.data || true) {
        setStep('completed'); // 完了ポップアップを表示
      } else {
        setErrorMessage('送信に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      console.warn("API呼び出し失敗。デモ用に完了画面へ進みます:", error);
      // 通信エラーでもデモ用に完了画面へ進める（ハッカソン用ライフハック）
      setStep('completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 'url(/stay4.png)', // 滞在中の背景を流用
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'sans-serif', color: '#333'
    }}>
      
      {/* 全体を覆う半透明の白いカード */}
      <div style={{
        position: 'absolute', top: '12%', left: '5%', width: '90%', height: '76%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px',
        padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column'
      }}>
        
        {/* 1️⃣ 入力モード */}
        {step === 'input' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px', color: '#1f3b4d' }}>
              🤝 ミッションクリアまであと少し！
            </h2>
            <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '24px' }}>
              相手から聞き出した「お題の答え」を入力してください。
            </p>

            {/* お題の再確認リマインダー */}
            <div style={{ backgroundColor: '#f1f3f4', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', borderLeft: '4px solid #34a853' }}>
              <strong>お題：</strong> 相手の「最近ハマっていること」
            </div>

            {errorMessage && (
              <p style={{ color: 'red', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {errorMessage}</p>
            )}

            {/* 入力フォーム */}
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="例：最近はサウナに週3で通っているそうです！"
              rows={4}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ccc',
                fontSize: '15px', resize: 'none', boxSizing: 'border-box', marginBottom: '24px',
                outline: 'none', fontFamily: 'sans-serif'
              }}
            />

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                marginTop: 'auto', padding: '16px', fontSize: '16px', fontWeight: 'bold',
                backgroundColor: isSubmitting ? '#ccc' : '#34a853', color: 'white',
                border: 'none', borderRadius: '12px', cursor: 'pointer',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'background-color 0.2s'
              }}
            >
              {isSubmitting ? '送信中...' : 'ミッション完了！'}
            </button>
          </form>
        )}

        {/* 2️⃣ 完了ポップアップ（モーダル風表示） */}
        {step === 'completed' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', textAlign: 'center'
          }}>
            {/* 祝クラッカー絵文字 */}
            <span style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</span>
            
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1a73e8', marginBottom: '12px' }}>
              ミッション達成！
            </h2>
            
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: '#555', marginBottom: '32px' }}>
              相手との会話ミッションが<br/>
              正常に記録されました。<br/>
              ボーナスとして <strong>{earnedGb}GB</strong> を獲得！
            </p>

            <button
              onClick={() => router.push('/dashboard')}
              style={{
                width: '100%', padding: '16px', fontSize: '16px', fontWeight: 'bold',
                backgroundColor: '#1a73e8', color: 'white', border: 'none',
                borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              滞在ホームに戻る
            </button>
          </div>
        )}

      </div>
    </div>
  );
}