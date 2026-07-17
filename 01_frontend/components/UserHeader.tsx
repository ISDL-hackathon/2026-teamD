'use client';

import { useState, useEffect } from 'react';
import { api } from '../app/auth/api'; // 👈 パスはそのまま維持

// 🌟 親からユーザーデータを受け取れるように Props の型を定義
interface UserHeaderProps {
  username?: string;
  userGb?: number | null;
}

export default function UserHeader({ username: propUsername, userGb: propGb }: UserHeaderProps) {
  const [username, setUsername] = useState('読み込み中...');
  const [userGb, setUserGb] = useState<number | null>(null);

  // 1️⃣ 親コンポーネント（GachaPage等）から Props が更新されたら、ヘッダーの表示も同期する
  useEffect(() => {
    if (propUsername !== undefined) {
      setUsername(propUsername);
    }
  }, [propUsername]);

  useEffect(() => {
    if (propGb !== undefined) {
      setUserGb(propGb);
    }
  }, [propGb]);

  // 2️⃣ 既存の「GET /users/me」取得処理（Propsがない場合のみ自律動作）
  useEffect(() => {
    // 💡 重要：親からPropsが渡されている場合は、このコンポーネントでのAPI呼び出しをスキップする（二重呼び出し防止）
    if (propUsername !== undefined && propGb !== undefined && propGb !== null) {
      return;
    }

    // キャッシュ（ローカルストレージ）から即座に表示
    const storedUsername = localStorage.getItem('username');
    const storedGb = localStorage.getItem('userGb');

    if (storedUsername && propUsername === undefined) setUsername(storedUsername);
    if (storedGb && propGb === undefined) setUserGb(Number(storedGb));

    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/me');
        
        if (response.status === 200 && response.data && response.data.status === "success") {
          const { name, gb } = response.data.user;
          
          if (propUsername === undefined) {
            setUsername(name);
            localStorage.setItem('username', name);
          }
          if (propGb === undefined) {
            setUserGb(gb);
            localStorage.setItem('userGb', String(gb));
          }
        }
      } catch (error) {
        console.error('❌ ユーザー情報の取得に失敗しました:', error);
        if (!storedUsername && propUsername === undefined) setUsername('ISDL メンバー');
        if (!storedGb && propGb === undefined) setUserGb(0);
      }
    };

    fetchUserData();
  }, [propUsername, propGb]); // Propsの有無を監視

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