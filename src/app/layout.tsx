import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import ApiInitializer from '@/components/ApiInitializer';
import DevTools from '@/components/DevTools';
import { ChatbotWrapper } from '@/components/chatbot/ChatbotWrapper';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MS Sport - Inventory Management', description: 'Inventory management system for MS Sport',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <Toaster />
          <ApiInitializer />
          {children}
          <ChatbotWrapper />
          <DevTools />
        </AuthProvider>
      </body>
    </html>
  );
}
