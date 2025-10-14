// app/layout.tsx
import './globals.css'; // optional, if you have global styles
import Link from 'next/link';

export const metadata = {
  title: 'The Parish of St John Henry Newman',
  description: 'A place to remember loved ones',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link href="/" className="brand-link" aria-label="Go to home">
            <h1 className="brand-title">The Parish of St John Henry Newman</h1>
          </Link>
        </header>
        {children}
      </body>
    </html>
  );
}
