import { getCatalog } from '@/lib/api';
import { Museum } from '@/components/museum';
export const dynamic = 'force-dynamic';
export default async function HomePage() { return <Museum data={await getCatalog()} view="home" />; }
