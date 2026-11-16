import './globals.css';

export const metadata = {
  title: { default: 'Public Media Library', template: '%s | Public Media Library' },
  description: 'Browse, read and download public PDFs and videos.'
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
