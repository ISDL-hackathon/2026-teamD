'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CharacterDetails {
  name: string;
  grade: string;
  img1: string | null;
}

interface OwnedCharacter {
  cid: number;              // 💡 id から cid に変更
  characters: CharacterDetails; // 💡 ネストされたキャラクター情報構造を追加
}

export default function CharacterListPage() {
  const router = useRouter();
  const [characters, setCharacters] = useState<OwnedCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loginUid = 1;

  useEffect(() => {
    const fetchOwnedCharacters = async () => {
      try {
        // 🔥 修正したバックエンドに合わせて `/character/owned` に変更
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/character/owned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: loginUid }),
        });
        
        if (!response.ok) {
          throw new Error(`データの取得に失敗しました (Status: ${response.status})`);
        }

        const data = await response.json();
        if (data) {
          setCharacters(data);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || '通信エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };
    fetchOwnedCharacters();
  }, []);

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 'url("/chara_back.png"), linear-gradient(180deg, #111936 0%, #060913 100%)',
      backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      backgroundColor: '#060913', overflow: 'hidden'
    }}>
      
      <div style={{
        position: 'absolute', top: '6%', left: '0', width: '100%', textAlign: 'center',
        color: '#fff', fontSize: '20px', fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        所持キャラクター一覧
      </div>

      <div style={{
        position: 'absolute', top: '15%', left: '5%', width: '90%', height: '70%',
        overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 2
      }}>
        {loading && <p style={{ color: '#fff', textAlign: 'center', marginTop: '20px' }}>読み込み中...</p>}
        {error && !loading && <p style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>{error}</p>}
        {!loading && !error && characters.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', marginTop: '20px' }}>所持しているキャラクターがいません</p>}
            {!loading && !error && characters.map((char) => (
      <button
        key={char.cid} // 💡 char.id から char.cid に変更！
        onClick={() => router.push(`/character/${char.cid}`)} // 💡 char.id から char.cid に変更！
        style={{
          // 既存のスタイルがあればここにそのまま残してください
          padding: '10px',
          margin: '5px',
          display: 'block',
          width: '100%'
        }}
      >
        {/* 💡 名前は char.characters.name の中にあるので、安全にオプショナルチェーニング（?.）で取得 */}
        {char.characters?.name || "名前なし"} 
        <span className="text-xs text-slate-400 ml-2">
          ({char.characters?.grade || "学年なし"})
        </span>
      </button>
    ))}
      </div>

      <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '11%', display: 'flex', zIndex: 20 }}>
        <div style={{ flex: 1, backgroundColor: 'transparent' }} title="キャラ（現在地）" />
        <div onClick={() => router.push('/gacha')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/dashboard')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/stay/exchange')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/settings')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
      </div>
    </div>
  );
}