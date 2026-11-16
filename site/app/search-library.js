'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';

export default function SearchLibrary({ items }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const categories = ['All', ...new Set(items.map(x => x.category || 'General'))];
  const filtered = useMemo(() => items.filter(x => {
    const text = `${x.title} ${x.description} ${x.category} ${x.fileName}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (category === 'All' || (x.category || 'General') === category);
  }), [items, query, category]);
  return <>
    <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search PDFs and videos…" aria-label="Search media" />
    <nav className="filters">{categories.map(c => <button key={c} className={`filter ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
    {filtered.length ? <div className="grid">{filtered.map(item => <article className="card" key={item.id}>
      <div className="kind">{item.type === 'video' ? '▶ VIDEO' : '▤ PDF'} · {item.category || 'General'}</div>
      <h2><Link href={`/media/${item.id}`}>{item.title}</Link></h2>
      <p className="desc">{item.description || 'Open this resource to view or download it.'}</p>
      <div className="actions"><Link className="btn" href={`/media/${item.id}`}>Open</Link><a className="btn light" href={item.url} download>Download</a></div>
    </article>)}</div> : <div className="empty">No matching files found.</div>}
  </>;
}
