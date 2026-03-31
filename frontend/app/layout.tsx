import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FeedPulse — AI-Powered Feedback Platform',
  description: 'Collect product feedback and get instant AI-powered insights.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}