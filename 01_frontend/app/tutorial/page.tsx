// app/tutorial/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import TitleScreen, { RegisterScreen, LoginScreen } from "./_components/screens";
import { api } from '../auth/api';

type TutorialSlide = {
  mediaSrc: string;
  audioSrc: string | null;
};

type TutorialGachaResponse = {
  status?: string;
  message?: string;
  name?: string;
};

export default function GameFlow() {
  const [step, setStep] = useState<'TITLE' | 'REGISTER' | 'LOGIN' | 'SLIDESHOW' | 'GACHA_RESULT'>('TITLE');
  const [slideIndex, setSlideIndex] = useState(0);
  const [grade, setGrade] = useState('学部4年');
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioNeedsGesture, setAudioNeedsGesture] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioAutoplayRef = useRef(true);

  const [gachaCharacter, setGachaCharacter] = useState<TutorialGachaResponse | null>(null);
  const [isGachaLoading, setIsGachaLoading] = useState(false);

  // 🌟 タップした場所の座標を保存する状態
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const tutorialSlides = useMemo<TutorialSlide[]>(() => {
    const gradeSlide = grade.startsWith('修士')
      ? { mediaSrc: '/tut6.png', audioSrc: '/audio/tutorial/5-m1m2.m4a' }
      : { mediaSrc: '/tut5.png', audioSrc: '/audio/tutorial/5-u4.m4a' };

    return [
      { mediaSrc: '/tut1.png', audioSrc: '/audio/tutorial/1.m4a' },
      { mediaSrc: '/tut2.png', audioSrc: '/audio/tutorial/2.m4a' },
      { mediaSrc: '/tut3.png', audioSrc: '/audio/tutorial/3.m4a' },
      { mediaSrc: '/tut4.png', audioSrc: '/audio/tutorial/4.m4a' },
      gradeSlide,
      { mediaSrc: '/tut7.png', audioSrc: '/audio/tutorial/6.m4a' },
      { mediaSrc: '/tut8.png', audioSrc: '/audio/tutorial/7.m4a' },
      { mediaSrc: '/tut9.png', audioSrc: '/audio/tutorial/8.m4a' },
      { mediaSrc: '/tut10.png', audioSrc: '/audio/tutorial/9.m4a' },
      { mediaSrc: '/tut11.png', audioSrc: '/audio/tutorial/10.m4a' },
      { mediaSrc: '/tut12.png', audioSrc: '/audio/tutorial/11-english.m4a' },
      { mediaSrc: '/tut13.png', audioSrc: '/audio/tutorial/12.m4a' },
      { mediaSrc: '/tut14.png', audioSrc: '/audio/tutorial/13.m4a' },
      { mediaSrc: '/tut15.png', audioSrc: '/audio/tutorial/14.m4a' },
      { mediaSrc: '/tut_gacha.mp4', audioSrc: '/audio/tutorial/15.m4a' },
      { mediaSrc: '/tut17.png', audioSrc: '/audio/tutorial/16.m4a' },
      { mediaSrc: '/tut18.png', audioSrc: '/audio/tutorial/17.m4a' },
      { mediaSrc: '/tut19.png', audioSrc: '/audio/tutorial/18.m4a' },
      { mediaSrc: '/tut20.png', audioSrc: '/audio/tutorial/kuranuki-v2.m4a' },
      // 00_docs の tutorial フォルダには、この画面用の音声素材がありません。
      { mediaSrc: '/tut21.png', audioSrc: null },
      { mediaSrc: '/tut22.png', audioSrc: '/audio/tutorial/19.m4a' },
    ];
  }, [grade]);

  const currentSlide = tutorialSlides[slideIndex];
  const currentPath = currentSlide?.mediaSrc;
  const currentAudioPath = currentSlide?.audioSrc;
  const isMp4 = currentPath?.endsWith('.mp4');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsAudioPlaying(false);
    setAudioNeedsGesture(false);

    if (step !== 'SLIDESHOW' || !currentAudioPath || !audioAutoplayRef.current) return;

    audio.load();
    void audio.play().catch(() => {
      // Chrome/Safari が音声の自動再生を止めた場合は、再生ボタンを案内する。
      setIsAudioPlaying(false);
      setAudioNeedsGesture(true);
    });

    return () => {
      audio.pause();
    };
  }, [currentAudioPath, step]);

  const handleAudioToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !currentAudioPath) return;

    if (isAudioPlaying) {
      audioAutoplayRef.current = false;
      audio.pause();
      return;
    }

    audioAutoplayRef.current = true;
    setAudioNeedsGesture(false);
    audio.currentTime = 0;
    void audio.play().catch(() => {
      setAudioNeedsGesture(true);
    });
  };

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

  // 🌟 ガチャ呼び出し時に Body は送信しないように変更！
  const handleVideoEnded = async () => {
    setMediaError(null);
    setIsGachaLoading(true);

    try {
      console.log("📡 チュートリアルガチャAPI呼び出し... (Bodyなし)");
      const res = await api.post<TutorialGachaResponse>('/gacha/tutorial');

      const data = res.data;
      console.log("🎁 ガチャAPIレスポンス成功:", data);

      if (data.status !== "error") {
        setGachaCharacter(data);
        setStep('GACHA_RESULT');
      } else {
        alert("ガチャ失敗: " + data.message);
        moveToNextSlide();
      }
    } catch (error) {
      console.error("ガチャ通信エラー:", error);
      alert("ガチャAPIとの通信に失敗しました。");
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
          <RegisterScreen onRegisterSuccess={(name, grade) => {
            // ユーザー特定をトークンで行うため、userIdの保持は不要に
            setGrade(grade);
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
            {currentAudioPath && (
              <>
                <audio
                  ref={audioRef}
                  src={currentAudioPath}
                  preload="auto"
                  onPlay={() => {
                    setIsAudioPlaying(true);
                    setAudioNeedsGesture(false);
                  }}
                  onPause={() => setIsAudioPlaying(false)}
                  onEnded={() => setIsAudioPlaying(false)}
                  onError={() => setMediaError(`音声ファイルが見つかりません:\npublic${currentAudioPath}`)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'max(12px, env(safe-area-inset-top))',
                    right: '12px',
                    zIndex: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '6px',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleAudioToggle}
                    aria-pressed={isAudioPlaying}
                    style={{
                      border: '1px solid rgba(255,255,255,0.6)',
                      borderRadius: '999px',
                      background: 'rgba(0,0,0,0.72)',
                      color: '#fff',
                      padding: '9px 13px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    {isAudioPlaying ? '🔊 音声を停止' : '▶ 音声を再生'}
                  </button>
                  {audioNeedsGesture && (
                    <span
                      style={{
                        maxWidth: '190px',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.72)',
                        color: '#fff',
                        padding: '5px 8px',
                        fontSize: '11px',
                        lineHeight: 1.4,
                      }}
                    >
                      ブラウザの制限により、ボタンを押すと音声が流れます
                    </span>
                  )}
                </div>
              </>
            )}

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

            {mediaError && (
              <div
                role="alert"
                style={{
                  position: 'absolute',
                  left: '16px',
                  right: '16px',
                  bottom: '16px',
                  zIndex: 70,
                  borderRadius: '10px',
                  background: 'rgba(127, 29, 29, 0.92)',
                  color: '#fff',
                  padding: '12px',
                  whiteSpace: 'pre-line',
                  fontSize: '12px',
                }}
              >
                {mediaError}
              </div>
            )}
          </div>
        )}

        {/* ガチャ結果画面 */}
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
                    データベースとの同期完了。

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