import { Playfair_Display, Inter } from "next/font/google";
import './globals.css';
import Link from 'next/link';

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: 'The Parish of St John Henry Newman - Memorials',
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
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased text-slate-800 bg-[#DED8D0] min-h-screen flex flex-col">
        <header className="bg-[#EFECE8]/95 backdrop-blur-md border-b border-[#C8C0B5] sticky top-0 z-50 py-4 shadow-sm border-t-4 border-t-[#990000]">
          <Link href="/" className="block text-center" aria-label="Go to home">
            <h1 className="font-serif text-2xl md:text-3xl text-[#1B365D] tracking-wide m-0">
              The Parish of St. John Henry Newman
            </h1>
            <p className="text-[#990000] text-xs md:text-sm uppercase tracking-widest font-semibold mt-1">Down the Memory Lane</p>
          </Link>
        </header>
        
        <main className="flex-grow">
          {children}
        </main>

        <footer className="bg-[#1B365D] text-white py-12 mt-auto border-t border-[#12243e]">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="font-serif text-2xl mb-2 text-[#D4AF37]">Cor ad Cor Loquitur</h2>
            <p className="text-blue-200/80 italic text-sm mb-8">Heart speaks unto Heart</p>
            
            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-sm">
              <a href="https://stjohnnewman.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">
                Return to Parish Home
              </a>
              <span className="hidden md:inline text-blue-400">•</span>
              <a href="https://stjohnnewman.org/mass-times-1" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">
                Mass Times
              </a>
              <span className="hidden md:inline text-blue-400">•</span>
              <a href="https://stjohnnewman.org/contact" target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">
                Contact Us
              </a>
            </div>
            <div className="mt-8 text-blue-300/60 text-xs">
              &copy; {new Date().getFullYear()} The Parish of St. John Henry Newman. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
