"use client";

export default function DashboardPage() {
  return (
    <div className="w-screen h-screen bg-gray-200 flex justify-center items-center select-none font-sans">
      
      {/* 🌟 メイン画面：将来的にキャンパスの背景画像などを敷く想定のベース */}
      <main className="w-full max-w-[430px] h-full relative overflow-hidden flex flex-col bg-white shadow-xl"
            style={{ 
              // 実際の背景画像が入るまでのダミー（空と建物を思わせるグラデーション）
              backgroundImage: 'linear-gradient(to bottom, #8cb8d9 0%, #dbe4ea 40%, #c4b5a9 100%)' 
            }}>

        {/* 🌟 ヘッダー部分（タイトル画面のポップなテイストに合わせる） */}
        <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-20">
          
          {/* 左上：名前とランク */}
          <div className="flex flex-col gap-1">
            {/* 太めの枠線でポップに */}
            <div className="bg-blue-50 border-[3px] border-blue-500 rounded-xl px-3 py-1 flex items-center shadow-md">
              <span className="text-base mr-1">👦</span>
              <span className="text-slate-800 font-bold text-sm tracking-wider">kawamura</span>
            </div>
            <div className="ml-2">
              <span className="bg-amber-400 text-white text-[11px] font-black px-2 py-0.5 rounded-md shadow-sm border border-amber-500">
                Rank 10
              </span>
            </div>
          </div>

          {/* 右上：所持GB */}
          <div className="bg-amber-50 border-[3px] border-amber-500 rounded-xl px-3 py-1 flex items-center shadow-md">
            <span className="text-base mr-1">💎</span>
            <span className="text-slate-800 font-black text-sm tracking-wider">1,200</span>
          </div>
        </header>

        {/* 🌟 中央部分（キャラクター表示） */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 mt-12">
          
          {/* いずれ画像のような立ち絵が入る想定（現在はモック用の絵文字） */}
          <div className="text-[150px] drop-shadow-xl animate-[bounce_3s_ease-in-out_infinite]">
            😠
          </div>
          
          {/* キャラクター名表示（ポップなプレート風） */}
          <div className="mt-4 flex flex-col items-center">
            <div className="bg-white border-[3px] border-slate-400 px-6 py-2 rounded-full shadow-md">
              <h2 className="text-slate-800 font-black tracking-widest text-base">倉貫さん</h2>
            </div>
            <p className="text-white text-xs font-black mt-2 tracking-wider bg-slate-700/60 px-3 py-1 rounded-full backdrop-blur-sm">
              Lv. 1
            </p>
          </div>
        </div>

        {/* 🌟 下部メニュー（タイトル画面の「新規登録」ボタンを踏襲したデザイン） */}
        <div className="w-full px-4 pb-8 pt-4 z-20">
          <div className="grid grid-cols-4 gap-2">
            
            {/* ボタン1: 会話（ロゴの青色ベース） */}
            <button className="bg-[#e0f2fe] border-[4px] border-[#3b82f6] rounded-2xl pb-3 pt-3 flex flex-col items-center justify-center shadow-md active:translate-y-1 active:shadow-none transition-all group">
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">💬</span>
              <span className="text-slate-800 text-[11px] font-black tracking-widest mt-1">会話</span>
            </button>

            {/* ボタン2: キャラ（ロゴの緑色ベース） */}
            <button className="bg-[#dcfce7] border-[4px] border-[#22c55e] rounded-2xl pb-3 pt-3 flex flex-col items-center justify-center shadow-md active:translate-y-1 active:shadow-none transition-all group">
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">👥</span>
              <span className="text-slate-800 text-[11px] font-black tracking-widest mt-1">キャラ</span>
            </button>

            {/* ボタン3: ガチャ（ロゴの黄色ベース） */}
            <button className="bg-[#fef3c7] border-[4px] border-[#f59e0b] rounded-2xl pb-3 pt-3 flex flex-col items-center justify-center shadow-md active:translate-y-1 active:shadow-none transition-all group">
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🎰</span>
              <span className="text-slate-800 text-[11px] font-black tracking-widest mt-1">ガチャ</span>
            </button>

            {/* ボタン4: 交換所（ロゴのピンク色ベース） */}
            <button className="bg-[#fce7f3] border-[4px] border-[#ec4899] rounded-2xl pb-3 pt-3 flex flex-col items-center justify-center shadow-md active:translate-y-1 active:shadow-none transition-all group">
              <span className="text-3xl mb-1 group-hover:scale-110 transition-transform">🛍️</span>
              <span className="text-slate-800 text-[11px] font-black tracking-widest mt-1">交換</span>
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}