import type { Metadata } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import '@/app/globals.css';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-body', display: 'swap' });

export const metadata: Metadata = {
  title: { default: "Admin — Hassan's Toys World", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="bg-cream-dark">{children}</body>
    </html>
  );
}
