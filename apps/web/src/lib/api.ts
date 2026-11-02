import type { Catalog } from './types';
export async function getCatalog(): Promise<Catalog> {
  const response = await fetch(`${process.env.API_URL || 'http://127.0.0.1:4000'}/api/catalog`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Không thể tải bộ hồ sơ từ máy chủ.');
  return response.json();
}
export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
