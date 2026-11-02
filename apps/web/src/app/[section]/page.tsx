import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/api';
import { Museum } from '@/components/museum';
export const dynamic = 'force-dynamic';
const views: Record<string, { view: string; title: string }> = {
  'cac-tong-bi-thu': { view: 'leaders', title: 'Hồ sơ các nhà lãnh đạo' },
  'dong-thoi-gian': { view: 'timeline', title: 'Dòng thời gian 1930–2026' },
  'cac-ky-dai-hoi': { view: 'congresses', title: 'Các kỳ Đại hội' },
  'tu-lieu': { view: 'documents', title: 'Thư viện tư liệu' },
  'nguon-tham-khao': { view: 'sources', title: 'Nguồn tham khảo' },
  'so-sanh': { view: 'compare', title: 'So sánh hồ sơ' },
  'tim-kiem': { view: 'search', title: 'Tìm kiếm tư liệu' },
  'lich-su-chuc-danh': { view: 'titles', title: 'Lịch sử chức danh' },
  'kiem-chung': { view: 'audit', title: 'Đối chiếu dữ kiện' },
  'gioi-thieu': { view: 'about', title: 'Về dự án' },
};
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return { title: views[section]?.title || 'Không tìm thấy' }; }
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!views[section]) notFound();
  return <Museum data={await getCatalog()} view={views[section].view} />;
}
