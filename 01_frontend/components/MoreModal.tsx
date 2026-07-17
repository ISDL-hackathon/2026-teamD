"use client";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MoreModal({ isOpen, onClose }: MoreModalProps) {
  // フラグが立っていないときは何も表示しない
  if (!isOpen) return null;

  return (
    // 💡 fixed inset-0 bg-black/40 で、今の画面の上を薄暗い半透明の膜で覆います
    <div 
      onClick={onClose} // 画面のどこをタップしても閉じる
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] cursor-pointer select-none"
    >
      {/* 白いポップアップ（other.jpgの形状を再現） */}
      <div 
        onClick={(e) => {
          // 白い部分をタップしたときも今回は「もう一度タップしたら閉じる」仕様なので、
          // あえて e.stopPropagation() はせず、そのまま onClose を発火させます。
        }}
        className="w-[85%] aspect-[4/3] max-w-[360px] rounded-[40px] bg-white px-8 py-10 flex flex-col items-center justify-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <p className="text-base font-bold leading-relaxed text-slate-800">
          この機能は今後アップデートで追加予定です。
        </p>
      </div>
    </div>
  );
}