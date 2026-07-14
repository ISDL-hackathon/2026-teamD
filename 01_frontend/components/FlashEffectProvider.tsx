"use client";

import { useState, useEffect } from "react";

// タップした点の情報を管理する型
interface TapEffect {
  id: number;
  x: number;
  y: number;
}

export default function FlashEffectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tapEffects, setTapEffects] = useState<TapEffect[]>([]);
  const [fullScreenFlash, setFullScreenFlash] = useState(false);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // 1. 全体フラッシュのイベント（クラス名に 'trigger-full-flash' が含まれる場合）が発火したか検知
      const target = e.target as HTMLElement;
      if (target && target.closest(".trigger-full-flash")) {
        // 全体フラッシュを発生させる
        setFullScreenFlash(false);
        setTimeout(() => {
          setFullScreenFlash(true);
        }, 10);
        return; // 全体フラッシュの時は局所エフェクトはスキップ
      }

      // 2. 通常時はタップ位置（局所的）にエフェクトを発生
      const newEffect: TapEffect = {
        id: Date.now() + Math.random(),
        x: e.pageX,
        y: e.pageY,
      };

      setTapEffects((prev) => [...prev, newEffect]);
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // 局所エフェクトを発生させて、0.3秒後にリストから削除する
  useEffect(() => {
    if (tapEffects.length > 0) {
      const timer = setTimeout(() => {
        setTapEffects((prev) => prev.slice(1)); // 一番古いエフェクトを削除
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [tapEffects]);

  // 全体フラッシュを一定時間で消す
  useEffect(() => {
    if (fullScreenFlash) {
      const timer = setTimeout(() => {
        setFullScreenFlash(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [fullScreenFlash]);

  return (
    <>
      {children}

      {/* 💥 1. タップした場所（局所的）に発生する波紋エフェクト */}
      {tapEffects.map((eff) => (
        <span
          key={eff.id}
          className="pointer-events-none fixed rounded-full bg-white/40 animate-ping z-[99999]"
          style={{
            top: eff.y - 10, // サークルの半径分ずらして中心に合わせる
            left: eff.x - 10,
            width: "20px",
            height: "20px",
          }}
        />
      ))}

      {/* 💥 2. 画面全体を覆うフラッシュ演出エフェクト（ガチャ等用） */}
      {fullScreenFlash && (
        <div className="fixed inset-0 bg-white/10 animate-ping pointer-events-none z-[99999]" />
      )}
    </>
  );
}