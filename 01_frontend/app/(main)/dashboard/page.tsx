'use client';

import { useState, useEffect } from 'react'; 
import dynamic from 'next/dynamic'; 
import { useRouter } from 'next/navigation';
import FooterNav from "@/components/FooterNav";
import { api } from "../../auth/api"; 
import UserHeader from "../../../components/UserHeader";

interface CharacterProfile {
  cid: number;
  name: string;
  img1: string;
}

// 📸 QR Scannerをコンポーネントの「外」で定義する (SSRなし)
const Scanner = dynamic(
  () => import('@yudiel/react-qr-scanner').then((mod) => mod.Scanner),
  { ssr: false } 
);

export default function HomePapercraftPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<'start' | 'scanning' | 'starting_popup' | 'error' | 'staying' | 'ending'>('start');
  const [stayResult, setStayResult] = useState({ time: '', gb: 0, isAutomaticEnd: false });
  const [username, setUsername] = useState('ISDL メンバー');
  const [userGb, setUserGb] = useState(1389); 

  const [homeChar, setHomeChar] = useState<CharacterProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  // 👑 ヘッダーの最新GB情報をリアルタイム更新させるためのStateキー
  const [headerKey, setHeaderKey] = useState(0);

  const fetchOwnedCharacter = async () => {
    const savedCharStr = localStorage.getItem('my_home_char');
    
    if (savedCharStr) {
      try {
        const savedChar = JSON.parse(savedCharStr);
        setHomeChar({
          cid: savedChar.cid,
          name: savedChar.name,
          img1: savedChar.img1
        });
        console.log(`[🏠 Home Select] 設定されたメンバーを表示: ${savedChar.name}`);
        return; 
      } catch (e) {
        console.error("ストレージのパース失敗", e);
      }
    }

    try {
      const response = await api.post('/character/owned'); 
      if (response.status === 200 && response.data && response.data.length > 0) {
        const firstChar = response.data[0];
        setHomeChar({
          cid: firstChar.cid,
          name: firstChar.characters.name,
          img1: firstChar.characters.img1
        });
      } else {
        // 所持ゼロなら阿部さん
        setHomeChar({
          cid: 5, name: "阿部勝寿", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/abe_1.png"
        });
      }
    } catch (error) {
      setHomeChar({
        cid: 5, name: "阿部勝寿", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/abe_1.png"
      });
    }
  };

  useEffect(() => {
    setMounted(true);

    const startTimeStr = localStorage.getItem('stayStartTime');
    if (startTimeStr) setStep('staying');

    fetchOwnedCharacter();
  }, []);

  // 📸 QRスキャン成功時の処理
  const handleScanSuccess = async (text: string) => {
    try {
      const response = await api.post('/staying/start');
      
      if (response.status === 200 || response.data) {
        localStorage.setItem('stayStartTime', String(Date.now()));
        setStep('starting_popup');
      } else {
        setStep('error');
      }
    } catch (error) {
      console.warn("入室開始API通信エラー。デモ用にモック処理を起動します:", error);
      localStorage.setItem('stayStartTime', String(Date.now()));
      setStep('starting_popup');
    }
  };

  // 🔴 滞在を終了する処理（フロント）
  const handleEndStay = async () => {
    try {
      const response = await api.post('/staying/end'); 
      
      if (response.status === 200 && response.data) {
        const { time, gb } = response.data;
        
        const nextGb = userGb + gb;
        setUserGb(nextGb);
        localStorage.setItem('userGb', String(nextGb));
        
        setStayResult({ time: time, gb: gb, isAutomaticEnd: false });
        localStorage.removeItem('stayStartTime');
        setStep('ending');

        // 👑 滞在成功時に共通ヘッダーをリフレッシュしてGB表示を更新！
        setHeaderKey(prev => prev + 1);
      }
    } catch (error) {
      console.warn("退室API終了エラー。デモ用にローカルでGB加算を行います:", error);
      setStayResult({ time: '5分', gb: 10, isAutomaticEnd: false });
      const nextGb = userGb + 10;
      setUserGb(nextGb);
      localStorage.setItem('userGb', String(nextGb));
      setStep('ending');

      // 👑 モックでの終了時も共通ヘッダーを更新
      setHeaderKey(prev => prev + 1);
    }
  };

  if (!mounted || !homeChar) return null;

  const shouldShowCharacter = step === 'start' || step === 'staying';

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
      overflow: 'hidden'
    }}>
      
      {/* 👑 共通最上部ヘッダー（カメラ中以外表示、かつ更新キーを設定） */}
      {step !== 'scanning' && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
          <UserHeader key={headerKey} />
        </div>
      )}

      {/* 👤 キャラクター名表示 */}
      {step === 'start' && (
        <div style={{
          position: 'absolute', top: '65px', left: 0, width: '100%',
          backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', textAlign: 'center',
          padding: '5px 0', zIndex: 10, fontSize: '16px', fontWeight: 'bold'
        }}>
          {homeChar.name}
        </div>
      )}

      {/* ② レイヤー中面：キャラクター立ち絵 */}
      {shouldShowCharacter && (
        <div style={{
          position: 'absolute', bottom: '11vh', left: 0, width: '100%', height: '82vh',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 5
        }}>
          <img 
            src={homeChar.img1} 
            alt={homeChar.name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
      )}

      {/* ③ レイヤー前面：滞在開始ボタン */}
      {step === 'start' && (
        <div 
          onClick={() => setStep('scanning')}
          style={{
            position: 'absolute', bottom: '22vh', left: '50%', transform: 'translateX(-50%)',
            width: '210px', height: '115px', 
            zIndex: 20, cursor: 'pointer',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff'
          }}
        >
          <img 
            src="/staybutton.png" 
            alt="滞在開始"
            style={{
              width: '103%', 
              height: '103%',
              objectFit: 'fill'
            }}
          />
        </div>
      )}

      {/* 📸 カメラ起動中 */}
      {step === 'scanning' && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', color: 'white', zIndex: 200, position: 'relative' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold' }}>入室QRを読み取ってください</h2>
          <div style={{ width: '280px', height: '280px', marginBottom: '30px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #fff' }}>
            <Scanner 
              onScan={(detectedCodes) => {
                if (detectedCodes.length > 0) {
                  handleScanSuccess(detectedCodes[0].rawValue);
                }
              }} 
              onError={(error) => console.log(error?.message)} 
            />
          </div>
          <button 
            onClick={() => setStep('start')}
            style={{ padding: '10px 30px', fontSize: '14px', backgroundColor: '#333', color: 'white', borderRadius: '20px', border: 'none' }}
          >
            キャンセル（戻る）
          </button>
        </div>
      )}

      {/* 🔴 各種ポップアップ等の判定 */}
      {step === 'starting_popup' && (
        <div onClick={() => setStep('staying')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 150 }} />
      )}
      {step === 'error' && (
        <div onClick={() => setStep('start')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 150 }} />
      )}

      {/* 🔴 滞在中状態 */}
      {step === 'staying' && (
        <>
          <div 
            onClick={handleEndStay}
            style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 20 }}
          />
          <div 
            onClick={() => router.push('/stay/conversation')}
            style={{ position: 'absolute', top: '65%', right: '5%', width: '20%', height: '15%', cursor: 'pointer', zIndex: 20 }}
          />
        </>
      )}

      {/* 🔴 終了ポップアップ */}
      {step === 'ending' && (
        <div 
          onClick={() => setStep('start')}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 150 }}
        >
          <div style={{ backgroundColor: 'white', padding: '40px 20px', borderRadius: '25px', width: '80%', textAlign: 'center', fontSize: '15px', lineHeight: '1.6', color: '#333', border: '2px solid #333' }}>
            {stayResult.isAutomaticEnd ? (
              <>
                ⚠️ 滞在終了通知<br/>
                滞在時間が大幅に超過したため、自動終了しました。<br/>
                報酬として <strong>1時間分（{stayResult.gb}GB）</strong> を付与しました！
              </>
            ) : (
              <>
                🎉 滞在を終了しました！<br/>
                <strong>{stayResult.time}</strong> 滞在し、<br/>
                <strong style={{ color: '#f39c12', fontSize: '18px' }}>{stayResult.gb} GB</strong> を獲得しました。
              </>
            )}
          </div>
        </div>
      )}

      <FooterNav />
    </div>
  );
}