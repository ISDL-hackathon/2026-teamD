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
  const [loading, setLoading] = useState(false); // 通信中のガード用

  const getLoginUid = () => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("loginUid") || "1");
    }
    return 1;
  };

  // ガチャボタン（1回 / 8回）を押したとき
  const handleGachaStart = (type: 1 | 8) => {
    setGachaType(type);
    setResultImageIndex(2); // 8回ガチャのカウントを初期化
    setStep("CONFIRM");
  };

  // 💡 ダイアログで「はい」を押したときに、バックエンドAPIを叩いてDBに保存させる！
  const handleConfirmYes = async () => {
    if (loading) return;
    setLoading(true);

    const uid = getLoginUid();

    try {
      // 🚀 バックエンドのガチャAPIをフェッチ！（APIエンドポイントが異なる場合はURLを適宜修正してください）
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/gacha/draw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: uid,
          cnt: gachaType, // 1回または8回のカウントを渡す
        }),
      });

      if (response.ok) {
        console.log("🎉 ガチャキャラが正常にDBに保存または更新されました！");
        // 通信が成功したらガチャ動画演出に進む
        setStep("VIDEO");
      } else {
        console.error("ガチャの保存に失敗しました(サーバーエラー)");
        alert("ガチャの処理中にエラーが発生しました。");
        setStep("BASE");
      }
    } catch (error) {
      console.error("ネットワークエラーによりガチャAPIを実行できませんでした:", error);
      alert("通信エラーが発生しました。");
      setStep("BASE");
    } finally {
      setLoading(false);
    }
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
        
        {/* --- STEP 1: 通常のガチャトップ --- */}
        {step === "BASE" && (
          <div 
            className="relative h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/gatya-home.png')" }}
          >
            {/* 1回ガチャ */}
            <button
              onClick={() => handleGachaStart(1)}
              className="absolute left-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="1回ガチャ"
            />

            {/* 8回ガチャ */}
            <button
              onClick={() => handleGachaStart(8)}
              className="absolute right-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="8回ガチャ"
            />

            {/* 最下部ナビゲーション */}
            <nav className="absolute inset-x-0 bottom-0 h-20 bg-transparent flex z-20">
              <button 
                onClick={() => router.push("/character")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="キャラ"
              />
              <button 
                onClick={() => setStep("BASE")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="ガチャ"
              />
              <button 
                onClick={() => router.push("/dashboard")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="ホーム"
              />
              <button 
                onClick={() => router.push("/exchange")} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="交換"
              />
              <button 
                onClick={() => setIsMoreOpen(true)} 
                className="flex-1 bg-transparent active:bg-white/10"
                aria-label="その他"
              />
            </nav>
          </div>
        )}

        {/* --- STEP 2: 確認ダイアログ --- */}
        {step === "CONFIRM" && (
          <div className="relative h-full w-full bg-black">
            <img src={confirmImg} alt="確認ダイアログ" className="h-full w-full object-contain" />
            
            <div className="absolute inset-x-0 bottom-[19%] flex justify-center gap-[10%] px-[15%]">
              {/* 「はい」用ボタン（APIをキック！） */}
              <button 
                onClick={handleConfirmYes} 
                disabled={loading}
                className="h-12 w-28 bg-transparent active:bg-black/10 rounded-lg transition-colors flex items-center justify-center text-white"
                style={{ cursor: "pointer" }}
                aria-label="はい"
              >
                {loading && "通信中..."}
              </button>
              {/* 「いいえ」用ボタン */}
              <button 
                onClick={() => setStep("BASE")} 
                disabled={loading}
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

        {/* --- STEP 4: 結果画像演出 --- */}
        {step === "RESULT_IMAGE" && (
          <div 
            onClick={handleResultImageTap} 
            className="trigger-full-flash h-full w-full bg-black cursor-pointer relative"
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
      <MoreModal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
}