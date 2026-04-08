import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hardik & Vaidehi | Engagement Celebration',
  description: 'Celebrate Hardik and Vaidehi on August 8, 2026 in Cartersville, Georgia.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
