// components/UserHeader.tsx
'use client';

import { useState, useEffect } from 'react';
import { api } from '../app/auth/api'; // 👈 componentsと同じ高さにあるapp/auth/apiを参照

export default function UserHeader() {
  const [username, setUsername] = useState('読み込み中...');
  const [userGb, setUserGb] = useState<number | null>(null);

  useEffect(() => {
    // 1️⃣ まずはローカルストレージ（キャッシュ）から即座に表示（チラつき防止）
    const storedUsername = localStorage.getItem('username');
    const storedGb = localStorage.getItem('userGb');

    if (storedUsername) setUsername(storedUsername);
    if (storedGb) setUserGb(Number(storedGb));

    // 2️⃣ 既存の「GET /users/me」を叩いて最新情報を取得し同期
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/me'); // 👈 routerのprefix「/users」に合わせる
        
        if (response.status === 200 && response.data && response.data.status === "success") {
          const { name, gb } = response.data.user; // 👈 レスポンスの user から抽出
          
          setUsername(name);
          setUserGb(gb);
          
          // 次回表示のためにローカルストレージも最新状態に更新
          localStorage.setItem('username', name);
          localStorage.setItem('userGb', String(gb));
        }
      } catch (error) {
        console.error('❌ ユーザー情報の取得に失敗しました:', error);
        // 万が一通信エラーが起きても画面が壊れないようにフォールバック
        if (!storedUsername) setUsername('ISDL メンバー');
        if (!storedGb) setUserGb(0);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: '15px 10px',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      {/* 👤 ユーザー名表示 */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#333',
        padding: '6px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold',
        border: '1.5px solid #333', boxShadow: '2px 2px 0px #000'
      }}>
        {username}
      </div>

      {/* 🔋 GB表示 */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)', color: '#333',
        padding: '6px 14px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold',
        border: '1.5px solid #333', boxShadow: '2px 2px 0px #000'
      }}>
        🔋 {userGb !== null ? userGb : '--'} GB
      </div>
    </div>
  );
}