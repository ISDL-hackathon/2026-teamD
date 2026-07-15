"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MoreModal from "@/components/MoreModal";

type GachaStep = "BASE" | "CONFIRM" | "VIDEO" | "RESULT_IMAGE" | "FINAL_SUMMARY";

export default function GachaPage() {
  const router = useRouter();
  const [step, setStep] = useState<GachaStep>("BASE");
  const [gachaType, setGachaType] = useState<1 | 8>(1);
  const [resultImageIndex, setResultImageIndex] = useState<number>(2);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // ガチャボタン（1回 / 8回）を押したとき
  const handleGachaStart = (type: 1 | 8) => {
    setGachaType(type);
    setResultImageIndex(2); // 8回ガチャのカウントを初期化
    setStep("CONFIRM");
  };

  // ダイアログで「はい」を押したとき
  const handleConfirmYes = () => {
    setStep("VIDEO");
  };

  // 動画演出が終了したとき
  const handleVideoEnded = () => {
    setStep("RESULT_IMAGE");
  };

  // 結果タップ時の挙動
  const handleResultImageTap = () => {
    if (gachaType === 1) {
      setStep("FINAL_SUMMARY");
    } else {
      if (resultImageIndex < 9) {
        setResultImageIndex((prev) => prev + 1);
      } else {
        setStep("FINAL_SUMMARY");
      }
    }
  };

  // 終了してトップに戻る
  const handleFinalSummaryTap = () => {
    setStep("BASE");
  };

  // --- 画像・動画のファイル名割り当て ---
  const confirmImg = gachaType === 1 ? "/gatya1_1.png" : "/gatya8_1.png";
  const videoSrc = gachaType === 1 ? "/gatya1.mp4" : "/gatya8.mp4";
  const resultImg = gachaType === 1 ? "/gatya1_2.png" : `/gatya8_${resultImageIndex}.png`;
  const summaryImg = gachaType === 1 ? "/gatya1_3.png" : "/gatya8_10.png";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#222]">
      {/* 画面アスペクト比を維持するためのコンテナ */}
      <main className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* --- STEP 1: 通常のガチャトップ（背景画像の上に透明ボタン） --- */}
        {step === "BASE" && (
          <div 
            className="relative h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/gatya-home.png')" }}
          >
            {/* 1回ガチャ 16GB ボタン用透明ボックス */}
            <button
              onClick={() => handleGachaStart(1)}
              className="absolute left-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="1回ガチャ"
            />

            {/* 8回ガチャ 128GB ボタン用透明ボックス */}
            <button
              onClick={() => handleGachaStart(8)}
              className="absolute right-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="8回ガチャ"
            />

            {/* 🚨 追加：最下部ナビゲーション用の透明クリックエリア（5分割） 
              画面最下部の高さ20ピクセル（h-20）程度に重なるボタン群です。
            */}
            <nav className="absolute inset-x-0 bottom-0 h-20 bg-transparent flex z-20">
              
              {/* 1. キャラボタン */}
              <button 
                onClick={() => router.push("/character")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="キャラ"
              />

              {/* 2. ガチャボタン（現在地なので画面リフレッシュ、または何もしない） */}
              <button 
                onClick={() => setStep("BASE")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="ガチャ"
              />

              {/* 3. ホームボタン（ダッシュボードへ戻る） */}
              <button 
                onClick={() => router.push("/dashboard")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="ホーム"
              />

              {/* 4. 交換ボタン */}
              <button 
                onClick={() => router.push("/exchange")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="交換"
              />

              {/* 💡 5. その他ボタン: ルーター遷移ではなく、ステートを true にしてポップアップをその場で開く！ */}
              <button 
                onClick={() => setIsMoreOpen(true)} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="その他"
              />

            </nav>
          </div>
        )}

        {/* --- STEP 2: 確認ダイアログ（画像の上に透明ボタン） --- */}
        {step === "CONFIRM" && (
          <div className="relative h-full w-full bg-black">
            <img src={confirmImg} alt="確認ダイアログ" className="h-full w-full object-contain" />
            
            {/* 2つのボタンを囲むコンテナ */}
            <div className="absolute inset-x-0 bottom-[19%] flex justify-center gap-[10%] px-[15%]">
              {/* 「はい」用透明ボタン */}
              <button 
                onClick={handleConfirmYes} 
                className="h-12 w-28 bg-transparent active:bg-black/10 rounded-lg transition-colors"
                style={{ cursor: "pointer" }}
                aria-label="はい"
              />
              {/* 「いいえ」用透明ボタン */}
              <button 
                onClick={() => setStep("BASE")} 
                className="h-12 w-28 bg-transparent active:bg-black/10 rounded-lg transition-colors"
                style={{ cursor: "pointer" }}
                aria-label="いいえ"
              />
            </div>
          </div>
        )}

        {/* --- STEP 3: ガチャ動画演出 --- */}
        {step === "VIDEO" && (
          <div className="h-full w-full bg-black flex items-center justify-center">
            <video 
              src={videoSrc} 
              autoPlay 
              playsInline 
              className="h-full w-full object-contain"
              onEnded={handleVideoEnded}
            />
          </div>
        )}

        {/* --- STEP 4: 結果画像演出（タップで切り替え） --- */}
        {step === "RESULT_IMAGE" && (
  <div 
    onClick={handleResultImageTap} 
    className="trigger-full-flash h-full w-full bg-black cursor-pointer relative" // 👈 trigger-full-flash を追加！
  >
    <img src={resultImg} alt="ガチャ結果" className="h-full w-full object-contain" />
  </div>
)}

        {/* --- STEP 5: 最終まとめ画像 --- */}
        {step === "FINAL_SUMMARY" && (
          <div onClick={handleFinalSummaryTap} className="h-full w-full bg-black cursor-pointer">
            <img src={summaryImg} alt="リザルトまとめ" className="h-full w-full object-contain" />
          </div>
        )}

      </main>
      {/* 💡 画面の最前面（mainの外側）に配置することで、背景画像（ガチャ画面）の上に綺麗に重なります */}
      <MoreModal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
}