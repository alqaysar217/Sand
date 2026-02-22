import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'ConnectResolve | نظام إدارة شكاوى البنك',
  description: 'نظام ذكي لإدارة وحل شكاوى العملاء في القطاع المصرفي',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Noto+Kufi+Arabic:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
