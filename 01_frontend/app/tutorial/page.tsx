"use client";

import { useState } from 'react';
// 🔌 ガチャ画面の部品（TutorialGachaScreen）はすでにScreensに内蔵されているので、一緒にインポートします
import TitleScreen, { RegisterScreen, LoginScreen } from "../../components/ui/tutorial/screens";
// ※ もしTutorialGachaScreenが別で定義されていなければ、Screens.tsxに内蔵されているのでこのままでOKです

export default function GameFlow() {
  const [step, setStep] = useState<'TITLE' | 'REGISTER' | 'LOGIN' | 'SLIDESHOW' | 'GACHA_RESULT'>('TITLE');
  const [slideIndex, setSlideIndex] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  // 💾 バックエンドから返ってきたユーザーIDとキャラクター情報を保管する状態
  const [userId, setUserId] = useState<number>(1);
  const [gachaCharacter, setGachaCharacter] = useState<any>(null);
  const [isGachaLoading, setIsGachaLoading] = useState(false);

  const tutorialSlides = [
    '/tut1.png',  '/tut2.png',  '/tut3.png',  '/tut4.png',  '/tut5.png',
    '/tut6.png',  '/tut7.png',  '/tut8.png',  '/tut9.png',  '/tut10.png',
    '/tut11.png', '/tut12.png', '/tut13.png', '/tut14.png', '/tut15.png',
    '/tut_gacha.mp4', // 🎬 15番目の要素（インデックス15）
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

  // 🎬 ガチャ動画（MP4）が再生し終わった時に呼ばれる処理
  const handleVideoEnded = async () => {
    setMediaError(null);
    setIsGachaLoading(true);

    try {
      console.log(`📡 チュートリアルガチャAPI呼び出し... UID: ${userId}`);
      // 🚀 kawamuraさんの「gatya.py」の窓口を実際に叩きに行きます！
      const res = await fetch('http://localhost:8000/gacha/tutorial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("🎁 ガチャAPIレスポンス成功:", data);
        
        // バックエンドから成功が返ってきたら、ガチャ結果画面へ移行
        if (data.status !== "error") {
          setGachaCharacter(data); // 倉貫さんのデータを保存
          setStep('GACHA_RESULT');  // ➔ 紙芝居を一時中断して、ガチャ結果画面を表示！
        } else {
          alert("ガチャ失敗: " + data.message);
          // 失敗した場合は諦めて次のスライドへ
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
        
        {/* 1. タイトル画面 */}
        {step === 'TITLE' && (
          <TitleScreen 
            onRegisterClick={() => setStep('REGISTER')} 
            onLoginClick={() => setStep('LOGIN')} 
          />
        )}
        
        {/* 2. 新規登録画面 */}
        {step === 'REGISTER' && (
          <RegisterScreen onRegisterSuccess={(uid, name, grade) => {
            setUserId(uid); // 💾 登録時に発行された本当のUIDを記憶する
            setStep('SLIDESHOW');
            setSlideIndex(0);
          }} />
        )}

        {/* 2.5 ログイン画面 */}
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
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    キャラクター召喚中...
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

        {/* 🌟 4. 動画終了後に割り込む、ガチャ結果表示（倉貫さん確定） */}
        {step === 'GACHA_RESULT' && (
          <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center select-none animate-in fade-in duration-500">
            <div className="flex flex-col items-center bg-slate-900/90 p-8 rounded-3xl border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.3)] text-center max-w-sm">
              <span className="text-yellow-400 font-bold tracking-widest text-xs mb-2 block animate-pulse">★ TUTORIAL GET ★</span>
              {/* kawamuraさんのDBに登録されたキャラクター名を表示（無ければデフォルト名） */}
              <h3 className="text-2xl font-black text-white mb-6">😠 {gachaCharacter?.name || "イライラした倉貫さん"}</h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                チュートリアル報酬として、限定キャラクターがあなたのインベントリ（Supabase）に正常に書き込まれました！
              </p>
              <button 
                onClick={() => {
                  setStep('SLIDESHOW'); // 紙芝居（SLIDESHOWモード）に戻る
                  moveToNextSlide();    // 動画の次のスライド（17枚目）へ進める
                }} 
                className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm active:scale-95"
              >
                ストーリーの続きを見る
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}