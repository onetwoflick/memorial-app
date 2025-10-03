// app/layout.tsx
import './globals.css'; // optional, if you have global styles

export const metadata = {
  title: 'Memorials',
  description: 'A place to remember loved ones',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
