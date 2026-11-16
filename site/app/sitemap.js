import { getCatalog } from '../lib/catalog';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.vercel.app';
  const items = await getCatalog();
  return [
    { url: base, lastModified: new Date() },
    ...items.map(item => ({
      url: `${base}/media/${item.id}`,
      lastModified: item.uploadedAt ? new Date(item.uploadedAt) : new Date()
    }))
  ];
}
