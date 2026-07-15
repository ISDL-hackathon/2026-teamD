'use client';

import { useState, useEffect } from 'react';
import FooterNav from "@/components/FooterNav";

interface DbCharacterDetails {
  img1: string | null;
  name: string;
  grade: string;
}

interface DbOwnedCharacter {
  cid: number;
  characters: DbCharacterDetails;
}

interface CharacterProfile {
  cid: number;
  name: string;
  grade: string;
  img1: string | null;
  lab?: string;
  town?: string;
  hobby?: string;
  role?: string;
  quote?: string;
  birthday?: string;
  group?: string;
}

const characterMasterData: Record<string, Partial<CharacterProfile>> = {
  "永野喜大": { lab: "ISDL", town: "京都", hobby: "コード書き", role: "リーダー", quote: "よろしく！", birthday: "10月12日", group: "Rec班" },
  "中村泰輔": { lab: "ISDL", town: "大阪", hobby: "読書", role: "開発", quote: "頑張ります。", birthday: "4月20日", group: "Dev班" },
  "浄慶航太": { lab: "ISDL", town: "兵庫", hobby: "ドライブ, KPOP", role: "チーフ", quote: "後輩に仕事を振るのが得意です", birthday: "9月9日", group: "Rec班" },
  "淨慶航太": { lab: "ISDL", town: "兵庫", hobby: "ドライブ, KPOP", role: "チーフ", quote: "後輩に仕事を振るのが得意です", birthday: "9月9日", group: "Rec班" },
  "倉貫翔真": { lab: "ISDL", town: "滋賀", hobby: "サウナ", role: "マネジメント", quote: "進捗どうですか？", birthday: "12月25日", group: "Rec班" },
  "阿部勝寿": { lab: "ISDL", town: "大阪", hobby: "ゲーム", role: "開発", quote: "コツコツ進めます", birthday: "1月15日", group: "Dev班" },
  "河村一樹": { lab: "ISDL", town: "奈良", hobby: "旅行", role: "デザイン", quote: "画面をかっこよくします！", birthday: "8月3日", group: "UI班" },
  "疋田智佳子": { lab: "ISDL", town: "京都", hobby: "映画鑑賞", role: "企画", quote: "最高のアプリにしましょう", birthday: "5月17日", group: "UI班" },
};

