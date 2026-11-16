export async function getCatalog() {
  const base = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '');
  if (!base) return [];
  try {
    const res = await fetch(`${base}/catalog.json`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
export function mediaHref(item) {
  return item.url || `${process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, '')}/${item.key}`;
}
