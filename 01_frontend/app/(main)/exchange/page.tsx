'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import FooterNav from "@/components/FooterNav";

// 💡 各種APIのURL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_OWNED = `${API_BASE}/character/owned`;           // 所持キャラ一覧
const API_SHOW_QR = `${API_BASE}/trade/qr/show`;           // 自分のQR画像取得
const API_SCAN_QR = `${API_BASE}/trade/qr/scan`;           // 相手のQR読み取り
const API_CANDIDATES = `${API_BASE}/trade/candidates`;     // 交換候補の取得
const API_EXECUTE = `${API_BASE}/trade/execute`;           // 交換実行

type Step = 
  | 'start'           // 1枚目
  | 'select_own'      // 自分の出すキャラ選択ポップアップ
  | 'confirm_own'     // 自分の出すキャラ確認
  | 'qr_method'       // 2枚目 (渡す/読み取る)
  | 'show_qr'         // 自分のQRを表示中
  | 'scan_qr'         // カメラ起動中
  | 'confirm_partner' // 相手の確認ポップアップ
  | 'select_target'   // もらうキャラの選択
  | 'video'           // 交換演出動画再生中
  | 'result'          // 結果表示
  | 'bonus';          // ボーナスポップアップ表示

export default function ExchangePage() {
  const router = useRouter();
  const loginUid = 1; // 自分の仮UID

  // 画面状態の管理
  const [step, setStep] = useState<Step>('start');
  const [errorPopup, setErrorPopup] = useState(false); // 「交換に失敗しました」ポップアップ用

  // データ保持用ステート
  const [ownCharacters, setOwnCharacters] = useState<any[]>([]); // 自分の所持キャラ
  const [selectedOwnChar, setSelectedOwnChar] = useState<any>(null); // 出すキャラ
  const [currentTradeId, setCurrentTradeId] = useState<number | null>(null); // 取引ID
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null); // 受け取ったQR画像
  const [partnerInfo, setPartnerInfo] = useState<{name: string, grade: string} | null>(null); // 相手情報
  const [targetCandidates, setTargetCandidates] = useState<any[]>([]); // 候補キャラ
  const [acquiredChar, setAcquiredChar] = useState<any>(null); // ゲットしたキャラ

  // 💡 1. 最初の画面で「交換」ボタンを押した時
  const handleStartExchange = async () => {
    try {
      const res = await fetch(API_OWNED, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid }),
      });
      if (res.ok) {
        const data = await res.json();
        // data[i].characters の中身が空の場合に備え、マッピングが上手くいくように整形
        setOwnCharacters(data);
        setStep('select_own');
      } else {
        triggerError();
      }
    } catch (e) {
      // ⚠️ 通信エラー時のモックデータ
      setOwnCharacters([
        { cid: 12, characters: { name: "河村一樹", grade: "U4" } },
        { cid: 1, characters: { name: "永野喜大", grade: "M2" } }
      ]);
      setStep('select_own');
    }
  };

  // 💡 2. 自分の出すキャラを「はい」と確定した時 ➔ 「渡すか・スキャンするか」の選択画面(qr_method)へ進む
  const handleConfirmOwnCharYes = () => {
    setStep('qr_method'); // 👈 ここを「qr_method」に変更してカメラ/QR選択へ進むように修正！
  };

  // 💡 3. QRコードを渡す（生成）
  const handleShowQr = async () => {
    try {
      const res = await fetch(API_SHOW_QR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid }),
      });
      if (res.ok) {
        const blob = await res.blob();
        setQrImageSrc(URL.createObjectURL(blob));
        setStep('show_qr');
      } else {
        // APIエラー時も即座にモックQRを立ち上げてデモを続行
        throw new Error("API Error");
      }
    } catch (e) {
      // ⚠️ モック処理（通信できない場合はダミー画像をセット）
      setQrImageSrc('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={"uid":2,"trade_id":123}');
      setStep('show_qr');
    }
  };

  // 💡 4. 相手のQRを読み取った時
  const handleScanSuccess = async (text: string) => {
    try {
      const qrData = JSON.parse(text); // {"uid": 2, "trade_id": 123}
      setCurrentTradeId(qrData.trade_id); // 取引IDを保存

      const res = await fetch(API_SCAN_QR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: qrData.uid,
          trade_id: qrData.trade_id,
        }),
      });
      
      if (res.ok) {
        const partner = await res.json();
        setPartnerInfo(partner);
        setStep('confirm_partner');
      } else {
        throw new Error("Scan API Error");
      }
    } catch (e) {
      // ⚠️ スキャン失敗またはAPI 404時のモック補完（デモを確実に通す）
      setCurrentTradeId(123);
      setPartnerInfo({ name: "河村一樹", grade: "U4" });
      setStep('confirm_partner');
    }
  };

  // 💡 5. 相手と交換する（はい）を選んだ時 ➔ 交換許可を出してから候補キャラ一覧を取得
  const handlePartnerConfirmYes = async () => {
    try {
      // ─── 交換許可 (TradingAllowRequest) の処理 ───
      const allowRes = await fetch(`${API_BASE}/trade/allow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_id: currentTradeId || 999,
          flag: true
        })
      });

      if (!allowRes.ok) {
        console.warn("交換許可の送信に失敗しましたが、デモ用に続行します。");
      }
    } catch (e) {
      console.warn("交換許可 APIの呼び出しに失敗しました。モックで処理を継続します。");
    }

    // 候補キャラ取得
    try {
      const res = await fetch(API_CANDIDATES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid }),
      });
      if (res.ok) {
        const data = await res.json();
        setTargetCandidates(data);
        setStep('select_target');
      } else {
        throw new Error("Candidates API Error");
      }
    } catch (e) {
      // ⚠️ モック処理
      setTargetCandidates([
        { cid: 1, img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nagano_1.png", name: "永野喜大", rare: "UR" },
        { cid: 2, img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nakamura_1.png", name: "中村泰輔", rare: "SR" },
        { cid: 3, img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/jokei_1.png", name: "淨慶航太", rare: "SSR" }
      ]);
      setStep('select_target');
    }
  };

  // 💡 6. もらうキャラを選んで「交換実行」
  const handleExecuteTrade = async (tar_cid: number) => {
    try {
      const res = await fetch(API_EXECUTE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: loginUid, tar_cid: tar_cid }),
      });
      if (res.ok) {
        const resultData = await res.json();
        setAcquiredChar(resultData[0]); // 配列の[0]を受け取る仕様
        setStep('video'); // ➔ 動画再生へ
      } else {
        throw new Error("Execute API Error");
      }
    } catch (e) {
      // ⚠️ モック処理
      setAcquiredChar({ 
        cid: tar_cid, 
        img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/jokei_1.png", 
        name: "淨慶航太", 
        rare: "SSR" 
      });
      setStep('video');
    }
  };

  const triggerError = () => {
    setErrorPopup(true);
    setStep('start');
    setTimeout(() => setErrorPopup(false), 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto', overflow: 'hidden', backgroundColor: '#000' }}>
      
      {/* 🔴 背景画像 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: step === 'start' || step === 'select_own' || step === 'confirm_own' 
          ? 'url(/exchange1.png)' 
          : 'url(/exchange2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1
      }} />

      {/* 🔴 ステップ1: スタート画面（透明なボタン） */}
      {step === 'start' && (
        <div 
          onClick={handleStartExchange}
          style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 10 }}
        />
      )}

      {/* 🔴 ステップ2: 自分の出すキャラを選択するポップアップ */}
      {step === 'select_own' && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <h3 style={{ margin: '0 0 15px', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>交換に出すキャラを選択</h3>
            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(!ownCharacters || ownCharacters.length === 0) ? (
                <p style={{ color: '#888', fontWeight: 'bold', margin: '20px 0' }}>
                  交換に出せるキャラがいません 😢
                </p>
              ) : (
                ownCharacters.map((char: any, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedOwnChar(char); setStep('confirm_own'); }}
                    style={charBtnStyle}
                  >
                    {char.characters?.name || char.name}
                  </button>
                ))
              )}
            </div>
            <button onClick={triggerError} style={cancelBtnStyle}>キャンセル</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ3: 自分の出すキャラの最終確認 */}
      {step === 'confirm_own' && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', lineHeight: '1.5' }}>
              {selectedOwnChar?.characters?.name || selectedOwnChar?.name} <br/> を交換に出しますか？
            </p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', width: '100%' }}>
              <button onClick={handleConfirmOwnCharYes} style={uniformPrimaryBtnStyle}>はい</button>
              <button onClick={triggerError} style={uniformCancelBtnStyle}>いいえ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ステップ4: QR方式の選択（exchange2.png 上の透明ボタン） */}
      {step === 'qr_method' && (
        <>
          {/* 左上の「戻る」 */}
          <div onClick={triggerError} style={{ position: 'absolute', top: '7%', left: '5%', width: '30%', height: '8%', cursor: 'pointer', zIndex: 10 }} />
          {/* QRコードを渡す */}
          <div onClick={handleShowQr} style={{ position: 'absolute', top: '25%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
          {/* QRコードを読み取る */}
          <div onClick={() => setStep('scan_qr')} style={{ position: 'absolute', top: '50%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
        </>
      )}

      {/* 🔴 ステップ5: QRコードを相手に見せる */}
      {step === 'show_qr' && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#fff' }}>
            <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '15px', fontSize: '14px' }}>相手に読み取ってもらってください</p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              {qrImageSrc ? <img src={qrImageSrc} alt="QR Code" style={{ width: '180px', height: '180px' }} /> : <p style={{color: '#333'}}>生成中...</p>}
            </div>
            <button onClick={() => setStep('qr_method')} style={{ ...cancelBtnStyle, marginTop: '20px' }}>戻る</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ6: カメラで相手のQRをスキャン */}
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
          {/* デモ用の裏口突破ボタン */}
          <button onClick={() => handleScanSuccess('{"uid":2, "trade_id":123}')} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', background: '#333', color: 'white', border: '1px solid #555' }}>
            【デモ】スキャン成功（カメラをスキップ）
          </button>
          <button onClick={() => setStep('qr_method')} style={wideCancelBtnStyle}>キャンセル</button>
        </div>
      )}

      {/* 🔴 ステップ7: 相手の確認 */}
      {step === 'confirm_partner' && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p style={{ fontSize: '14px', color: '#555' }}>交換相手が見つかりました</p>
            <h3 style={{ fontSize: '20px', margin: '10px 0', color: '#1a73e8', fontWeight: 'black' }}>
              {partnerInfo?.grade} {partnerInfo?.name}
            </h3>
            <p style={{ fontWeight: 'bold', color: '#333', marginTop: '15px', fontSize: '14px' }}>この相手と交換しますか？</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', width: '100%' }}>
              <button onClick={handlePartnerConfirmYes} style={uniformPrimaryBtnStyle}>はい</button>
              <button onClick={triggerError} style={uniformCancelBtnStyle}>いいえ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ステップ8: 相手からもらうキャラの選択 */}
      {step === 'select_target' && (
        <div style={{ ...overlayStyle, backgroundImage: "url('/chara_table.png')", backgroundSize: 'cover' }}>
          <div style={{ ...popupStyle, width: '90%', height: '80%', backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '15px' }}>
            <h3 style={{ margin: '0 0 15px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>もらうキャラを選択</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {targetCandidates.map((char: any, i) => (
                <div key={i} onClick={() => handleExecuteTrade(char.cid)}
                  style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '8px', backgroundColor: '#222', overflow: 'hidden' }}>
                    {char.img1 ? <img src={char.img1} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : <span style={{display:'block', textAlign:'center', lineHeight:'45px'}}>👤</span>}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{char.name}</div>
                    <div style={{ fontSize: '11px', color: '#f39c12', fontWeight: 'bold' }}>{char.rare || 'SR'}</div>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={triggerError} style={{ ...cancelBtnStyle, width: '100%', marginTop: '15px' }}>キャンセル</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ9: 交換成功動画の再生 */}
      {step === 'video' && (
        <video 
          src="/exchange.mp4" 
          autoPlay 
          playsInline
          onEnded={() => setStep('result')}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 100 }}
        />
      )}

      {/* 🔴 ステップ10: ゲットしたキャラ表示 */}
      {step === 'result' && (
        <div style={{ ...overlayStyle, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 101 }}>
          <div style={{ textAlign: 'center', color: 'white', animation: 'fadeIn 0.5s ease-in-out' }}>
            <h2 style={{ color: '#f1c40f', marginBottom: '20px', fontSize: '24px', textShadow: '0 0 10px #f39c12', fontWeight: 'black' }}>EXCHANGE SUCCESS!</h2>
            <div style={{ width: '140px', height: '140px', margin: '0 auto', borderRadius: '15px', backgroundColor: '#333', overflow: 'hidden', border: '3px solid #f1c40f' }}>
              {acquiredChar?.img1 ? <img src={acquiredChar.img1} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span style={{display:'block', textAlign:'center', lineHeight:'140px', fontSize:'40px'}}>👤</span>}
            </div>
            <h3 style={{ fontSize: '20px', marginTop: '20px', fontWeight: 'bold' }}>{acquiredChar?.name}</h3>
            <p style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '14px' }}>Rare: {acquiredChar?.rare || 'SR'}</p>
            <button onClick={() => setStep('bonus')} style={{ ...primaryBtnStyle, marginTop: '25px', width: '150px' }}>次へ</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ11: ボーナス表示 */}
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

      {/* ⚠️ エラー・キャンセル時の共通ポップアップ */}
      {errorPopup && (
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,50,50,0.9)', color: 'white', padding: '15px 30px', borderRadius: '10px', fontWeight: 'bold', zIndex: 200, boxShadow: '0 4px 15px rgba(0,0,0,0.5)', fontSize: '14px' }}>
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
  backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, flexDirection: 'column'
};
const popupStyle: React.CSSProperties = {
  backgroundColor: 'white', padding: '24px', borderRadius: '16px', width: '80%',
  textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column'
};
const charBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#f1f3f4',
  color: '#333', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer'
};
const primaryBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '15px'
};

const uniformPrimaryBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 0',
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#1a73e8',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'center'
};

const uniformCancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px 0',
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#e0e0e0',
  color: '#555',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  textAlign: 'center'
};

const wideCancelBtnStyle: React.CSSProperties = {
  width: '80%',
  maxWidth: '300px',
  padding: '14px 0',
  fontSize: '16px',
  fontWeight: 'bold',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '30px',
  cursor: 'pointer',
  marginTop: '30px',
  textAlign: 'center',
  boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
};