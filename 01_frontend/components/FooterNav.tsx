"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import MoreModal from "./MoreModal";

export default function FooterNav() {
  const router = useRouter();
  const pathname = usePathname(); // 現在どのページにいるかを取得
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // 現在のページと同じボタンが押された時の処理
  const handleNav = (path: string) => {
    if (pathname === path) {
      // すでにそのページにいる場合は、画面のトップに戻すなどの処理（あるいは何もしない）
      return;
    }
    router.push(path);
  };

  return (
    <>
      {/* 5分割の透明なナビゲーションバー */}
      <nav className="absolute inset-x-0 bottom-0 h-20 bg-transparent flex z-40">
        {/* 1. キャラボタン */}
        <button 
          onClick={() => handleNav("/character")} 
          className="flex-1 bg-transparent active:bg-white/10"
          aria-label="キャラ"
        />

        {/* 2. ガチャボタン */}
        <button 
          onClick={() => handleNav("/gacha")} 
          className="flex-1 bg-transparent active:bg-white/10"
          aria-label="ガチャ"
        />

        {/* 3. ホーム（dashboard）ボタン */}
        <button 
          onClick={() => handleNav("/dashboard")} 
          className="flex-1 bg-transparent active:bg-white/10"
          aria-label="ホーム"
        />

        {/* 4. 交換ボタン */}
        <button 
          onClick={() => handleNav("/exchange")} 
          className="flex-1 bg-transparent active:bg-white/10"
          aria-label="交換"
        />

        {/* 5. その他ボタン (URL遷移せず、その場でポップアップを開く) */}
        <button 
          onClick={() => setIsMoreOpen(true)} 
          className="flex-1 bg-transparent active:bg-white/10"
          aria-label="その他"
        />
      </nav>

      {/* 💥 その他が押された時に画面最前面に重なるポップアップ */}
      <MoreModal isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
}
