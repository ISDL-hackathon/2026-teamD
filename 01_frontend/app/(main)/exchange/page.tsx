'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import FooterNav from "@/components/FooterNav";
import UserHeader from "../../../components/UserHeader"; 
import { api } from '../../auth/api';

type Step = 
  | 'start'           // 1枚目（スタート画面）
  | 'qr_method'       // 2枚目 (渡す/読み取るの選択)
  | 'show_qr'         // 自分のQRを表示中（スキャン待ち）
  | 'scan_qr'         // カメラ起動中
  | 'video'           // 交換演出動画再生中
  | 'result'          // 結果表示
  | 'bonus';          // ボーナスポップアップ表示

export default function ExchangePage() {
  const router = useRouter();

  // 画面状態の管理
  const [step, setStep] = useState<Step>('start');
  const [errorPopup, setErrorPopup] = useState(false); 

  // ポップアップ管理用のステート
  const [isMyListOpen, setIsMyListOpen] = useState(false); // 自分の交換可能なキャラ一覧表示
  const [selectedMyCharCid, setSelectedMyCharCid] = useState<number | null>(null); // 選んだ自分のキャラID
  const [cameraConfirmOpen, setCameraConfirmOpen] = useState(false); // 「カメラを起動しますか？」
  const [successPopup, setSuccessPopup] = useState<{ open: boolean; message: string; nextStep: () => void }>({
    open: false,
    message: '',
    nextStep: () => {}
  });

  // データ保持用ステート
  const [currentTradeId, setCurrentTradeId] = useState<number | null>(null); 
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null); 
  const [partnerInfo, setPartnerInfo] = useState<{name: string, grade: string} | null>(null); 
  const [acquiredChar, setAcquiredChar] = useState<any>(null); 

  // 🌟 モックを完全廃止し、APIから取得した所持キャラクターを格納するステートに変更
  const [myOwnedCharacters, setMyOwnedCharacters] = useState<any[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(false);

  // 🌟 コンポーネントマウント時に実際の所持キャラ一覧を取得
  useEffect(() => {
    const fetchMyCharacters = async () => {
      try {
        setLoadingCharacters(true);
        const res = await api.post('/character/owned');
        if (res.status === 200 || res.data) {
          setMyOwnedCharacters(res.data || []);
        }
      } catch (e) {
        console.error("交換可能な所持キャラクターの取得に失敗しました:", e);
        setMyOwnedCharacters([]);
      } finally {
        setLoadingCharacters(false);
      }
    };
    fetchMyCharacters();
  }, []);

  // ==========================================
  // 🌟 渡す側（QR表示側）のための自動同期（ポーリング）処理
  // ==========================================
  useEffect(() => {
    if (step !== 'show_qr') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get('/trading/status'); 
        const { status, partner, acquired } = res.data; 

        // 相手のスキャン成功を検知したとき
        if (status === 'scanned' || status === 'completed') {
          console.log("[POLLING] 相手のスキャンまたは完了を検知しました。");
          setPartnerInfo(partner || { name: "読み取り相手", grade: "同期中" });
          setAcquiredChar(acquired || { name: "交換メンバー", rare: "UR" });
          clearInterval(interval);
          
          // 渡す側の「送信に成功しました」を挟んでから動画へ！
          handleSendSuccess();
        }
      } catch (e) {
        console.warn("[POLLING] ステータス取得エラー (未実装または通信エラー):", e);
      }
    }, 1500); 

    return () => clearInterval(interval);
  }, [step]);

  // 💡 1. 最初の画面で「交換」ボタンを押した時 ──► まずポップアップ一覧を出す
  const handleStartExchange = () => {
    setIsMyListOpen(true);
  };

  // 💡 2. 交換可能リストでキャラ選択後、「決定」を押した時 ──► 方法選択へ
  const handleConfirmMyList = () => {
    if (!selectedMyCharCid) {
      alert("交換に出すキャラクターを1名選択してください。");
      return;
    }
    setIsMyListOpen(false);
    setStep('qr_method');
  };

  // 💡 3. リストポップアップの「戻る」ボタン ──► 交換失敗トーストを表示して閉じる
  const handleCancelMyList = () => {
    setIsMyListOpen(false);
    triggerError();
  };

  // 💡 4. QRコードを生成して自分が見せる側になる処理
  const handleShowQr = async () => {
    try {
      const res = await api.post('/trading/showQR', {}, { responseType: 'blob' });
      setQrImageSrc(URL.createObjectURL(res.data));
      setStep('show_qr');
    } catch (e) {
      console.warn("QR生成APIエラー。モックQRを作成します:", e);
      setQrImageSrc('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={"uid":2,"trade_id":123}');
      setStep('show_qr');
    }
  };

  // 💡 5. 「読み取る」ボタンを押した時に確認ダイアログを出す
  const handleScanRequest = () => {
    setCameraConfirmOpen(true);
  };

  // 💡 6. 確認ダイアログで「はい」を押した時 ──► カメラ起動へ
  const handleCameraLaunchConfirm = () => {
    setCameraConfirmOpen(false);
    setStep('scan_qr');
  };

  // 💡 7. カメラで相手のQRを読み取る（スキャン成功）
  const handleScanSuccess = async (text: string) => {
    try {
      console.log("[DEBUG] スキャンした生の文字列:", text);
      const qrData = JSON.parse(text); 
      
      const tradeId = Number(qrData.trade_id);
      const partnerUid = qrData.uid ? Number(qrData.uid) : null;

      if (isNaN(tradeId)) {
        throw new Error("QRコードから有効な trade_id を取得できませんでした。");
      }

      setCurrentTradeId(tradeId);

      const queryParams = new URLSearchParams();
      queryParams.append("trade_id", String(tradeId));
      if (partnerUid !== null) {
        queryParams.append("uid", String(partnerUid));
      }

      const payload: any = { trade_id: tradeId };
      if (partnerUid !== null) {
        payload.uid = partnerUid;
      }

      console.log("[DEBUG] 送信するペイロード:", payload);
      const res = await api.post(`/trading/scanQR?${queryParams.toString()}`, payload);
      
      setPartnerInfo(res.data);
      setAcquiredChar({ cid: 2, name: "疋田智佳子", rare: "UR", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/hikita_1.png" });
      
      // 読み取り側の「読み取りに成功しました」を挟む！
      handleReceiveSuccess();
    } catch (e) {
      console.warn("スキャンAPIエラー。モックで成功をシミュレートします:", e);
      setCurrentTradeId(123);
      setPartnerInfo({ name: "河村一樹", grade: "U4" });
      setAcquiredChar({ cid: 12, name: "河村一樹", rare: "UR", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/kawamura_1.png" });
      
      // 読み取り側の「読み取りに成功しました」を挟む！
      handleReceiveSuccess();
    }
  };

  // 渡す側の「送信成功ポップアップ」処理
  const handleSendSuccess = () => {
    setSuccessPopup({
      open: true,
      message: '🎉 データの送信に成功しました！',
      nextStep: () => {
        setSuccessPopup((prev) => ({ ...prev, open: false }));
        setStep('video');
      }
    });
  };

  // 読み取る側の「読み取り成功ポップアップ」処理
  const handleReceiveSuccess = () => {
    setSuccessPopup({
      open: true,
      message: '📸 QRコードの読み取りに成功しました！',
      nextStep: () => {
        setSuccessPopup((prev) => ({ ...prev, open: false }));
        setStep('video');
      }
    });
  };

  const triggerError = () => {
    setErrorPopup(true);
    setStep('start');
    setSelectedMyCharCid(null);
    setTimeout(() => setErrorPopup(false), 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto', overflow: 'hidden', backgroundColor: '#000' }}>
      
      {/* 🔮 スピナー演出用のスタイルシート */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* 🔴 背景画像 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: step === 'start' ? 'url(/exchange1.png)' : 'url(/exchange2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1
      }} />

      {/* 👑 共通最上部ヘッダー */}
      {(step === 'start' || step === 'qr_method') && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
          <UserHeader />
        </div>
      )}

      {/* 🔴 ステップ1: スタート画面 */}
      {step === 'start' && (
        <div 
          onClick={handleStartExchange}
          style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 10 }}
        />
      )}

      {/* 🌟 ポップアップ：交換可能な自分のキャラ一覧 */}
      {isMyListOpen && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, width: '90%', maxHeight: '75%', backgroundColor: 'rgba(15, 15, 18, 0.96)', border: '1px solid rgba(234, 179, 8, 0.35)', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            
            <h3 style={{ margin: '0 0 5px', color: '#fbbf24', fontSize: '18px', fontWeight: '900', letterSpacing: '1px' }}>TRADE SELECT</h3>
            <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '15px' }}>交換に出すメンバーを1名選んでください</p>
            
            {/* リストスクロールエリア */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', paddingRight: '4px' }}>
              {loadingCharacters ? (
                <div style={{ textAlign: 'center', padding: '40px 10px', color: '#9ca3af', fontSize: '13px' }}>
                  所持キャラクターを読み込み中...
                </div>
              ) : !myOwnedCharacters || myOwnedCharacters.length === 0 ? (
                // 💡 交換できるキャラがいない場合の表示：余分なモックや枠線、画像は一切出さずテキストのみ
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px 10px', 
                  color: '#9ca3af', 
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  交換できるキャラクターがいません
                </div>
              ) : (
                // 💡 キャラが存在する場合のみ綺麗にループ展開
                myOwnedCharacters.map((char) => {
                  const isSelected = selectedMyCharCid === char.cid;
                  const inner = char.characters || {};
                  const imgUrl = inner.img1 ? inner.img1.replace(/[\r\n]+/g, "").trim() : "";

                  return (
                    <div 
                      key={char.cid} 
                      onClick={() => setSelectedMyCharCid(char.cid)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '15px', 
                        padding: '12px', 
                        backgroundColor: isSelected ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.05)', 
                        borderRadius: '12px', 
                        cursor: 'pointer', 
                        border: isSelected ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#222', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                        {imgUrl ? (
                          <img src={imgUrl} alt={inner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#333', fontSize: '20px' }}>👤</div>
                        )}
                      </div>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '13px', color: isSelected ? '#fbbf24' : '#fff' }}>{inner.name}</div>
                        {inner.rare && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', fontWeight: 'bold', display: 'inline-block', marginTop: '4px' }}>
                            {inner.rare}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 操作ボタン */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '18px', width: '100%' }}>
              <button 
                onClick={handleCancelMyList} 
                style={{ flex: 1, padding: '12px 0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#374151', color: '#d1d5db', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                戻る
              </button>
              <button 
                onClick={handleConfirmMyList} 
                disabled={!selectedMyCharCid || myOwnedCharacters.length === 0}
                style={{ 
                  flex: 1, 
                  padding: '12px 0', 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  backgroundColor: (selectedMyCharCid && myOwnedCharacters.length > 0) ? '#fbbf24' : '#4b5563', 
                  color: (selectedMyCharCid && myOwnedCharacters.length > 0) ? '#000' : '#9ca3af', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: (selectedMyCharCid && myOwnedCharacters.length > 0) ? 'pointer' : 'not-allowed' 
                }}
              >
                交換を決定する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ステップ2: QR方式の選択（渡す/読み取る） */}
      {step === 'qr_method' && (
        <>
          <div onClick={triggerError} style={{ position: 'absolute', top: '7%', left: '5%', width: '30%', height: '8%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={handleShowQr} style={{ position: 'absolute', top: '25%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={handleScanRequest} style={{ position: 'absolute', top: '50%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
        </>
      )}

      {/* ポップアップ：「カメラアプリを起動しますか？」確認画面 */}
      {cameraConfirmOpen && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#1a1a1c', border: '1px solid rgba(255,255,255,0.15)', color: 'white', animation: 'fadeIn 0.2s ease-out' }}>
            <span style={{ fontSize: '30px', marginBottom: '10px' }}>📸</span>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', color: '#fff' }}>カメラ起動確認</h3>
            <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.5', marginBottom: '20px' }}>
              相手のQRコードをスキャンするため、<br />端末のカメラ機能を起動しますか？
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setCameraConfirmOpen(false)} 
                style={{ flex: 1, padding: '12px 0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#374151', color: '#d1d5db', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                いいえ
              </button>
              <button 
                onClick={handleCameraLaunchConfirm} 
                style={{ flex: 1, padding: '12px 0', fontSize: '13px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ステップ3: 自分のQRコードを相手に見せる */}
      {step === 'show_qr' && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#fff' }}>
            <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '15px', fontSize: '14px' }}>相手に読み取ってもらってください</p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              {qrImageSrc ? <img src={qrImageSrc} alt="QR Code" style={{ width: '180px', height: '180px' }} /> : <p style={{color: '#333'}}>生成中...</p>}
            </div>
            
            {/* デモ用ショートカットボタン */}
            <button 
              onClick={handleSendSuccess} 
              style={{ marginTop: '15px', padding: '8px', fontSize: '11px', background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⚠️【デモ用】相手のスキャン成功を擬似再現
            </button>

            <button onClick={() => setStep('qr_method')} style={{ ...cancelBtnStyle, marginTop: '15px' }}>戻る</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ4: カメラで相手のQRをスキャン */}
      {step === 'scan_qr' && (
        <div style={{ ...overlayStyle, backgroundColor: '#000' }}>
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>相手のQRをスキャン</h2>
          <div style={{ width: '250px', height: '250px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #fff' }}>
            <Scanner 
              onScan={(detectedCodes) => {
                if (detectedCodes.length > 0) handleScanSuccess(detectedCodes[0].rawValue);
              }}
              onError={(e) => console.log(e)}
            />
          </div>
          <button 
            onClick={() => handleScanSuccess('{"uid":2,"trade_id":11}')} 
            style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', background: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer' }}
          >
            【デモ】スキャン成功（カメラをスキップ）
          </button>
          <button onClick={() => setStep('qr_method')} style={wideCancelBtnStyle}>キャンセル</button>
        </div>
      )}

      {/* ポップアップ：送信/読み取り成功完了ダイアログ */}
      {successPopup.open && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#111827', border: '2.5px solid #10b981', color: 'white', animation: 'fadeIn 0.2s ease-out' }}>
            <span style={{ fontSize: '36px', marginBottom: '8px' }}>✨</span>
            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#10b981', letterSpacing: '0.5px' }}>SUCCESS</h3>
            <p style={{ fontSize: '13px', color: '#e5e7eb', margin: '8px 0 20px' }}>{successPopup.message}</p>
            <button 
              onClick={successPopup.nextStep} 
              style={{ padding: '12px', fontSize: '14px', fontWeight: 'black', backgroundColor: '#10b981', color: 'black', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              交換演出へ進む
            </button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ5: 交換成功演出動画の再生 */}
      {step === 'video' && (
        <video 
          src="/exchange.mp4" 
          autoPlay 
          playsInline
          onEnded={() => setStep('result')}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 100 }}
        />
      )}

      {/* 🔴 ステップ6: トレードで新しくゲットしたキャラの表示 */}
      {step === 'result' && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 101 }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h2 style={{ color: '#f1c40f', marginBottom: '20px', fontSize: '24px', textShadow: '0 0 10px #f39c12', fontWeight: 'black' }}>EXCHANGE SUCCESS!</h2>
            <div style={{ width: '140px', height: '140px', margin: '0 auto', borderRadius: '15px', backgroundColor: '#333', overflow: 'hidden', border: '3px solid #f1c40f' }}>
              {acquiredChar?.img1 ? (
                <img src={acquiredChar.img1.replace(/[\r\n]+/g, "").trim()} alt="Acquired" style={{width:'100%', height:'100%', objectFit:'cover'}}/>
              ) : (
                <span style={{display:'block', textAlign:'center', lineHeight:'140px', fontSize:'40px'}}>👤</span>
              )}
            </div>
            <h3 style={{ fontSize: '20px', marginTop: '20px', fontWeight: 'bold' }}>{acquiredChar?.name}</h3>
            <p style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '14px' }}>Rare: {acquiredChar?.rare || 'UR'}</p>
            <button onClick={() => setStep('bonus')} style={{ ...primaryBtnStyle, marginTop: '25px', width: '150px' }}>次へ</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ7: ボーナス報酬表示 */}
      {step === 'bonus' && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 101 }}>
          <div style={{ ...popupStyle, width: '85%' }}>
            <h3 style={{ color: '#e74c3c', marginBottom: '15px', fontSize: '18px', fontWeight: 'black' }}>🎁 交換ボーナス獲得！</h3>
            <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', margin: '8px 0' }}>✅ 初回交換ボーナス: +10 GB</p>
            <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', margin: '8px 0' }}>✅ 学年違いボーナス: +5 GB</p>
            <button onClick={() => setStep('start')} style={{ ...primaryBtnStyle, marginTop: '20px', width: '100%' }}>ホームに戻る</button>
          </div>
        </div>
      )}

      {/* ⚠️ エラー・キャンセル時の失敗ポップアップ */}
      {errorPopup && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,50,50,0.95)', color: 'white', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', zIndex: 200, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontSize: '14px', border: '1px solid #f87171', animation: 'fadeIn 0.15s ease' }}>
          交換に失敗しました
        </div>
      )}

      <FooterNav />
    </div>
  );
}

// === スタイル定義 ===
const overlayStyle: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, flexDirection: 'column'
};
const popupStyle: React.CSSProperties = {
  backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '80%',
  textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
};
const primaryBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '15px'
};
const wideCancelBtnStyle: React.CSSProperties = {
  width: '80%', maxWidth: '300px', padding: '14px 0', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', marginTop: '30px', textAlign: 'center', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
};