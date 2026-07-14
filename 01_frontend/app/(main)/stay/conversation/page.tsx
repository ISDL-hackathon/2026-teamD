'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// 📸 QRスキャナーと生成器をインポート
import { Scanner } from '@yudiel/react-qr-scanner';
import { QRCodeSVG } from 'qrcode.react';

export default function ConversationPage() {
  const router = useRouter();
  
  // モード管理: 'select' (選択) | 'show_qr' (自分のQR表示) | 'scan_qr' (相手のQRスキャン)
  const [mode, setMode] = useState<'select' | 'show_qr' | 'scan_qr'>('select');
  const [errorMessage, setErrorMessage] = useState('');

  const loginUid = 1;     // 自分のユーザーID（仮）
  const myGrade = 'B1';   // 自分の学年（仮）
  const missionId = 42;   // 現在のミッションID（仮）

  // 💡 自分のQRコードに埋め込むデータ（バックエンドがパースしやすいようにカンマ区切り等にする）
  // qr.py の処理に合わせて、必要ならフォーマットを調整してください
  const myQrData = `${loginUid},${myGrade},${missionId}`;

  // 📸 相手のQRコードを読み取った時の処理
  const handleScanSuccess = async (text: string) => {
    try {
      // バックエンドの /qr/scanQR APIにデータを送信
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/qr/scanQR`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: text, // 相手のQRから読み取った文字列
          uid: loginUid // 自分のID
        }),
      });

      if (response.ok) {
        // 答え合わせが成功したら、次の「答え入力画面」または「完了画面」へ
        // ここでは以前の遷移に合わせて /stay/input に飛ばします
        router.push('/stay/input');
      } else {
        setErrorMessage('不正なQRコードか、ミッションの対象外の相手です。');
        setMode('select');
      }
    } catch (error) {
      setErrorMessage('通信エラーが発生しました。');
      setMode('select');
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 'url(/images/stay4.jpg)', // 滞在中の背景をそのまま流用
      backgroundSize: 'cover', backgroundPosition: 'center',
      fontFamily: 'sans-serif', color: '#333'
    }}>
      {/* 全体を覆う半透明の白いカード（UIを見やすくするため） */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%', width: '90%', height: '80%',
        backgroundColor: 'rgba(25/5, 255, 255, 0.95)', borderRadius: '20px',
        padding: '24px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center'
      }}>
        
        {/* 📝 Geminiからのお題表示エリア */}
        <div style={{ backgroundColor: '#e8f0fe', padding: '16px', borderRadius: '12px', width: '100%', marginBottom: '24px', textAlign: 'center', border: '1px solid #1a73e8' }}>
          <span style={{ fontSize: '12px', color: '#1a73e8', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>💬 Geminiからのミッション</span>
          <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#1f3b4d' }}>
            相手の「最近ハマっていること」を聞き出そう！
          </p>
        </div>

        {errorMessage && (
          <p style={{ color: 'red', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>⚠️ {errorMessage}</p>
        )}

        {/* ーーー モードごとの画面表示 ーーー */}

        {/* 1️⃣ 選択画面（初期状態） */}
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
              onClick={() => router.push('/home')}
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
              {/* QRコードを生成表示 */}
              <QRCodeSVG value={myQrData} size={200} />
            </div>
            <button
              onClick={() => setMode('select')}
              style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#5f6368', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '30px' }}
            >
              戻る
            </button>
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
                  // 1番目に検知したQRコードの文字列（rawValue）を渡す
                  handleScanSuccess(detectedCodes[0].rawValue);
                }
              }}
                onError={(error: any) => console.log(error?.message)}
              />
            </div>
            
            {/* デモ用の強制突破ボタン（PCテスト用） */}
            <button
              onClick={() => handleScanSuccess('2,B2,42')} // ダミーデータ（相手uid:2, B2学年, ミッション42）
              style={{ padding: '8px 16px', fontSize: '12px', backgroundColor: '#f1f3f4', color: '#1a73e8', border: '1px solid #1a73e8', borderRadius: '6px', cursor: 'pointer', marginTop: '15px' }}
            >
              【デモ用】スキャン成功にする
            </button>

            <button
              onClick={() => setMode('select')}
              style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#5f6368', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '20px' }}
            >
              キャンセル
            </button>
          </div>
        )}

      </div>
    </div>
  );
}