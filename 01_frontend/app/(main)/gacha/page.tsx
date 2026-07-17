"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MoreModal from "@/components/MoreModal";
import UserHeader from "../../../components/UserHeader";
import { api } from "../../auth/api"; 

type GachaStep = "BASE" | "CONFIRM" | "VIDEO" | "RESULT_IMAGE" | "FINAL_SUMMARY";

interface DrawnCharacter {
  cid: number;
  name: string;
  prefix?: string;
  img1?: string;
  quote?: string;
  rare?: string;
}

const GACHA_COST_PER_DRAW = 16;

export default function GachaPage() {
  const router = useRouter();
  const [step, setStep] = useState<GachaStep>("BASE");
  const [gachaType, setGachaType] = useState<1 | 8>(1);
  
  const [resultImageIndex, setResultImageIndex] = useState<number>(0);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [loading, setLoading] = useState(false); 
  
  // 🌟 ユーザー名と所持GBのステート
  const [username, setUsername] = useState<string>("読み込み中...");
  const [userGb, setUserGb] = useState<number | null>(null);

  const [drawnCharacters, setDrawnCharacters] = useState<DrawnCharacter[]>([]);

  // 1️⃣ マウント時にローカルストレージから即時にキャッシュを読み込んでチラつきを防止
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedGb = localStorage.getItem('userGb');
    if (storedUsername) setUsername(storedUsername);
    if (storedGb) setUserGb(Number(storedGb));
  }, []);

  // 2️⃣ 最新のユーザー情報・GBを同期する（stepがBASEになったときだけ発火）
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/me");
        console.log("✏️ [DEBUG] GET /users/me response:", response.data);
        
        if (response.data && response.data.status === "success" && response.data.user) {
          const { name, gb } = response.data.user;
          const gbNum = Number(gb);

          if (name) {
            setUsername(name);
            localStorage.setItem('username', name);
          }

          if (!isNaN(gbNum)) {
            setUserGb(gbNum);
            localStorage.setItem('userGb', String(gbNum));
            console.log(`🎉 所持GBの同期に成功しました！: ${gbNum} GB`);
          }
        } else {
          // 異常系ハンドリング
          const keys = response.data?.user ? Object.keys(response.data.user).join(", ") : "なし";
          alert(
            `⚠️【警告】userデータは届きましたが、その中に 'gb' がありません。\n\n` +
            `userオブジェクト内のキー一覧: [ ${keys} ]`
          );
        }
      } catch (error: any) {
        console.error("ユーザー情報の取得に失敗しました:", error);
      }
    };

    if (step === "BASE") {
      fetchUserData();
    }
  }, [step]);

  const handleGachaStart = (type: 1 | 8) => {
    const requiredGb = type * GACHA_COST_PER_DRAW;

    if (userGb === null) {
      alert("ユーザー情報を読み込み中です。しばらくしてから再度お試しください。");
      return;
    }

    if (userGb < requiredGb) {
      alert(`GB（ガチャパワー）が足りません！\n所持: ${userGb} GB / 必要: ${requiredGb} GB`);
      return; 
    }

    setGachaType(type);
    setResultImageIndex(0); 
    setStep("CONFIRM");
  };

  const handleConfirmYes = async () => {
    if (loading) return;

    const requiredGb = gachaType * GACHA_COST_PER_DRAW;
    if (userGb !== null && userGb < requiredGb) {
      alert("GB（ギガバイト）が不足しているため、ガチャを実行できません。");
      setStep("BASE");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/gacha/draw", {
        cnt: gachaType, 
      });

      if (
        response.status === 200 && 
        response.data && 
        response.data.status === "success" && 
        response.data.character
      ) {
        console.log("🎉 ガチャ結果を正常に受信しました！", response.data);
        
        const charData = response.data.character;
        const characters = Array.isArray(charData) ? charData : [charData];
        setDrawnCharacters(characters);
        setResultImageIndex(0); 

        setStep("VIDEO");
      } else {
        const errMsg = response.data?.message || "ガチャの処理中にエラーが発生しました。";
        console.error("ガチャ失敗:", errMsg);
        alert(errMsg);
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

  const handleVideoEnded = () => {
    setStep("RESULT_IMAGE");
  };

  const handleResultImageTap = () => {
    if (gachaType === 1) {
      setStep("FINAL_SUMMARY");
    } else {
      if (resultImageIndex < drawnCharacters.length - 1) {
        setResultImageIndex((prev) => prev + 1);
      } else {
        setStep("FINAL_SUMMARY");
      }
    }
  };

  const handleFinalSummaryTap = () => {
    setStep("BASE");
  };

  const confirmImg = gachaType === 1 ? "/gatya1_1.png" : "/gatya8_1.png";
  const videoSrc = gachaType === 1 ? "/gatya1.mp4" : "/gatya8.mp4";

  const currentCharacter = drawnCharacters[resultImageIndex];

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#222]">
      <main className="relative flex h-full w-full max-w-[430px] flex-col overflow-hidden bg-black shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* --- STEP 1: 通常のガチャトップ --- */}
        {step === "BASE" && (
          <div 
            className="relative h-full w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/gatya-home.png')" }}
          >
            {/* 🌟 修正ポイント: 親の最新Stateをそのまま Props として渡します */}
            <div className="absolute top-0 left-0 w-full z-20">
              <UserHeader username={username} userGb={userGb} />
            </div>

            <button
              onClick={() => handleGachaStart(1)}
              className="absolute left-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="1回ガチャ"
            />

            <button
              onClick={() => handleGachaStart(8)}
              className="absolute right-[6%] bottom-[16%] h-[12%] w-[42%] bg-transparent active:bg-white/10 rounded-[20px] transition-colors z-10"
              style={{ cursor: "pointer" }}
              aria-label="8回ガチャ"
            />

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
        {step === "RESULT_IMAGE" && currentCharacter && (
          <div 
            onClick={handleResultImageTap} 
            className="relative h-full w-full bg-black cursor-pointer overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-[12%] left-0 w-full text-center z-20 px-4">
              <p className="text-yellow-400 font-bold text-xs tracking-wider uppercase drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] animate-pulse">
                NEW CHARACTER!
              </p>
              <h2 className="text-white font-black text-2xl mt-1 tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                {currentCharacter.prefix ? `${currentCharacter.prefix} ` : ""}{currentCharacter.name}
              </h2>
            </div>

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center w-full h-[65%] z-0">
              <img 
                src={currentCharacter.img1 || "/fallback_character.png"} 
                alt={currentCharacter.name} 
                className="max-h-full max-w-full object-contain animate-fade-in"
              />
            </div>

            <div className="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-black via-black/85 to-transparent z-10 pointer-events-none" />

            <div className="absolute bottom-[10%] left-0 w-full px-8 z-20 text-center">
              {currentCharacter.quote && (
                <p className="text-white text-base font-bold leading-relaxed tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  「 {currentCharacter.quote} 」
                </p>
              )}
            </div>
          </div>
        )}

        {/* --- STEP 5: 最終まとめ --- */}
        {step === "FINAL_SUMMARY" && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-30 animate-fade-in">
            <div className="w-full max-h-[75%] bg-gradient-to-b from-[#1a1a1c] to-[#0a0a0c] border border-yellow-500/30 rounded-2xl shadow-[0_0_25px_rgba(234,179,8,0.25)] p-5 flex flex-col">
              
              <div className="text-center mb-4 border-b border-white/10 pb-3">
                <h3 className="text-lg font-black text-yellow-400 tracking-widest">
                  GACHA RESULT
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  獲得したメンバー一覧
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {drawnCharacters.map((char, index) => (
                  <div 
                    key={`${char.cid}-${index}`}
                    className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-2.5 hover:bg-white/10 transition-colors"
                  >
                    <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-yellow-400 to-amber-500 text-black shadow-sm tracking-wide shrink-0">
                      {char.rare || "SSR"}
                    </span>

                    <div className="flex-1 truncate">
                      <p className="text-white font-black text-sm truncate">
                        {char.prefix ? (
                          <span className="text-yellow-400/80 mr-1 font-bold text-xs">
                            [{char.prefix}]
                          </span>
                        ) : null}
                        {char.name}
                      </p>
                    </div>
                    
                    {char.img1 ? (
                      <img 
                        src={char.img1} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover object-top border border-white/10 bg-neutral-800 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs shrink-0 border border-white/10">👤</div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinalSummaryTap}
                className="w-full mt-5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all text-center text-xs tracking-widest"
              >
                閉じる
              </button>

            </div>
          </div>
        )}

      </main>
      <MoreModal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </div>
  );
}