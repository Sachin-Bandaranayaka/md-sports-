import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';

import { QueryProvider } from '@/context/QueryProvider';
import ApiInitializer from '@/components/ApiInitializer';
import DevTools from '@/components/DevTools';
import { ChatbotWrapper } from '@/components/chatbot/ChatbotWrapper';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MS Sport - Inventory Management', description: 'Inventory management system for MS Sport',
};

// Force dynamic rendering for all pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
              <Toaster />
              <ApiInitializer />
              {children}
              <ChatbotWrapper />
              <DevTools />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
