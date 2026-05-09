import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Diamond Pairs — Shivani Gems',
  description: 'Diamond pair inventory viewer',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
