import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/api';
import { Museum } from '@/components/museum';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCatalog(); const leader = data.leaders.find(l => l.slug === slug);
  return { title: leader?.name || 'Không tìm thấy hồ sơ', description: leader?.summary };
}
export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const data = await getCatalog();
  if (!data.leaders.some(l => l.slug === slug)) notFound();
  return <Museum data={data} view="profile" slug={slug} />;
}
