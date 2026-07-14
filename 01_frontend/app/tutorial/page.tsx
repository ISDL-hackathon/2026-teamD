"use client";

import { useState } from 'react';
import TitleScreen, { RegisterScreen, LoginScreen } from "./_components/screens";

export default function GameFlow() {
  const [step, setStep] = useState<'TITLE' | 'REGISTER' | 'LOGIN' | 'SLIDESHOW' | 'GACHA_RESULT'>('TITLE');
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<number>(1);
  const [gachaCharacter, setGachaCharacter] = useState<any>(null);
  const [isGachaLoading, setIsGachaLoading] = useState(false);

  // 🌟 タップした場所の座標を保存する状態
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const tutorialSlides = [
    '/tut1.png',  '/tut2.png',  '/tut3.png',  '/tut4.png',  '/tut5.png',
    '/tut6.png',  '/tut7.png',  '/tut8.png',  '/tut9.png',  '/tut10.png',
    '/tut11.png', '/tut12.png', '/tut13.png', '/tut14.png', '/tut15.png',
    '/tut_gacha.mp4', 
    '/tut17.png', '/tut18.png', '/tut19.png', '/tut20.png', '/tut21.png', '/tut22.png'
  ];

  const currentPath = tutorialSlides[slideIndex];
  const isMp4 = currentPath?.endsWith('.mp4');

  const handleSlideTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // 1. タップ演出の生成処理
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newEffect = { id: Date.now(), x, y };
    setTapEffects(prev => [...prev, newEffect]);

    setTimeout(() => {
      setTapEffects(prev => prev.filter(effect => effect.id !== newEffect.id));
    }, 500);

    // 2. 既存の画面遷移処理
    if (isMp4) return;
    setMediaError(null);

    if (slideIndex < tutorialSlides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      alert("チュートリアルが全て完了しました！");
      window.location.href = '/dashboard';
    }
  };

  const handleVideoEnded = async () => {
    setMediaError(null);
    setIsGachaLoading(true);

    try {
      console.log(`📡 チュートリアルガチャAPI呼び出し... UID: ${userId}`);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gacha/tutorial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("🎁 ガチャAPIレスポンス成功:", data);
        
        if (data.status !== "error") {
          setGachaCharacter(data);
          setStep('GACHA_RESULT');
        } else {
          alert("ガチャ失敗: " + data.message);
          moveToNextSlide();
        }
      } else {
        alert("ガチャAPIとの通信に失敗しました。");
        moveToNextSlide();
      }
    } catch (error) {
      console.error("ガチャ通信エラー:", error);
      moveToNextSlide();
    } finally {
      setIsGachaLoading(false);
    }
  };

  const moveToNextSlide = () => {
    if (slideIndex < tutorialSlides.length - 1) {
      setSlideIndex(slideIndex + 1);
    }
  };

  return (
    <div style={{ background: '#222', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* 🌟 アニメーション定義（タップ波紋 ＋ ガチャ結果画面のエフェクト） */}
      <style>
        {`
          @keyframes gameTapRipple {
            0% { transform: translate(-50%, -50%) scale(0.3); opacity: 1; box-shadow: 0 0 10px 5px rgba(255, 255, 255, 0.9); }
            100% { transform: translate(-50%, -50%) scale(2); opacity: 0; box-shadow: 0 0 30px 10px rgba(234, 179, 8, 0); }
          }
          @keyframes whiteFlash {
            0% { background-color: #ffffff; }
            100% { background-color: transparent; }
          }
          @keyframes slideDownFade {
            0% { transform: translateY(-30px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes focusIn {
            0% { filter: blur(10px); transform: scale(1.05); opacity: 0; }
            100% { filter: blur(0px); transform: scale(1); opacity: 1; }
          }
          @keyframes fadeInDelay {
            0% { opacity: 0; }
            80% { opacity: 0; }
            100% { opacity: 1; }
          }
        `}
      </style>

      <main style={{ 
        background: '#000', 
        width: '100%', 
        maxWidth: '430px', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(0,0,0,0.8)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {step === 'TITLE' && (
          <TitleScreen 
            onRegisterClick={() => setStep('REGISTER')} 
            onLoginClick={() => setStep('LOGIN')} 
          />
        )}
        
        {step === 'REGISTER' && (
          <RegisterScreen onRegisterSuccess={(uid, name, grade) => {
            setUserId(uid);
            setStep('SLIDESHOW');
            setSlideIndex(0);
          }} />
        )}

        {step === 'LOGIN' && (
          <LoginScreen onLoginSuccess={() => {
            window.location.href = '/dashboard';
          }} />
        )}

        {step === 'SLIDESHOW' && (
          <div 
            onClick={handleSlideTap} 
            style={{ 
              width: '100%', 
              height: '100%', 
              cursor: isMp4 ? 'default' : 'pointer',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              background: '#111',
              overflow: 'hidden'
            }}
          >
            {/* 🌟 タップエフェクトの描画 */}
            {tapEffects.map(effect => (
              <div 
                key={effect.id}
                style={{
                  position: 'absolute',
                  left: effect.x,
                  top: effect.y,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  pointerEvents: 'none',
                  zIndex: 50,
                  animation: 'gameTapRipple 0.5s ease-out forwards'
                }}
              />
            ))}

            {isMp4 ? (
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <video 
                  src={currentPath} 
                  autoPlay 
                  playsInline 
                  muted 
                  onEnded={handleVideoEnded} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setMediaError(`動画ファイルが見つかりません:\npublic${currentPath}`)}
                />
                {isGachaLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mr-3"></div>
                    データ解析中...
                  </div>
                )}
              </div>
            ) : (
              <img 
                src={currentPath} 
                alt="Tutorial" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setMediaError(`画像ファイルが見つかりません:\npublic${currentPath}`)}
              />
            )}
          </div>
        )}

        {/* 🌟 ガチャ結果画面：動画からのシームレス演出版 */}
        {step === 'GACHA_RESULT' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center select-none relative overflow-hidden"
               style={{ 
                 backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
               }}>
            
            <div className="absolute inset-0 z-50 pointer-events-none"
                 style={{ animation: 'whiteFlash 1.2s ease-out forwards' }} />
            
            <div className="flex flex-col items-center z-10 w-full px-4 pt-12 h-full justify-between pb-12">
              
              <div style={{ animation: 'slideDownFade 0.8s ease-out forwards', opacity: 0 }}>
                <p className="text-yellow-400 font-black tracking-[0.4em] text-sm mb-2 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]">
                  NEW CHARACTER
                </p>
                <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto" />
              </div>
              
              <div className="relative w-full max-w-[300px] mt-8"
                   style={{ animation: 'focusIn 1s ease-out 0.3s forwards', opacity: 0 }}>
                <div className="absolute -inset-4 bg-yellow-500/10 rounded-full blur-2xl animate-pulse" />
                <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-400 tracking-wider mb-2">
                  {gachaCharacter?.name || "倉貫さん"}
                </h3>
                <div className="flex justify-center items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-white/10 border border-white/20 rounded text-xs tracking-widest">Lv.1</span>
                  <span className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded text-xs tracking-widest font-bold">COST 99</span>
                </div>
                <div className="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 text-left">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    データベースとの同期完了。<br/>
                    あなたのプロジェクトにアサインされました。
                  </p>
                </div>
              </div>

              <div className="w-full mt-auto" style={{ animation: 'fadeInDelay 2s ease-out forwards', opacity: 0 }}>
                <button 
                  onClick={() => {
                    setStep('SLIDESHOW'); 
                    moveToNextSlide();    
                  }} 
                  className="w-full max-w-[260px] mx-auto py-4 bg-white hover:bg-slate-200 text-black font-black rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all transform active:scale-95 text-sm tracking-widest uppercase"
                >
                  確認
                </button>
              </div>
              
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
