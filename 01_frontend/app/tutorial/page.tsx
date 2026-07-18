'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// 提供されたコンポーネントをインポート（パスは実際の環境に合わせて調整してください）
import TitleScreen, { RegisterScreen, LoginScreen } from './_components/screens';

type ScreenMode = 'TITLE' | 'REGISTER' | 'LOGIN' | 'STORY';

export default function TutorialPage() {
  const router = useRouter();
  const [mode, setMode] = useState<ScreenMode>('TITLE');
  const [currentStep, setCurrentStep] = useState(0);
  const [grade, setGrade] = useState('学部4年'); // 登録画面から引き継ぐ学年
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ------------------------------------------
  // 🗺️ 1. 画像と音声の完全マッピング定義（パスを /audio/tutorial に修正）
  // ------------------------------------------
  const getSlideInfo = (stepIndex: number, userGrade: string) => {
    // 📁 音声ファイルが配置されている正確なパス
    const AUDIO_DIR = '/audio/tutorial';

    // 前半：tut1 ~ tut4 (音声 1 ~ 4)
    if (stepIndex >= 0 && stepIndex <= 3) {
      return { type: 'image', src: `/tut${stepIndex + 1}.png`, audio: `${AUDIO_DIR}/${stepIndex + 1}.m4a` };
    }

    // 分岐：tut5 (学部4年) または tut6 (修士1年/2年)
    if (stepIndex === 4) {
      const isU4 = userGrade.includes('4') || userGrade.toUpperCase().includes('U4');
      return {
        type: 'image',
        src: isU4 ? '/tut5.png' : '/tut6.png',
        audio: isU4 ? `${AUDIO_DIR}/5-u4.m4a` : `${AUDIO_DIR}/5-m1m2.m4a`
      };
    }

    // 中盤：tut7 ~ tut14 (音声 6 ~ 13) ※11.m4a は 11-english.m4a
    if (stepIndex >= 5 && stepIndex <= 12) {
      const tutNum = stepIndex + 2;     // step5 -> tut7, step12 -> tut14
      const audioNum = stepIndex + 1;   // step5 -> 6.m4a, step12 -> 13.m4a
      const audioName = audioNum === 11 ? '11-english' : String(audioNum);
      return { type: 'image', src: `/tut${tutNum}.png`, audio: `${AUDIO_DIR}/${audioName}.m4a` };
    }

    // 🎬 動画フェーズ（音声は絶対に流さない）
    if (stepIndex === 13) {
      return { type: 'video', src: '/exchange.mp4', audio: null };
    }

    // 後半：tut17 ~ tut22 (音声 14 ~ 19)
    if (stepIndex >= 14 && stepIndex <= 19) {
      const tutNum = stepIndex + 3;     // step14 -> tut17, step19 -> tut22
      const audioNum = stepIndex;       // step14 -> 14.m4a, step19 -> 19.m4a
      return { type: 'image', src: `/tut${tutNum}.png`, audio: `${AUDIO_DIR}/${audioNum}.m4a` };
    }

    return null;
  };

  const TOTAL_STEPS = 20;
  const currentSlide = getSlideInfo(currentStep, grade);

  // ------------------------------------------
  // 🔊 2. 音声の排他制御・動画割り込み対策
  // ------------------------------------------
  useEffect(() => {
    // STORY（紙芝居）モード以外、またはスライド情報がない時は音声を停止して終了
    if (mode !== 'STORY' || !currentSlide) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      return;
    }

    // 🛑 新しいステップに来たら、前の音声を即座に完全停止
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // 動画ステップ、または音声が定義されていない場合は何も再生しない
    if (currentSlide.type === 'video' || !currentSlide.audio) {
      return;
    }

    // 新しい音声オブジェクトを作成して再生
    const audio = new Audio(currentSlide.audio);
    audioRef.current = audio;

    audio.play().catch((err) => {
      console.warn("音声の再生に失敗しました:", err);
    });

    // クリーンアップ
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [currentStep, mode, grade, currentSlide]);

  // ------------------------------------------
  // 🕹️ 3. ナビゲーション処理（全画面タップ）
  // ------------------------------------------
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      router.push('/dashboard');
    }
  };

  // ------------------------------------------
  // 📱 4. 画面モードに応じたレンダリング
  // ------------------------------------------
  return (
    <div className="relative w-full max-w-[400px] h-screen bg-black mx-auto overflow-hidden select-none text-white flex flex-col justify-center items-center">
      
      {/* 1. タイトル画面 */}
      {mode === 'TITLE' && (
        <TitleScreen 
          onRegisterClick={() => setMode('REGISTER')} 
          onLoginClick={() => setMode('LOGIN')} 
        />
      )}

      {/* 2. 新規登録画面 */}
      {mode === 'REGISTER' && (
        <RegisterScreen 
          onRegisterSuccess={(name, userGrade) => {
            setGrade(userGrade); // 選択された学年を保存
            setMode('STORY');    // 紙芝居（ストーリー）モードを開始
          }} 
        />
      )}

      {/* 3. ログイン画面 */}
      {mode === 'LOGIN' && (
        <LoginScreen 
          onLoginSuccess={() => {
            // screens.tsx側で window.location.href が走るため、ここは予備の空関数
          }} 
        />
      )}

      {/* 4. 本編ストーリー（紙芝居 ＆ 動画） */}
      {mode === 'STORY' && currentSlide && (
        <div className="w-full h-full relative">
          
          {/* 🖼️ 紙芝居：全画面タップだけでサクサク進む */}
          {currentSlide.type === 'image' && currentSlide.src && (
            <div 
              onClick={handleNext}
              className="w-full h-full bg-contain bg-no-repeat bg-center cursor-pointer"
              style={{ backgroundImage: `url(${currentSlide.src})` }}
            />
          )}

          {/* 🎬 動画エリア：再生終了後に自動で次のステップ（tut17）へ */}
          {currentSlide.type === 'video' && currentSlide.src && (
            <video 
              src={currentSlide.src} 
              autoPlay 
              playsInline 
              onEnded={handleNext}
              className="w-full h-full object-cover"
            />
          )}

        </div>
      )}

    </div>
  );
}