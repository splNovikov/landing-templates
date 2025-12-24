import type { Metadata } from 'next';
import { ThemeProvider } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Landing Templates',
  description: 'Modern landing page templates built with Next.js',
};

/**
 * Root Layout Component
 * Entry point for application theme setup
 * Wraps the entire application with ThemeProvider
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
