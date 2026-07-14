'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface CharacterProfile {
  id: number;
  name: string;
  grade?: string;
  birthday?: string;
  hobby?: string;
  role?: string;
  lab_group?: string;
  title_comment?: string;
}

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [ownedIds, setOwnedIds] = useState<number[]>([]);
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loginUid = 1;

  useEffect(() => {
    const fetchOwnedList = async () => {
      try {
        // 🔥 修正したバックエンドに合わせて `/character/owned` に変更
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/character/owned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: loginUid }),
        });
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setOwnedIds(data.map((c: any) => c.id));
        }
      } catch (err) {
        console.error('IDリストの取得に失敗しました', err);
      }
    };
    fetchOwnedList();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // 🔥 修正したバックエンドに合わせて `/character/profile` に変更
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/character/profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: loginUid, cid: parseInt(id) }),
        });
        
        if (!response.ok) {
          throw new Error('プロフィールの取得に失敗しました');
        }

        const data = await response.json();
        if (data) {
          setProfile(data);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'データ通信エラー');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (ownedIds.length <= 1) return;
    const currentIdx = ownedIds.indexOf(parseInt(id));
    if (currentIdx === -1) return;

    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= ownedIds.length) nextIdx = 0;
    else if (nextIdx < 0) nextIdx = ownedIds.length - 1;

    router.push(`/character/${ownedIds[nextIdx]}`);
  };

  return (
    <div style={{
      position: 'relative', width: '100%', maxWidth: '400px', height: '100vh', margin: '0 auto',
      backgroundImage: 'url("/character.png"), linear-gradient(180deg, #1a0b2e 0%, #05020a 100%)',
      backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
      backgroundColor: '#000', overflow: 'hidden', color: '#fff', fontFamily: 'sans-serif'
    }}>

      {!loading && !error && profile && (
        <div style={{
          position: 'absolute', top: '9%', left: '0', width: '100%', textAlign: 'center',
          fontSize: '18px', fontWeight: 'bold', color: '#fff', textShadow: '2px 2px 4px #000', zIndex: 6
        }}>
          {profile.title_comment || 'メンバープロフィール'}
        </div>
      )}

      {ownedIds.length > 1 && (
        <div 
          onClick={() => handleNavigate('prev')}
          style={{
            position: 'absolute', top: '42%', left: '0', width: '20%', height: '12%',
            backgroundColor: 'transparent', cursor: 'pointer', zIndex: 5
          }}
        />
      )}

      {ownedIds.length > 1 && (
        <div 
          onClick={() => handleNavigate('next')}
          style={{
            position: 'absolute', top: '42%', right: '0', width: '20%', height: '12%',
            backgroundColor: 'transparent', cursor: 'pointer', zIndex: 5
          }}
        />
      )}

      <div style={{
        position: 'absolute', top: '63%', left: '4%', width: '92%', height: '23%',
        display: 'flex', flexDirection: 'column', gap: '4px',
        fontSize: '16px', fontWeight: 'bold', color: '#fff', textAlign: 'left',
        textShadow: '2px 2px 3px #000', zIndex: 4
      }}>
        {loading && <p style={{ textAlign: 'center' }}>読み込み中...</p>}
        {error && <p style={{ color: '#ff6b6b', textAlign: 'center' }}>{error}</p>}
        {!loading && !error && profile && (
          <>
            <div>名前：{profile.name}</div>
            <div>学年：{profile.grade || '---'}</div>
            <div>誕生日：{profile.birthday || '---'}</div>
            <div>趣味：{profile.hobby || '---'}</div>
            <div>役割：{profile.role || '---'}</div>
            <div>研究班：{profile.lab_group || '---'}</div>
          </>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '11%', display: 'flex', zIndex: 20 }}>
        <div onClick={() => router.push('/character')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/gacha')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/dashboard')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/stay/exchange')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
        <div onClick={() => router.push('/settings')} style={{ flex: 1, cursor: 'pointer', backgroundColor: 'transparent' }} />
      </div>
    </div>
  );
}