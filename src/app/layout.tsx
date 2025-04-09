import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { LayoutWrapper } from '@/components/layout/LayoutWrapper';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CarBiz - Find Your Perfect Car',
  description: 'Your premium destination for new and pre-owned vehicles',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <AuthProvider>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
