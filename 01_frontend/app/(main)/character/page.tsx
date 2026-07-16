'use client';

import { useState, useEffect } from 'react';
import FooterNav from "@/components/FooterNav";
import { api } from "../../auth/api"; 

interface DbCharacterDetails {
  img1: string | null;
  name: string;
  grade: string;
  // 🌟【重要】エラーを消すために、オプショナルプロパティとして追加！
  lab?: string;
  town?: string;
  hobby?: string;
  role?: string;
  quote?: string;
  birth?: string; // DBから返ってくる「birth」も念のため追加
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
  "進慶航太": { lab: "ISDL", town: "兵庫", hobby: "ドライブ, KPOP", role: "チーフ", quote: "後輩に仕事を振るのが得意です", birthday: "9月9日", group: "Rec班" }, 
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

  const [detailProfile, setDetailProfile] = useState<CharacterProfile | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 🌟【新規追加】ホーム設定の通信中を管理するステート
  const [settingHome, setSettingHome] = useState(false);

  // ① 一覧用データのフェッチ
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const res = await api.post('/character/owned');

        if (res.status === 200 || res.data) {
          const data: DbOwnedCharacter[] = res.data;
          
          const fullDataList = (data || []).map((item) => {
            const inner = item.characters;
            // 🌟 全ての文字列から改行コード(\r\n)を徹底的に除去する処理
            const clean = (str: any) => str ? String(str).replace(/[\r\n]+/g, "").trim() : "";

            const cName = clean(inner?.name);
            const cGrade = clean(inner?.grade);
            const cImg = inner?.img1 ? clean(inner.img1) : null; // URL末尾の\r\nを完全抹殺
            const cCid = item.cid || 0;

            const master = characterMasterData[cName] || {};

            return {
              cid: cCid,
              name: cName,
              grade: cGrade,
              img1: cImg,
              lab: clean(inner?.lab) || master.lab || "未設定",
              town: clean(inner?.town) || master.town || "未設定",
             hobby: clean(inner?.hobby) || master.hobby || "未設定",
              role: clean(inner?.role) || master.role || "未設定",
              quote: clean(inner?.quote) || master.quote || "自己紹介は未設定です。",
              birthday: clean(inner?.birth) || master.birthday || "未設定",
              group: master.group || "未設定"
            };
          });

          setCharacters(fullDataList);
        } else {
          setError("キャラクターの取得に失敗しました");
        }
      } catch (err) {
        console.warn("API取得に失敗したため、フォールバックします:", err);
        const mock = [
          { cid: 1, name: "永野喜大", grade: "M2", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nagano_1.png" },
          { cid: 2, name: "中村泰輔", grade: "U4", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/nakamura_1.png" },
          { cid: 3, name: "浄慶航太", grade: "M1", img1: "https://eoaxgmhcsaowfycmuovr.supabase.co/storage/v1/object/public/character/jokei_1.png" },
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

  // ② 詳細画面用データのフェッチ
  useEffect(() => {
    if (selectedIndex === null) {
      setDetailProfile(null);
      return;
    }

    const fetchCharacterDetail = async () => {
      const currentListChar = characters[selectedIndex];
      if (!currentListChar) return;

      try {
        setDetailLoading(true);
        const res = await api.post('/character/profile', { cid: currentListChar.cid });

        if (res.data && res.data.length > 0) {
          const dbData = res.data[0];
          const inner = dbData.characters;

          // 🌟 ここでも改行コードを徹底的に除去
          const clean = (str: any) => str ? String(str).replace(/[\r\n]+/g, "").trim() : "";
          const cName = clean(inner?.name);
          const cGrade = clean(inner?.grade);
          const cImg = inner?.img1 ? clean(inner.img1) : null; // URLを綺麗にする
  
          const master = characterMasterData[cName] || {};

          setDetailProfile({
            cid: currentListChar.cid,
            name: cName,
            grade: cGrade,
            img1: cImg,
            lab: clean(inner?.lab) || master.lab || "未設定",
            town: clean(inner?.town) || master.town || "未設定",
            hobby: clean(inner?.hobby) || master.hobby || "未設定",
            role: clean(inner?.role) || master.role || "未設定",
            quote: clean(inner?.quote) || master.quote || "自己紹介は未設定です。", // セリフ末尾の\r\nを消す
            birthday: clean(inner?.birth) || master.birthday || "未設定",
            group: master.group || "未設定"
          });
        }
      } catch (err) {
        console.error("詳細データの取得に失敗したため、一覧のデータを使用します:", err);
        setDetailProfile(currentListChar);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchCharacterDetail();
  }, [selectedIndex, characters]);

  // 🌟【新規追加】③ ホームキャラクター設定APIを叩く関数
  const handleSetHomeCharacter = async (cid: number) => {
    try {
      setSettingHome(true);
      
      // 他の通信と同様、エンドポイントが `/character/home-character` であると想定しています
      const res = await api.post('/character/home-character', { cid });

      if (res.data && res.data.status === "error") {
        alert(`❌ エラー: ${res.data.message}`);
      } else {
        // 🌟【重要】設定に成功したキャラの情報をローカルストレージに保存する！
      localStorage.setItem('my_home_char', JSON.stringify({
        cid: res.data.cid,
        name: res.data.name,
        img1: res.data.img1
      }));
        alert(`🏠 ${res.data.name || "キャラクター"} をホーム画面に設定しました！`);
      }
    } catch (err) {
      console.error("ホームキャラクターの設定に失敗しました:", err);
      alert("⚠️ ホーム設定の通信に失敗しました。");
    } finally {
      setSettingHome(false);
    }
  };

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
  const displayChar = detailProfile || selectedChar;

  return (
    <div 
      className="relative w-full max-w-[400px] h-screen overflow-hidden bg-cover bg-center mx-auto text-white"
      style={{ backgroundImage: `url('/chara_table.png')`, backgroundColor: '#121212' }}
    >
      {selectedChar === null ? (
        <div className="w-full h-full px-4 pt-4 pb-24 overflow-y-auto bg-black/40 backdrop-blur-sm">
          <h2 className="text-lg font-black text-[#f1c40f] mb-3 border-b border-white/20 pb-1.5">
            所持キャラクター一覧
          </h2>

          {loading ? (
            <p className="text-center text-sm text-slate-400 mt-10">読み込み中...</p>
          ) : (
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
          )}
        </div>
      ) : (
        <div className="relative w-full h-full overflow-hidden bg-black/20">
          {displayChar?.img1 ? (
            <div 
              className="absolute top-4 left-0 w-full h-[75vh] bg-contain bg-no-repeat bg-top z-1" 
              style={{ backgroundImage: `url(${displayChar.img1})` }}
            />
          ) : (
            <div className="absolute top-4 left-0 w-full h-[75vh] flex items-center justify-center bg-slate-900 text-5xl text-slate-700 z-1">👤</div>
          )}

          <button 
            onClick={() => setSelectedIndex(null)}
            className="absolute top-8 left-4 z-10 bg-black/70 border border-white/20 text-white px-4 py-2 rounded-full font-bold text-xs active:bg-black/90"
          >
            ← 戻る
          </button>

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

          {/* ステータスボード */}
          <div className="absolute bottom-[110px] left-3 right-3 z-5 bg-gradient-to-t from-black/95 via-black/90 to-black/85 border border-white/10 rounded-xl p-4 shadow-xl max-h-[220px] overflow-y-auto text-xs">
            {detailLoading ? (
              <div className="text-center text-slate-400 py-8 flex flex-col items-center justify-center gap-2">
                <span className="animate-spin text-lg">⏳</span>
                <span>プロフィールを同期中...</span>
              </div>
            ) : displayChar ? (
              <>
                <div className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-md text-center mb-2.5 italic text-indigo-200 text-xs">
                  &ldquo;{displayChar.quote}&rdquo;
                </div>

                <h2 className="text-lg font-black text-white border-b border-white/20 pb-1 mb-2.5 flex justify-between items-center">
                  <span>{displayChar.name}</span>
                  <span className="text-xs text-[#f1c40f] font-bold bg-white/10 px-2 py-0.5 rounded">{displayChar.grade}</span>
                </h2>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-300 mb-3 leading-relaxed">
                  <div><strong className="text-[#f1c40f]">誕生日:</strong> {displayChar.birthday}</div>
                  <div><strong className="text-[#f1c40f]">研究室:</strong> {displayChar.lab}</div>
                  <div><strong className="text-[#f1c40f]">出身:</strong> {displayChar.town}</div>
                  <div><strong className="text-[#f1c40f]">研究班:</strong> {displayChar.group}</div>
                  <div className="col-span-2"><strong className="text-[#f1c40f]">趣味:</strong> {displayChar.hobby}</div>
                  <div className="col-span-2"><strong className="text-[#f1c40f]">役割:</strong> {displayChar.role}</div>
                </div>

                {/* 🌟【新規追加】ホーム設定ボタン */}
                <button
                  onClick={() => handleSetHomeCharacter(displayChar.cid)}
                  disabled={settingHome}
                  className="w-full mt-2 bg-[#f1c40f] hover:bg-[#d4ac0d] text-black font-black py-2 rounded-lg shadow-md active:scale-95 transition-transform disabled:opacity-50 text-center text-xs"
                >
                  {settingHome ? "🏠 設定中..." : "🏠 このキャラをホームに設定"}
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      <FooterNav />
    </div>
  );
}