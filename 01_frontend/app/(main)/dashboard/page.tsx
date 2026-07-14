'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// 📸 QRスキャナーをインポート
import { Scanner } from '@yudiel/react-qr-scanner';

export default function HomePapercraftPage() {
  const router = useRouter();
  
  // 画面の状態管理
  const [step, setStep] = useState<'start' | 'scanning' | 'starting_popup' | 'error' | 'staying' | 'ending'>('start');
  const [stayResult, setStayResult] = useState({ time: '', gb: 0, isAutomaticEnd: false });
  const loginUid = 1; // 仮のユーザーID

  // 📸 カメラでQRを読み取った瞬間に実行される処理
  const handleScanSuccess = async (text: string) => {
    // 連続で読み取ってしまうのを防ぐため、すぐに状態を 'starting_popup'（または通信中）に変える
    console.log('読み取ったQRデータ:', text);

    try {
      // バックエンドへチェックインの通信
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staying/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid }),
      });

      if (response.ok) {
        setStep('starting_popup'); // 2枚目の画像へ
      } else {
        setStep('error'); // 3枚目の画像（エラー）へ
      }
    } catch (error) {
      setStep('error');
    }
  };

  // 🚪 滞在終了（4枚目のボタン透明エリア）を押した時
  const handleEndStay = async () => {
    // 定数の定義（ハッカソン用）
    const TWELVE_HOURS_IN_MINUTES = 720; // 12時間は720分
    const MAX_EARNED_MINUTES = 60; // 超過時は最大1時間（60分）分付与
    const GB_PER_MINUTE = 2; // 💡 報酬ルール（例：1分につき2GB）

    try {
      // 1. バックエンドのフラグ折りのAPIを叩く（DBの同期）
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/staying/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid }),
      });

      // ★フロントエンドの時間の計算
      const startTimeStr = localStorage.getItem('stayStartTime');
      let displayTime = '0分';
      let earnedGb = 0;
      let isAutomaticEnd = false; // 自動終了したかどうかのフラグ

      if (startTimeStr) {
        const startTime = parseInt(startTimeStr, 10);
        const endTime = Date.now();
        // ミリ秒を「分」に変換
        const diffMinutes = Math.floor((endTime - startTime) / (1000 * 60)); 
        
        console.log(`実際の滞在時間: ${diffMinutes} 分`);

        // 🚨 12時間（720分）を超えているかの判定
        if (diffMinutes > TWELVE_HOURS_IN_MINUTES) {
          // 超えていた場合の処理
          displayTime = '12時間超え';
          earnedGb = MAX_EARNED_MINUTES * GB_PER_MINUTE; // 強制的に1時間分のGB
          isAutomaticEnd = true; // フラグを立てる
        } else {
          // 超えていない場合の通常処理
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          displayTime = hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
          earnedGb = diffMinutes * GB_PER_MINUTE; // 通常のGB計算
        }

        // 記録をリセット
        localStorage.removeItem('stayStartTime');
      }

      // 画面に結果と自動終了フラグをセット
      // (stayResult の型に isAutomaticEnd を追加する必要があります)
      setStayResult({ time: displayTime, gb: earnedGb, isAutomaticEnd });
      setStep('ending'); // 5枚目のポップアップへ

    } catch (error) {
      setStayResult({ time: '0分', gb: 0, isAutomaticEnd: false });
      setStep('ending');
    }
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 
        step === 'start' ? 'url(/stay1.png)' :
        step === 'starting_popup' ? 'url(/stay2.png)' :
        step === 'error' ? 'url(/stay3.png)' :
        step === 'scanning' ? 'none' : 
        'url(/stay4.png)', 
      backgroundSize: 'cover', backgroundPosition: 'center',
      backgroundColor: step === 'scanning' ? '#000' : '#f5f5f5', 
    }}>
      
      {/* 🔴 1枚目：滞在開始ボタンをタップ ➔ カメラ起動へ */}
      {step === 'start' && (
        <div 
          onClick={() => setStep('scanning')} 
          style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer' }}
        />
      )}

      {/* 📸 カメラ起動中（QRスキャン画面） */}
      {step === 'scanning' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
          <h2 style={{ marginBottom: '20px', zIndex: 10 }}>入室QRを読み取ってください</h2>
          
          <div style={{ width: '300px', height: '300px', marginBottom: '40px', borderRadius: '15px', overflow: 'hidden' }}>
            {/* ✨ ここが本物のカメラ映像になる ✨ */}
                                <Scanner 
            onScan={(detectedCodes) => {
              if (detectedCodes.length > 0) {
                // 1番目に検知したQRコードの文字列（rawValue）を渡す
                handleScanSuccess(detectedCodes[0].rawValue);
              }
            }} 
            onError={(error) => console.log(error?.message)} 
          />
          </div>

          <button 
            onClick={() => setStep('start')}
            style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#333', color: 'white', borderRadius: '5px', border: 'none', zIndex: 10 }}
          >
            キャンセル（戻る）
          </button>
        </div>
      )}

      {/* 🔴 2枚目・3枚目：タップで次へ進む・戻る */}
      {step === 'starting_popup' && (
        <div onClick={() => setStep('staying')} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
      )}
      {step === 'error' && (
        <div onClick={() => setStep('start')} style={{ width: '100%', height: '100%', cursor: 'pointer' }} />
      )}

      {/* 🔴 4枚目（滞在中） */}
      {step === 'staying' && (
        <>
          <div 
            onClick={handleEndStay}
            style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer' }}
          />
          <div 
            onClick={() => router.push('/stay/conversation')}
            style={{ position: 'absolute', top: '65%', right: '5%', width: '20%', height: '15%', cursor: 'pointer' }}
          />
        </>
      )}

      {/* 🔴 5枚目（終了ポップアップ） */}
      {step === 'ending' && (
        <div 
          onClick={() => setStep('start')}
          style={{ width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
        >
          <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '25px', width: '80%', textAlign: 'center', fontSize: '16px', lineHeight: '1.6', color: '#333', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
            
            {/* 💡 フラグによってテキストを切り替える */}
            {stayResult.isAutomaticEnd ? (
              // 12時間超えの自動終了用
              <>
                ⚠️ 滞在終了通知<br/>
                滞在時間が大幅に超過（12時間超）したため、自動的に滞在を終了しました。<br/>
                報酬として <strong>1時間分（{stayResult.gb}GB）</strong> を付与しました！
              </>
            ) : (
              // 通常の終了用
              <>
                滞在を終了しました。<br/>
                <strong>{stayResult.time}</strong>滞在しました。<br/>
                <strong>{stayResult.gb}GB</strong>を入手しました。
              </>
            )}

          </div>
        </div>
      )}
              {/* 🗺️ ホーム画面の下部に重ねる透明メニューバー（全アイコン対応・交換機能修正版） */}
          <div style={{
            position: 'fixed', 
            bottom: 0, 
            left: '50%', 
            transform: 'translateX(-50%)',
            width: '100%', 
            maxWidth: '400px', 
            height: '11vh', // ガチャ画像のメニューバーと同じ比率の高さ
            display: 'flex', 
            zIndex: 10, 
            backgroundColor: 'transparent'
          }}>
            {/* 1. キャラ（所持一覧画面へ遷移） */}
            <div 
              onClick={() => router.push('/character')} 
              style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} 
              title="キャラ"
            />
            
            {/* 2. ガチャ（ガチャ画面へ遷移） */}
            <div 
              onClick={() => router.push('/gacha')} 
              style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} 
              title="ガチャ"
            />
            
            {/* 3. ホーム（現在地のため、クリックしても何もさせない） */}
            <div 
              style={{ flex: 1, backgroundColor: 'transparent' }} 
              title="ホーム（現在地）"
            />
            
            {/* 4. 交換（🔥会話機能とは別の、キャラ交換専用画面へ遷移） */}
            <div 
              onClick={() => router.push('/stay/exchange')} // 💡 パス名は実際のフォルダ構成（例: /gacha/exchange など）に合わせて適宜変更してください
              style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} 
              title="交換"
            />
            
            {/* 5. その他（設定やその他の画面へ遷移） */}
            <div 
              onClick={() => router.push('/settings')} 
              style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} 
              title="その他"
            />
          </div>
          

    </div>
  );
}