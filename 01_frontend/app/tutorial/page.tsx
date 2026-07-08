"use client";

import { useState } from 'react';
import TitleScreen, { RegisterScreen, LoginScreen } from "../../components/ui/tutorial/screens";


export default function GameFlow() {
  const [step, setStep] = useState<'TITLE' | 'REGISTER' |  'LOGIN'|'SLIDESHOW'>('TITLE');
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const tutorialSlides = [
    '/tut1.png',  '/tut2.png',  '/tut3.png',  '/tut4.png',  '/tut5.png',
    '/tut6.png',  '/tut7.png',  '/tut8.png',  '/tut9.png',  '/tut10.png',
    '/tut11.png', '/tut12.png', '/tut13.png', '/tut14.png', '/tut15.png',
    '/tut_gacha.mp4',
    '/tut17.png', '/tut18.png', '/tut19.png', '/tut20.png', '/tut21.png', '/tut22.png'
  ];

  const currentPath = tutorialSlides[slideIndex];
  const isMp4 = currentPath?.endsWith('.mp4');

  const handleSlideTap = () => {
    if (isMp4) return;
    setMediaError(null);

    if (slideIndex < tutorialSlides.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      alert("チュートリアルが全て完了しました！");
      window.location.href = '/dashboard';
    }
  };

  const handleVideoEnded = () => {
    setMediaError(null);
    if (slideIndex < tutorialSlides.length - 1) {
      setSlideIndex(slideIndex + 1);
    }
  };

  return (
    <div style={{ background: '#222', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
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
        
               {/* 1. タイトル画面（縦ボックスを消し、左右の箱クリックで状態移行） */}
          {step === 'TITLE' && (
            <TitleScreen 
              onRegisterClick={() => setStep('REGISTER')} 
              onLoginClick={() => setStep('LOGIN')} 
            />
          )}

          {/* 2. 新規登録画面 */}
          {step === 'REGISTER' && (
            <RegisterScreen onRegisterSuccess={(userId, name, grade) => {
              setStep('SLIDESHOW');
              setSlideIndex(0);
            }} />
          )}

          {/* 🌟 2.5 ログイン画面（モックを廃止し、バックエンド通信に対応！） */}
          {step === 'LOGIN' && (
            <LoginScreen onLoginSuccess={() => {
              window.location.href = '/dashboard';
            }} />
          )}  

        {/* 3. チュートリアル紙芝居＋動画画面 */}
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
              background: '#111'
            }}
          >
            {isMp4 ? (
              <video 
                src={currentPath} 
                autoPlay 
                playsInline 
                muted 
                onEnded={handleVideoEnded} 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setMediaError(`動画ファイルが見つかりません:\npublic${currentPath}`)}
              />
            ) : (
              <img 
                src={currentPath} 
                alt="Tutorial" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => setMediaError(`画像ファイルが見つかりません:\npublic${currentPath}`)}
              />
            )}

            {isMp4 && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'transparent' }} />
            )}

            {mediaError && (
              <div style={{ position: 'absolute', background: 'rgba(255,0,0,0.9)', color: '#fff', padding: '20px', margin: '20px', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'pre-wrap', zIndex: 999, textAlign: 'center' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>【ファイル読み込みエラー】</strong>
                {mediaError}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}