'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner';
import FooterNav from "@/components/FooterNav";
import { api } from '../../auth/api';

type Step = 
  | 'start'           // 1枚目（スタート画面）
  | 'qr_method'       // 2枚目 (渡す/読み取るの選択)
  | 'show_qr'         // 自分のQRを表示中（スキャン待ち）
  | 'waiting_partner' // 🌟 追加：相手がスキャン成功し、キャラを選択している最中の待機画面
  | 'scan_qr'         // カメラ起動中
  | 'confirm_partner' // 相手の確認ポップアップ
  | 'select_target'   // 相手のリストから自分がもらうキャラを選択する画面
  | 'video'           // 交換演出動画再生中
  | 'result'          // 結果表示
  | 'bonus';          // ボーナスポップアップ表示

export default function ExchangePage() {
  const router = useRouter();

  // 画面状態の管理
  const [step, setStep] = useState<Step>('start');
  const [errorPopup, setErrorPopup] = useState(false); 

  // データ保持用ステート
  const [currentTradeId, setCurrentTradeId] = useState<number | null>(null); 
  const [qrImageSrc, setQrImageSrc] = useState<string | null>(null); 
  const [partnerInfo, setPartnerInfo] = useState<{name: string, grade: string} | null>(null); 
  const [targetCandidates, setTargetCandidates] = useState<any[]>([]); 
  const [acquiredChar, setAcquiredChar] = useState<any>(null); 

  // ==========================================
  // 🌟【最重要】渡す側（QR表示側）のための自動同期（ポーリング）処理
  // ==========================================
  useEffect(() => {
    // QRコード表示中、または相手の選択待ち中のみポーリングを動かす
    if (step !== 'show_qr' && step !== 'waiting_partner') return;

    const interval = setInterval(async () => {
      try {
        // バックエンドに現在のトレードステータスを問い合わせる
        // ※認証トークンから誰のトレードかを判定する想定
        const res = await api.get('/trading/status'); 
        const { status, partner, acquired } = res.data; 
        // レスポンス例: { status: "scanned" | "completed", partner: {name: "河村一樹", grade: "U4"}, acquired: {cid: 12, name: "河村...", rare: "UR", img1: "..."} }

        if (status === 'scanned' && step === 'show_qr') {
          // 1. 相手がQRコードのスキャンに成功した時
          console.log("[POLLING] 相手のスキャンを検知しました。");
          setPartnerInfo(partner || { name: "読み取り相手", grade: "同期中" });
          setStep('waiting_partner'); // 自動で待機画面へ遷移
        } else if (status === 'completed') {
          // 2. 相手がキャラを選択し、最終実行（complete）を完了した時
          console.log("[POLLING] トレードの最終完了を検知しました。");
          setAcquiredChar(acquired);
          clearInterval(interval);
          setStep('video'); // 自動で演出動画へ遷移！
        }
      } catch (e) {
        // 開発中やバックエンドが未実装のときはエラーログを出すのみ
        console.warn("[POLLING] ステータス取得エラー (未実装または通信エラー):", e);
      }
    }, 1500); // 1.5秒に1回チェック

    return () => clearInterval(interval);
  }, [step]);

  // 💡 1. 最初の画面で「交換」ボタンを押した時
  const handleStartExchange = () => {
    setStep('qr_method');
  };

  // 💡 2. QRコードを生成して自分が見せる側になる処理 (POST /trading/showQR)
  const handleShowQr = async () => {
    try {
      const res = await api.post('/trading/showQR', {}, { responseType: 'blob' });
      setQrImageSrc(URL.createObjectURL(res.data));
      setStep('show_qr');
    } catch (e) {
      console.warn("QR生成APIエラー。モックQRを作成します:", e);
      // パターンBのJSONをモックQRに埋め込む
      setQrImageSrc('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={"uid":2,"trade_id":123}');
      setStep('show_qr');
    }
  };

  // 💡 3. カメラで相手のQRを読み取った側の処理 (POST /trading/scanQR)
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

      // 422エラーを徹底的に回避するため、Query Parameter と JSON Body の両方に乗せて送信する
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
      setStep('confirm_partner');
    } catch (e) {
      console.warn("スキャンAPIエラー。モックデータをセットします:", e);
      setCurrentTradeId(123);
      setPartnerInfo({ name: "河村一樹", grade: "U4" });
      setStep('confirm_partner');
    }
  };

  // 💡 4. 相手との接続を「はい」で確認した時 ➔ 交換許可を出して、相手の手札リストを取得
  const handlePartnerConfirmYes = async () => {
    try {
      const tradeId = currentTradeId || 999;
      await api.post(`/trading/allow?trade_id=${tradeId}`, {
        trade_id: tradeId,
        flag: true
      });
    } catch (e) {
      console.warn("交換許可 API呼び出し失敗。");
    }

    try {
      const res = await api.post('/trading/select');
      const data = res.data;
      
      const charactersArray = data.characters || []; 
      setTargetCandidates(charactersArray); 
      setStep('select_target');
    } catch (e) {
      console.warn("候補キャラ取得エラー。モックで続行します:", e);
      setTargetCandidates([
        { cid: 2, img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/hikita_1.png\r\n", name: "疋田智佳子", rare: "UR" },
        { cid: 12, img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/kawamura_1.png\r\n", name: "河村一樹", rare: "UR" }
      ]);
      setStep('select_target');
    }
  };

  // 💡 5. 相手のリストから欲しいキャラを選んで最終実行
  const handleExecuteTrade = async (tar_cid: number) => {
    const selectedChar = targetCandidates.find(c => c.cid === tar_cid);

    try {
      await api.post('/trading/trade', { 
        cid: tar_cid 
      });
      console.log(`[DEBUG] キャラ選択の登録に成功しました (cid: ${tar_cid})`);

      const res = await api.post('/trading/complete');
      
      const resultData = res.data;
      const acquired = Array.isArray(resultData) ? resultData[0] : resultData;

      setAcquiredChar(acquired || selectedChar);
    } catch (e) {
      console.warn("交換実行APIエラー。モックで続行します:", e);
      setAcquiredChar(selectedChar || { cid: tar_cid, name: "選択キャラ", rare: "UR" });
    }

    if (selectedChar) {
      localStorage.setItem('hackathon_swapped_char', JSON.stringify(selectedChar));
    }

    setStep('video'); 
  };

  const triggerError = () => {
    setErrorPopup(true);
    setStep('start');
    setTimeout(() => setErrorPopup(false), 2000);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto', overflow: 'hidden', backgroundColor: '#000' }}>
      
      {/* 🔮 ローディングスピナー用スタイルシートの注入 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* 🔴 背景画像 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: step === 'start' ? 'url(/exchange1.png)' : 'url(/exchange2.png)',
        backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 1
      }} />

      {/* 🔴 ステップ1: スタート画面 */}
      {step === 'start' && (
        <div 
          onClick={handleStartExchange}
          style={{ position: 'absolute', top: '70%', left: '20%', width: '60%', height: '12%', cursor: 'pointer', zIndex: 10 }}
        />
      )}

      {/* 🔴 ステップ2: QR方式の選択（渡す/読み取る） */}
      {step === 'qr_method' && (
        <>
          <div onClick={triggerError} style={{ position: 'absolute', top: '7%', left: '5%', width: '30%', height: '8%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={handleShowQr} style={{ position: 'absolute', top: '25%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
          <div onClick={() => setStep('scan_qr')} style={{ position: 'absolute', top: '50%', left: '20%', width: '60%', height: '15%', cursor: 'pointer', zIndex: 10 }} />
        </>
      )}

      {/* 🔴 ステップ3: 自分のQRコードを相手に見せる */}
      {step === 'show_qr' && (
        <div style={overlayStyle}>
          <div style={{ ...popupStyle, backgroundColor: '#fff' }}>
            <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '15px', fontSize: '14px' }}>相手に読み取ってもらってください</p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
              {qrImageSrc ? <img src={qrImageSrc} alt="QR Code" style={{ width: '180px', height: '180px' }} /> : <p style={{color: '#333'}}>生成中...</p>}
            </div>
            
            {/* 🌟【デモ保険】相手がスキャンした状態を1タップでエミュレートできるデモ用ボタン */}
            <button 
              onClick={() => {
                setPartnerInfo({ name: "河村一樹", grade: "U4" });
                setStep('waiting_partner');
              }} 
              style={{ marginTop: '15px', padding: '6px', fontSize: '10px', background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ⚠️【デモ用】相手のスキャン成功を擬似再現
            </button>

            <button onClick={() => setStep('qr_method')} style={{ ...cancelBtnStyle, marginTop: '15px' }}>戻る</button>
          </div>
        </div>
      )}

      {/* 🔴 🌟追加ステップ: 相手のスキャンを検知した後の選択待ち画面（送信側） */}
      {step === 'waiting_partner' && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <div style={{ margin: '10px 0' }}>
              {/* スピナーアニメーション */}
              <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #1a73e8', borderRadius: '50%', margin: '0 auto 15px', animation: 'spin 1s linear infinite' }} />
              <h3 style={{ fontSize: '18px', color: '#333', fontWeight: 'bold', margin: '0 0 10px 0' }}>相手がキャラを選択中...</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>
                接続先: <span style={{ fontWeight: 'bold', color: '#1a73e8' }}>{partnerInfo?.grade} {partnerInfo?.name}</span>
              </p>
              <p style={{ fontSize: '11px', color: '#999' }}>そのまましばらくお待ちください</p>
            </div>

            {/* 🌟【デモ保険】相手が選択完了した状態を1タップでエミュレートして動画へ進めるボタン */}
            <button 
              onClick={() => {
                setAcquiredChar({ cid: 2, name: "疋田智佳子", rare: "UR", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/hikita_1.png" });
                setStep('video');
              }} 
              style={{ marginTop: '20px', padding: '6px', fontSize: '10px', background: '#fef3c7', color: '#d97706', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              ⚠️【デモ用】選択完了・トレード実行を擬似再現
            </button>
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
          <button onClick={() => handleScanSuccess('{"uid":2,"trade_id":11}')} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '8px', fontSize: '12px', background: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer' }}>
            【デモ】スキャン成功（カメラをスキップ）
          </button>
          <button onClick={() => setStep('qr_method')} style={wideCancelBtnStyle}>キャンセル</button>
        </div>
      )}

      {/* 🔴 ステップ5: 繋がった相手の同期確認 */}
      {step === 'confirm_partner' && (
        <div style={overlayStyle}>
          <div style={popupStyle}>
            <p style={{ fontSize: '14px', color: '#555' }}>交換相手が見つかりました</p>
            <h3 style={{ fontSize: '20px', margin: '10px 0', color: '#1a73e8', fontWeight: 'black' }}>
              {partnerInfo?.grade} {partnerInfo?.name}
            </h3>
            <p style={{ fontWeight: 'bold', color: '#333', marginTop: '15px', fontSize: '14px' }}>相手のリストを同期しますか？</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px', width: '100%' }}>
              <button onClick={handlePartnerConfirmYes} style={uniformPrimaryBtnStyle}>はい</button>
              <button onClick={triggerError} style={uniformCancelBtnStyle}>いいえ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 ステップ6: 相手の手札から欲しいキャラを指名スカウトする画面 */}
      {step === 'select_target' && (
        <div style={{ ...overlayStyle, backgroundImage: "url('/chara_table.png')", backgroundSize: 'cover' }}>
          <div style={{ ...popupStyle, width: '90%', height: '80%', backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '15px' }}>
            <h3 style={{ margin: '0 0 5px', color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>相手のリストから指名スカウト</h3>
            <p style={{ fontSize: '11px', color: '#aaa', marginBottom: '15px' }}>欲しいメンバーを1人タップしてください</p>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              {targetCandidates.map((char: any, i) => {
                const cleanImgUrl = char.img1 ? char.img1.replace(/[\r\n]+/g, "").trim() : null;
                return (
                  <div key={i} onClick={() => handleExecuteTrade(char.cid)}
                    style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '8px', backgroundColor: '#222', overflow: 'hidden' }}>
                      {cleanImgUrl ? (
                        <img src={cleanImgUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                      ) : (
                        <span style={{display:'block', textAlign:'center', lineHeight:'45px'}}>👤</span>
                      )}
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{char.name}</div>
                      <div style={{ fontSize: '11px', color: '#f39c12', fontWeight: 'bold' }}>{char.rare || 'UR'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={triggerError} style={{ ...cancelBtnStyle, width: '100%', marginTop: '15px' }}>キャンセル</button>
          </div>
        </div>
      )}

      {/* 🔴 ステップ7: 交換成功演出動画の再生 */}
      {step === 'video' && (
        <video 
          src="/exchange.mp4" 
          autoPlay 
          playsInline
          onEnded={() => setStep('result')}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 100 }}
        />
      )}

      {/* 🔴 ステップ8: トレードで新しくゲットしたキャラの表示 */}
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

      {/* 🔴 ステップ9: ボーナス報酬表示 */}
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

      {/* ⚠️ エラー・キャンセル時のポップアップ */}
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
const primaryBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'
};
const cancelBtnStyle: React.CSSProperties = {
  padding: '12px', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '15px'
};
const uniformPrimaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px 0', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'center'
};
const uniformCancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px 0', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e0e0e0', color: '#555', border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'center'
};
const wideCancelBtnStyle: React.CSSProperties = {
  width: '80%', maxWidth: '300px', padding: '14px 0', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '30px', cursor: 'pointer', marginTop: '30px', textAlign: 'center', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)'
};