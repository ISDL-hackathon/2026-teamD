'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import FooterNav from "@/components/FooterNav";
import UserHeader from "../../../components/UserHeader"; 
import { api } from '../../auth/api';

type Step = 'start' | 'qr_method' | 'show_qr' | 'scan_qr' | 'video' | 'result' | 'bonus';

export default function ExchangePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('start');
  const [errorPopup, setErrorPopup] = useState(false); 
  const [isMyListOpen, setIsMyListOpen] = useState(false); 
  const [selectedMyCharCid, setSelectedMyCharCid] = useState<number | null>(null); 
  const [cameraConfirmOpen, setCameraConfirmOpen] = useState(false); 
  const [successPopup, setSuccessPopup] = useState<{ open: boolean; message: string; nextStep: () => void }>({
    open: false, message: '', nextStep: () => {}
  });

  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null); 
  const [partnerInfo, setPartnerInfo] = useState<{name: string, grade: string} | null>(null); 
  const [acquiredChar, setAcquiredChar] = useState<any>(null); 
  const [myOwnedCharacters, setMyOwnedCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  useEffect(() => {
    const fetchMyCharacters = async () => {
      try {
        setLoadingCharacters(true);
        const res = await api.post('/character/owned');
        if (res.data) setMyOwnedCharacters(res.data || []);
      } catch (e) {
        console.error("所持キャラの取得失敗:", e);
      } finally {
        setLoadingCharacters(false);
      }
    };
    fetchMyCharacters();
  }, []);

  // ==========================================
  // 状態監視（ポーリング）処理
  // ==========================================
  useEffect(() => {
    if (step !== 'show_qr') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get('/trading/status'); 
        const { status, partner, acquired } = res.data; 

        // 【修正】'scanned' では進まず、完全に終了した 'completed' の時だけ画面を進める
        if (status === 'completed') {
          console.log("[POLLING] 交換成立を検知しました！", res.data);
          setPartnerInfo(partner || null);
          setAcquiredChar(acquired || null);
          clearInterval(interval);
          handleSendSuccess();
        }
      } catch (e) {
        console.error("[POLLING] ステータス取得エラー:", e);
      }
    }, 1500); 

    return () => clearInterval(interval);
  }, [step]);

  const handleStartExchange = () => setIsMyListOpen(true);
  const handleConfirmMyList = () => {
    if (!selectedMyCharCid) return alert("キャラクターを選択してください。");
    setIsMyListOpen(false);
    setStep('qr_method');
  };
  const handleCancelMyList = () => { setIsMyListOpen(false); triggerError(); };

  // ==========================================
  // 【修正】404を回避するため、直接 showQR を叩く形に戻しました
  // ==========================================
  const handleShowQr = async () => {
    try {
      const res = await api.post('/trading/showQR', {}, { responseType: 'blob' });
      setQrImageSrc(URL.createObjectURL(res.data));
      setStep('show_qr');
    } catch (e) {
      console.error("QR生成APIエラー:", e);
      triggerError();
    }
  };

  const handleScanRequest = () => setCameraConfirmOpen(true);
  const handleCameraLaunchConfirm = () => { setCameraConfirmOpen(false); setStep('scan_qr'); };

  const handleScanSuccess = async (text: string) => {
    try {
      const qrData = JSON.parse(text); 
      const tradeId = Number(qrData.trade_id);
      const partnerUid = qrData.uid ? Number(qrData.uid) : null;

      const queryParams = new URLSearchParams();
      queryParams.append("trade_id", String(tradeId));
      if (partnerUid !== null) queryParams.append("uid", String(partnerUid));

      const payload: any = { trade_id: tradeId };
      if (partnerUid !== null) payload.uid = partnerUid;

      const res = await api.post(`/trading/scanQR?${queryParams.toString()}`, payload);
      setPartnerInfo(res.data.partner || null);
      setAcquiredChar(res.data.acquired || null);
      handleReceiveSuccess();
    } catch (e) {
      console.error("スキャンAPIエラー:", e);
      triggerError();
    }
  };

  const handleSendSuccess = () => {
    setSuccessPopup({
      open: true, message: '🎉 データの送信に成功しました！',
      nextStep: () => { setSuccessPopup((prev) => ({ ...prev, open: false })); setStep('video'); }
    });
  };

  const handleReceiveSuccess = () => {
    setSuccessPopup({
      open: true, message: '📸 QRコードの読み取りに成功しました！',
      nextStep: () => { setSuccessPopup((prev) => ({ ...prev, open: false })); setStep('video'); }
    });
  };

  const triggerError = () => {
    setErrorPopup(true); setStep('start'); setSelectedMyCharCid(null);
    setTimeout(() => setErrorPopup(false), 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto', overflow: 'hidden', backgroundColor: '#000' }}>
      <style>{` @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: step === 'start' ? 'url(/exchange1.png)' : 'url(/exchange2.png)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1 }} />
      {(step === 'start' || step === 'qr_method') && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}><UserHeader /></div>}
      {step === 'start' && <div onClick={handleStartExchange} style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 10 }} />}

      {isMyListOpen && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, width: '90%', maxHeight: '75%', backgroundColor: 'rgba(15, 15, 18, 0.96)', border: '1px solid rgba(234, 179, 8, 0.35)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <h3 style={{ margin: '0 0 5px', color: '#fbbf24', fontSize: '18px', fontWeight: '900' }}>TRADE SELECT</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {loadingCharacters ? <div style={{ color: '#9ca3af' }}>読み込み中...</div> : myOwnedCharacters.map((char, index) => {
                const isSelected = selectedMyCharCid === char.cid;
                const inner = char.characters || {};
                return (
                  <div key={`${char.cid}-${index}`} onClick={() => setSelectedMyCharCid(char.cid)} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: isSelected ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px', color: isSelected ? '#fbbf24' : '#fff' }}>{inner.name}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
              <button onClick={handleCancelMyList} style={{ flex: 1, padding: '12px 0', backgroundColor: '#374151', color: '#d1d5db', border: 'none', borderRadius: '8px' }}>戻る</button>
              <button onClick={handleConfirmMyList} disabled={!selectedMyCharCid} style={{ flex: 1, padding: '12px 0', backgroundColor: selectedMyCharCid ? '#fbbf24' : '#4b5563', color: selectedMyCharCid ? '#000' : '#9ca3af', border: 'none', borderRadius: '8px' }}>交換を決定する</button>
            </div>
          </div>
        </div>
      )}

      {step === 'qr_method' && (
        <>
          <div onClick={triggerError} style={{ position: 'absolute', top: '7%', left: '5%', width: '30%', height: '8%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={handleShowQr} style={{ position: 'absolute', top: '25%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={handleScanRequest} style={{ position: 'absolute', top: '50%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
        </>
      )}

      {cameraConfirmOpen && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#1a1a1c', color: 'white' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>カメラ起動確認</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCameraConfirmOpen(false)} style={{ flex: 1, padding: '12px 0', backgroundColor: '#374151', color: '#d1d5db', border: 'none', borderRadius: '8px' }}>いいえ</button>
              <button onClick={handleCameraLaunchConfirm} style={{ flex: 1, padding: '12px 0', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px' }}>はい</button>
            </div>
          </div>
        </div>
      )}

      {step === 'show_qr' && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#fff' }}>
            <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '15px' }}>相手に読み取ってもらってください</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {qrImageSrc ? <img src={qrImageSrc} alt="QR Code" style={{ width: '180px', height: '180px' }} /> : <p style={{color: '#333'}}>生成中...</p>}
            </div>
            <button onClick={() => setStep('qr_method')} style={cancelBtnStyle}>戻る</button>
          </div>
        </div>
      )}

      {step === 'scan_qr' && (
        <div style={{ ...overlayStyle, backgroundColor: '#000' }}>
          <h2 style={{ color: 'white', marginBottom: '20px' }}>相手のQRをスキャン</h2>
          <div style={{ width: '250px', height: '250px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #fff' }}>
            <Scanner onScan={(detectedCodes) => { if (detectedCodes.length > 0) handleScanSuccess(detectedCodes[0].rawValue); }} onError={(e) => console.error(e)} />
          </div>
          <button onClick={() => setStep('qr_method')} style={wideCancelBtnStyle}>キャンセル</button>
        </div>
      )}

      {successPopup.open && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#111827', border: '2.5px solid #10b981', color: 'white' }}>
            <h3 style={{ color: '#10b981' }}>SUCCESS</h3>
            <p>{successPopup.message}</p>
            <button onClick={successPopup.nextStep} style={{ padding: '12px', backgroundColor: '#10b981', color: 'black', border: 'none', borderRadius: '8px' }}>交換演出へ進む</button>
          </div>
        </div>
      )}

      {step === 'video' && <video src="/exchange.mp4" autoPlay playsInline onEnded={() => setStep('result')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 100 }} />}

      {step === 'result' && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 101 }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2>EXCHANGE SUCCESS!</h2>
            {/* 【修正】もし名前が出ないなら、二通りの書き方を試す */}
            <h3>{acquiredChar?.characters?.name || acquiredChar?.name || "キャラクター"}</h3>
            <p>パートナー: {partnerInfo?.name} ({partnerInfo?.grade})</p>
            <button onClick={() => setStep('bonus')} style={{ ...primaryBtnStyle, marginTop: '25px' }}>次へ</button>
          </div>
        </div>
      )}

      {step === 'bonus' && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 101 }}>
          <div style={{ ...popupStyle, width: '85%' }}>
            <h3>🎁 交換ボーナス獲得！</h3>
            <button onClick={() => setStep('start')} style={{ ...primaryBtnStyle, marginTop: '20px', width: '100%' }}>ホームに戻る</button>
          </div>
        </div>
      )}

      {errorPopup && <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,50,50,0.95)', color: 'white', padding: '15px 30px', borderRadius: '10px', zIndex: 200 }}>交換に失敗しました</div>}
      <FooterNav />
    </div>
  );
}

const overlayStyle: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, flexDirection: 'column' };
const popupStyle: React.CSSProperties = { backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '80%', textAlign: 'center', display: 'flex', flexDirection: 'column' };
const primaryBtnStyle: React.CSSProperties = { padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px' };
const cancelBtnStyle: React.CSSProperties = { padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '8px', marginTop: '15px' };
const wideCancelBtnStyle: React.CSSProperties = { width: '80%', maxWidth: '300px', padding: '14px 0', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '30px', marginTop: '30px' };