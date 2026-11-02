'use client';
import { RefreshCw } from 'lucide-react';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="standalone"><span className="eyebrow">DẤU ẤN LỊCH SỬ</span><h1>Kho tư liệu đang gián đoạn.</h1><p>Chưa kết nối được máy chủ dữ liệu. Vui lòng kiểm tra Express và PostgreSQL hoặc thử lại sau ít phút.</p><button className="button" onClick={reset}><RefreshCw size={17} /> Thử tải lại</button><a href="/">Về trang chủ</a></main>;
}
