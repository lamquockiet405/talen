import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'Dấu ấn lịch sử — Các đời Tổng Bí thư Việt Nam', template: '%s | Dấu ấn lịch sử' },
  description: 'Không gian tra cứu lịch sử các đời Tổng Bí thư Việt Nam: hồ sơ nhân vật, dòng thời gian, các kỳ Đại hội và tư liệu có dẫn nguồn.',
  applicationName: 'Dấu ấn lịch sử',
  icons: { icon: '/icon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" suppressHydrationWarning><body>{children}</body></html>;
}
