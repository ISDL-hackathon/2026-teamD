export const authService = {
  // トークンを保存する
  setSession: (accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', accessToken);
    }
  },
  // トークンを削除する（ログアウト）
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
};