import { redirect } from 'next/navigation';

export default function RootPage() {
  // 正面入り口（/）に来た人を、自動的にダッシュボード（/dashboard）へ案内する
  redirect('/tutorial');
}