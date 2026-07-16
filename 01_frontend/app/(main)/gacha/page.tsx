"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoreModal from "@/components/MoreModal";
import UserHeader from "../../../components/UserHeader";
import { api } from "../../auth/api"; 

type GachaStep = "BASE" | "CONFIRM" | "VIDEO" | "RESULT_IMAGE" | "FINAL_SUMMARY";

// ⭐️ ガチャのコスト設定を修正（1回 16GB / 8回 128GB）
const GACHA_COST_PER_DRAW = 16;

export default function GachaPage() {
  const router = useRouter();
  const [step, setStep] = useState<GachaStep>("BASE");
  const [gachaType, setGachaType] = useState<1 | 8>(1);
  const [resultImageIndex, setResultImageIndex] = useState<number>(2);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  
  // ユーザーの現在の所持GBを管理するステート
  const [userGb, setUserGb] = useState<number | null>(null);

  // マウント時、および「BASE」画面に戻ったタイミングで最新のGBを取得する
  useEffect(() => {
    const fetchUserGb = async () => {
      try {
        const response = await api.get("/users/me");
        if (response.data && typeof response.data.gb === "number") {
          setUserGb(response.data.gb);
          console.log(`現在の所持GB: ${response.data.gb}`);
        }
      } catch (error) {
        console.error("ユーザー情報の取得に失敗しました:", error);
      }
    };

    if (step === "BASE") {
      fetchUserGb();
    }
  }, [step]);

  // ガチャボタン（1回 / 8回）を押したとき
  const handleGachaStart = (type: 1 | 8) => {
    const requiredGb = type * GACHA_COST_PER_DRAW; // 1回なら 16GB, 8回なら 128GB

    // 所持GBが足りない場合はここでブロック！
    if (userGb !== null && userGb < requiredGb) {
      alert(`GB（ガチャパワー）が足りません！\n所持: ${userGb} GB / 必要: ${requiredGb} GB`);
      return; 
    }

    setGachaType(type);
    setResultImageIndex(2); 
    setStep("CONFIRM");
  };

  // ダイアログで「はい」を押したとき
  const handleConfirmYes = async () => {
    if (loading) return;

    // 「はい」を押したタイミングでも二重チェック
    const requiredGb = gachaType * GACHA_COST_PER_DRAW;
    if (userGb !== null && userGb < requiredGb) {
      alert("GB（ガチャパワー）が不足しているため、ガチャを実行できません。");
      setStep("BASE");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/gacha/draw", {
        cnt: gachaType, 
      });

      if (response.status === 200 || response.data) {
        console.log("🎉 ガチャキャラが正常にDBに保存または更新されました！");
        setStep("VIDEO");
      } else {
        console.error("ガチャの保存に失敗しました(サーバーエラー)");
        alert("ガチャの処理中にエラーが発生しました。");
        setStep("BASE");
      }
    } catch (error: any) {
      console.error("ネットワークエラーによりガチャAPIを実行できませんでした:", error);
      alert(error.response?.data?.message || "通信エラーが発生しました。");
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

  const confirmImg = gachaType === 1 ? "/gatya1_1.png" : "/gatya8_1.png";
  const videoSrc = gachaType === 1 ? "/gatya1.mp4" : "/gatya8.mp4";
  const resultImg = gachaType === 1 ? "/gatya1_2.png" : `/gatya8_${resultImageIndex}.png`;
  const summaryImg = gachaType === 1 ? "/gatya1_3.png" : "/gatya8_10.png";

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#222]">
      <main className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* --- STEP 1: 通常のガチャトップ --- */}
        {step === "BASE" && (
          <div 
            className="relative h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/gatya-home.png')" }}
          >
            <div className="absolute top-0 left-0 w-full z-20">
              <UserHeader />
            </div>

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
              <button onClick={() => router.push("/character")} className="flex-1 bg-transparent active:bg-white/10" aria-label="キャラ" />
              <button onClick={() => setStep("BASE")} className="flex-1 bg-transparent active:bg-white/10" aria-label="ガチャ" />
              <button onClick={() => router.push("/dashboard")} className="flex-1 bg-transparent active:bg-white/10" aria-label="ホーム" />
              <button onClick={() => router.push("/exchange")} className="flex-1 bg-transparent active:bg-white/10" aria-label="交換" />
              <button onClick={() => setIsMoreOpen(true)} className="flex-1 bg-transparent active:bg-white/10" aria-label="その他" />
            </nav>
          </div>
        )}

        {/* --- STEP 2: 確認ダイアログ --- */}
        {step === "CONFIRM" && (
          <div className="relative h-full w-full bg-black">
            <img src={confirmImg} alt="確認ダイアログ" className="h-full w-full object-contain" />
            
            <div className="absolute inset-x-0 bottom-[19%] flex justify-center gap-[10%] px-[15%]">
              <button 
                onClick={handleConfirmYes} 
                disabled={loading}
                className="h-12 w-28 bg-transparent active:bg-black/10 rounded-lg transition-colors flex items-center justify-center text-white font-bold"
                style={{ cursor: "pointer" }}
                aria-label="はい"
              >
                {loading ? "通信中..." : ""}
              </button>
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
          <div onClick={handleResultImageTap} className="trigger-full-flash h-full w-full bg-black cursor-pointer relative">
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