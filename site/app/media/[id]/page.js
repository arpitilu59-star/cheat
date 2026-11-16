import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCatalog, mediaHref } from '../../../lib/catalog';

export const revalidate = 60;

export async function generateStaticParams() {
  const items = await getCatalog();
  return items.map(item => ({ id: String(item.id) }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const item = (await getCatalog()).find(x => String(x.id) === id);
  if (!item) return { title: 'Media not found' };
  return {
    title: item.title,
    description: item.description || `${item.title} – ${item.type} in ${item.category || 'General'}`
  };
}

export default async function MediaPage({ params }) {
  const { id } = await params;
  const item = (await getCatalog()).find(x => String(x.id) === id);
  if (!item) notFound();
  const url = mediaHref(item);
  return <main className="shell">
    <Link href="/" className="back">← Back to library</Link>
    <div className="eyebrow">{item.type === 'video' ? 'VIDEO' : 'PDF'} · {item.category || 'General'}</div>
    <h1 style={{fontSize:'clamp(30px,5vw,46px)'}}>{item.title}</h1>
    <p className="sub">{item.description}</p>
    <div className="actions">
      <a className="btn" href={url} download>Download for offline</a>
      <a className="btn light" href={url} target="_blank" rel="noreferrer">Open original file</a>
    </div>
    <section className="viewer">
      {item.type === 'video'
        ? <video controls playsInline preload="metadata" src={url}>Your browser cannot play this video.</video>
        : <iframe src={`${url}#toolbar=1`} title={item.title} />}
    </section>
    <p className="sub">Tip: Download this file while online to view it later without internet on this device.</p>
  </main>;
}
