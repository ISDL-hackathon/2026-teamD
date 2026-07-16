'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// 📸 QRスキャナーと生成器をインポート
import { Scanner } from '@yudiel/react-qr-scanner';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../../auth/api'; // 👈 パスを合わせてインポート

export default function ConversationPage() {
  const router = useRouter();
  
  // 💡 モード管理に 'input_answer' (回答入力) を追加しました！
  const [mode, setMode] = useState<'select' | 'show_qr' | 'scan_qr' | 'input_answer'>('select');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 💬 Geminiから動的に取得する質問を管理するステート
  const [missionQuestion, setMissionQuestion] = useState<string>('ミッションを生成中...');

  // ✍️ ユーザーが入る回答テキストを管理するステート
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myGrade = 'B1';   // 自分の学年（仮）
  const missionId = 42;   // 現在のミッションID（仮）

  // 💡 自分のQRコードには、最新仕様（grade, mission_idのみ）のJSONを埋め込みます
  const myQrData = JSON.stringify({
    grade: myGrade,
    mission_id: missionId
  });

  // 🌟 画面表示時にバックエンドからGeminiのお題（質問）を取得する処理
  useEffect(() => {
    const fetchMission = async () => {
      try {
        const response = await api.post('/staying/conversation');
        console.log("🤖 Geminiミッション取得結果:", response.data);
        
        if (typeof response.data === 'string') {
          setMissionQuestion(response.data);
        } else if (response.data && response.data.message) {
          setMissionQuestion(response.data.message);
        } else {
          setMissionQuestion('ミッションを取得できませんでした。');
        }
      } catch (error) {
        console.error("❌ Geminiミッション取得失敗:", error);
        setMissionQuestion('ミッションの取得に失敗しました。');
      }
    };

    fetchMission();
  }, []);

  // 📸 相手のQRコードを読み取った時の処理
  const handleScanSuccess = async (text: string) => {
    try {
      let qrData: any;
      
      try {
        qrData = JSON.parse(text);
      } catch (parseError) {
        console.error("❌ QRデータのパースに失敗しました。生テキスト:", text);
        setErrorMessage('読み取ったQRコードのデータ形式が正しくありません。');
        setMode('select');
        return; 
      }

      const payload = {
        grade: String(qrData.grade),           
        mission_id: Number(qrData.mission_id)  
      };

      console.log("🚀 [DEBUG] サーバーに送るデータ（トークンはヘッダーに自動付与）:", payload);

      const response = await api.post('/qr/scanQR', payload);

      if (response.status === 200 || response.data) {
        // 🌟 画面遷移(router.push)ではなく、同じ画面の中で「入力モード」へ切り替える！
        setMode('input_answer'); 
      } else {
        setErrorMessage('不正なQRコードか、ミッションの対象外の相手です。');
        setMode('select');
      }
    } catch (error: any) {
      console.error("❌ [ERROR] スキャン処理失敗:", error);
      setErrorMessage(
        error.response?.data?.message || '通信エラーまたは不正なデータ形式です。'
      );
      setMode('select');
    }
  };

  // ✍️ 回答を送信する処理（バックエンドの /staying/input を呼ぶ）
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setErrorMessage('回答を入力してください！');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      // バックエンド側の仕様に合わせてデータを送信
      const response = await api.post('/staying/input', {
        answer: answer
      });

      if (response.data) {
        alert('🎉 ミッション完了！GBが追加されました！');
        router.push('/dashboard'); // 終わったらホームに戻る
      }
    } catch (error: any) {
      console.error("❌ 回答送信失敗:", error);
      setErrorMessage('回答の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 'url(/stay4.png)', 
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'sans-serif', color: '#333'
    }}>
      {/* 全体を覆う半透明の白いカード */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%', width: '90%', height: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '20px',
        padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* 📝 Geminiからのお題表示エリア */}
        <div style={{ backgroundColor: '#e8f0fe', padding: '16px', borderRadius: '12px', width: '100%', marginBottom: '24px', textAlign: 'center', border: '1px solid #1a73e8' }}>
          <span style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 Geminiからのミッション</span>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1f3b4d' }}>
            {missionQuestion}
          </p>
        </div>

        {errorMessage && (
          <p style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {errorMessage}</p>
        )}

        {/* ーーー モードごとの画面表示 ーーー */}

        {/* 1️⃣ 選択画面 */}
        {mode === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', marginTop: '40px' }}>
            <button
              onClick={() => setMode('show_qr')}
              style={{ padding: '20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#34a853', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              🪪 自分のQRコードを表示する
            </button>

            <button
              onClick={() => setMode('scan_qr')}
              style={{ padding: '20px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            >
              📸 相手のQRコードを読み取る
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              style={{ padding: '12px', fontSize: '14px', backgroundColor: '#fff', color: '#5f6368', border: '1px solid #dadce0', borderRadius: '8px', cursor: 'pointer', marginTop: '40px' }}
            >
              ← ホームに戻る
            </button>
          </div>
        )}

        {/* 2️⃣ 自分のQRコード表示モード */}
        {mode === 'show_qr' && (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '20px' }}>相手にこのQRコードを読み取ってもらってください</p>
            <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              <QRCodeSVG value={myQrData} size={200} />
            </div>
            <div className="mt-4">
              <button
                onClick={() => setMode('select')}
                style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#5f6368', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '30px' }}
              >
                戻る
              </button>
            </div>
          </div>
        )}

        {/* 3️⃣ 相手のQRコードスキャンモード */}
        {mode === 'scan_qr' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <p style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px' }}>相手のQRコードを枠内に収めてください</p>
            <div style={{ width: '260px', height: '260px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              <Scanner
                onScan={(detectedCodes) => {
                  if (detectedCodes.length > 0) {
                    handleScanSuccess(detectedCodes[0].rawValue);
                  }
                }}
                onError={(error: any) => console.log(error?.message)}
              />
            </div>

            <button
              onClick={() => setMode('select')}
              style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#5f6368', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}
            >
              キャンセル
            </button>
          </div>
        )}

        {/* 4️⃣ 🎉 【新規追加】答え入力モード */}
        {mode === 'input_answer' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', color: '#34a853', marginBottom: '8px', fontWeight: 'bold' }}>🎉 スキャン成功！</h3>
            <p style={{ fontSize: '13px', color: '#5f6368', textAlign: 'center', marginBottom: '16px' }}>
              リアルで話した内容や感想を入力して、GBをゲットしましょう！
            </p>
            
            <form onSubmit={handleAnswerSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="会話の答えや感想を入力してください..."
                rows={4}
                style={{
                  width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #dadce0',
                  fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box'
                }}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '16px', fontSize: '16px', fontWeight: 'bold',
                  backgroundColor: '#34a853', color: 'white', border: 'none',
                  borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                {isSubmitting ? '送信中...' : '🎁 回答を送信してGBを貰う'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
    );
}