'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// 📸 QRスキャナーと生成器をインポート
import { Scanner } from '@yudiel/react-qr-scanner';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../../auth/api'; 

export default function ConversationPage() {
  const router = useRouter();
  
  const [mode, setMode] = useState<'select' | 'show_qr' | 'scan_qr' | 'input_answer'>('select');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 💬 Geminiから動的に取得する自分の質問（ミッション）を管理するステート
  const [missionQuestion, setMissionQuestion] = useState<string>('ミッションを生成中...');

  // 💬 スキャンした相手のミッション（質問）を管理するステート
  const [opponentMission, setOpponentMission] = useState<string>('');

  // ✍️ ユーザーが入る回答テキストを管理するステート
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myGrade = 'B1';   
  const missionId = 42;   

  const myQrData = JSON.stringify({
    grade: myGrade,
    mission_id: missionId
  });

  // 画面表示時にバックエンドからGeminiのお題を取得
  useEffect(() => {
    const fetchMission = async () => {
      try {
        const response = await api.post('/staying/conversation');
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

      console.log("🚀 [DEBUG] サーバーに送るデータ:", payload);

      const response = await api.post('/qr/scanQR', payload);

      if (response.status === 200 || response.data) {
        
        // 🌟【重要】「会話開始可能」など、お題ではないシステム文を弾くフィルタ
        const systemKeywords = ["会話開始可能", "成功", "success", "ok", "OK", "完了", "接続完了"];
        
        const candidates = [
          response.data.question,
          response.data.mission,
          response.data.opponent_mission,
          response.data.opponent_question,
          response.data.target_mission,
          response.data.message // messageは一番最後にチェック
        ];

        // システム的な定型メッセージではなく、お題として適した文字列を自動で選定
        let finalMissionText = "";
        for (const val of candidates) {
          if (val && typeof val === 'string' && !systemKeywords.includes(val.trim()) && val.trim().length > 0) {
            finalMissionText = val.trim();
            break;
          }
        }

        // 万が一、有効なお題テキストが一切取れなかった場合のフォールバック
        if (!finalMissionText) {
          finalMissionText = "相手の最近ハマっていることを聞き出してみよう！";
        }

        setOpponentMission(finalMissionText);
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

  // 回答を送信する処理
  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) {
      setErrorMessage('回答を入力してください！');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const response = await api.post('/staying/input', {
        answer: answer
      });

      if (response.data) {
        alert('🎉 ミッション完了！GBが追加されました！');
        router.push('/dashboard'); 
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
        
        {/* 📝 Geminiからのお題表示エリア（自分のミッション） */}
        <div style={{ backgroundColor: '#e8f0fe', padding: '16px', borderRadius: '12px', width: '100%', marginBottom: '24px', textAlign: 'center', border: '1px solid #1a73e8' }}>
          <span style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 あなたの現在のミッション</span>
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

        {/* 4️⃣ 🎉 答え入力モード */}
        {mode === 'input_answer' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', color: '#34a853', marginBottom: '8px', fontWeight: 'bold' }}>🎉 スキャン成功！</h3>
            
            <div style={{ 
              backgroundColor: '#fff9db', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              width: '100%', 
              marginBottom: '16px', 
              border: '1.5px solid #f59f00',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '11px', color: '#f59f00', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                🗣️ 相手に聞き出すお題
              </span>
              <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#1f3b4d', lineHeight: '1.4' }}>
                「{opponentMission}」
              </p>
            </div>

            <p style={{ fontSize: '12px', color: '#5f6368', textAlign: 'center', marginBottom: '16px' }}>
              相手に上の質問を聞いてみて、その答えや感想を入力してください！
            </p>
            
            <form onSubmit={handleAnswerSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <textarea
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例：最近はサウナに週3でハマっているそうです！"
                rows={3}
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