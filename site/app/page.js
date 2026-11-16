import Link from 'next/link';
import { getCatalog } from '../lib/catalog';
import SearchLibrary from './search-library';

export const revalidate = 60;

export default async function Home() {
  const items = await getCatalog();
  return <main className="shell">
    <header className="top"><Link className="brand" href="/">◫ Public Media Library</Link><span className="tag">OPEN ACCESS · NO LOGIN</span></header>
    <section className="hero">
      <div className="eyebrow">Your digital resource shelf</div>
      <h1>Find. Read. Watch.</h1>
      <p className="sub">Explore public PDFs and videos. Save files to your device to access them offline.</p>
    </section>
    <SearchLibrary items={items} />
    <footer className="footer">Public media library · Files are provided by the library owner</footer>
  </main>;
}
