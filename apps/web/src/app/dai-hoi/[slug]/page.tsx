import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/api';
import { Museum } from '@/components/museum';
export const dynamic = 'force-dynamic';
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const data = await getCatalog();
  return { title: data.congresses.find(c => c.id === slug)?.name || 'Không tìm thấy' };
}
export default async function CongressPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const data = await getCatalog();
  if (!data.congresses.some(c => c.id === slug)) notFound();
  return <Museum data={data} view="congress" slug={slug} />;
}