export default function CharacterPage() {
  const [characters, setCharacters] = useState<CharacterProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const loginUid = localStorage.getItem('loginUid') || '1';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/character/owned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: Number(loginUid) })
        });

        if (res.ok) {
          const data: DbOwnedCharacter[] = await res.json();
          
          // ─── 🔴 データベースのカラム覗き見ログ ───
          if (data && data.length > 0) {
            console.log("=== DBにある【親オブジェクト】の項目一覧 ===", Object.keys(data[0]));
            if (data[0].characters) {
              console.log("=== DBにある【characters】テーブルのカラム一覧 ===", Object.keys(data[0].characters));
              console.log("=== 生のサンプルデータ1件 ===", JSON.stringify(data[0].characters, null, 2));
            }
          }
          // ──────────────────────────────────────────

          const fullDataList = (data || []).map((item) => {
            const inner = item.characters;
            const cName = inner?.name || "";
            const cGrade = inner?.grade || "";
            const cImg = inner?.img1 ? inner.img1.trim() : null;
            const cCid = item.cid || 0;

            const master = characterMasterData[cName] || {};

            return {
              cid: cCid,
              name: cName,
              grade: cGrade,
              img1: cImg,
              lab: master.lab || "未設定",
              town: master.town || "未設定",
              hobby: master.hobby || "未設定",
              role: master.role || "未設定",
              quote: master.quote || "自己紹介は未設定です。",
              birthday: master.birthday || "未設定",
              group: master.group || "未設定"
            };
          });

          setCharacters(fullDataList);
        } else {
          setError("キャラクターの取得に失敗しました");
        }
      } catch (err) {
        const mock = [
          { cid: 1, name: "永野喜大", grade: "M2", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nagano_1.png" },
          { cid: 2, name: "中村泰輔", grade: "U4", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nakamura_1.png" },
          { cid: 3, name: "淨慶航太", grade: "M1", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/jokei_1.png" },
          { cid: 6, name: "河村一樹", grade: "U4", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/kawamura_1.png" },
        ].map(item => ({
          ...item,
          ...(characterMasterData[item.name] || {})
        })) as CharacterProfile[];
        setCharacters(mock);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

  //const handleSetHomeCharacter = (cid: number) => {
   // localStorage.setItem('homeCharacterCid', String(cid));
   // alert(`${selectedChar?.name} をホーム画面のキャラクターに設定しました！`);
  //};

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : characters.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex === null) return;
    setSelectedIndex((prev) => (prev !== null && prev < characters.length - 1 ? prev + 1 : 0));
  };

  const selectedChar = selectedIndex !== null ? characters[selectedIndex] : null;

  return (
    <div 
      className="relative w-full max-w-[400px] h-screen overflow-hidden bg-cover bg-center mx-auto text-white"
      style={{ backgroundImage: `url('/chara_table.png')`, backgroundColor: '#121212' }}
    >
      
      {/* ─── 一覧画面 ─── */}
      {selectedChar === null ? (
        <div className="w-full h-full px-4 pt-4 pb-24 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <h2 className="text-lg font-black text-[#f1c40f] mb-3 border-b border-white/20 pb-1.5">
            所持キャラクター一覧
          </h2>

          <div className="grid grid-cols-3 gap-2">
            {characters.map((item, index) => (
              <div 
                key={item.cid} 
                onClick={() => setSelectedIndex(index)}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-[#1a1a1a]/90 cursor-pointer shadow-md active:scale-95 transition-transform"
              >
                {item.img1 ? (
                  <img src={item.img1} alt={item.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl bg-slate-800">👤</div>
                )}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent p-1 text-center">
                  <p className="text-[8px] text-[#f1c40f] font-bold leading-none m-0">{item.grade}</p>
                  <p className="text-[10px] font-black truncate m-0 mt-0.5">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── 詳細画面（元の迫力サイズに戻した版） ─── */
        <div className="relative w-full h-full overflow-hidden bg-black/20">
          
          {/* 画像サイズをh-[75vh]に戻し、存在感を引き出す */}
          {selectedChar.img1 ? (
            <div 
              className="absolute top-4 left-0 w-full h-[75vh] bg-contain bg-no-repeat bg-top z-1" 
              style={{ backgroundImage: `url(${selectedChar.img1})` }}
            />
          ) : (
            <div className="absolute top-4 left-0 w-full h-[75vh] flex items-center justify-center bg-slate-900 text-5xl text-slate-700 z-1">👤</div>
          )}

          {/* 戻るボタンの位置調整（元の高さ付近に配置） */}
          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-8 left-4 z-10 bg-black/70 border border-white/20 text-white px-4 py-2 rounded-full font-bold text-xs active:bg-black/90"
          >
            ← 戻る
          </button>

          {/* 矢印ボタンのサイズを力強い大きさに復元 */}
          <button 
            onClick={handlePrev}
            className="absolute left-2.5 top-[35%] -translate-y-1/2 z-10 bg-black/60 rounded-full w-11 h-11 flex items-center justify-center text-white text-2xl font-bold active:bg-black/80"
          >
            ‹
          </button>

          <button 
            onClick={handleNext}
            className="absolute right-2.5 top-[35%] -translate-y-1/2 z-10 bg-black/60 rounded-full w-11 h-11 flex items-center justify-center text-white text-2xl font-bold active:bg-black/80"
          >
            ›
          </button>

          {/* グレースケール詳細エリア（元のゆったりした大きさに戻し、フッターより十分上の位置へ） */}
          <div className="absolute bottom-[110px] left-3 right-3 z-5 bg-gradient-to-t from-black/95 via-black/90 to-black/85 border border-white/10 rounded-xl p-4 shadow-xl max-h-[220px] overflow-y-auto text-xs">
            
            <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md text-center mb-2.5 italic text-indigo-200 text-xs">
              &ldquo;{selectedChar.quote}&rdquo;
            </div>

            <h2 className="text-lg font-black text-white border-b border-white/20 pb-1 mb-2.5 flex justify-between items-center">
              <span>{selectedChar.name}</span>
              <span className="text-xs text-[#f1c40f] font-bold bg-white/10 px-2 py-0.5 rounded">{selectedChar.grade}</span>
            </h2>
            
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 mb-3 leading-relaxed">
              <div><strong className="text-[#f1c40f]">誕生日:</strong> {selectedChar.birthday}</div>
              <div><strong className="text-[#f1c40f]">研究室:</strong> {selectedChar.lab}</div>
              <div><strong className="text-[#f1c40f]">出身:</strong> {selectedChar.town}</div>
              <div><strong className="text-[#f1c40f]">研究班:</strong> {selectedChar.group}</div>
              <div className="col-span-2"><strong className="text-[#f1c40f]">趣味:</strong> {selectedChar.hobby}</div>
              <div className="col-span-2"><strong className="text-[#f1c40f]">役割:</strong> {selectedChar.role}</div>
            </div>

            
          </div>
        </div>
      )}

      <FooterNav />
    </div>
  );
}