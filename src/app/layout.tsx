
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { FirebaseClientProvider } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const logo = PlaceHolderImages.find(img => img.id === 'sanad-logo')?.imageUrl;

export const metadata: Metadata = {
  title: 'سند | نظام إدارة بلاغات العملاء',
  description: 'نظام سند الذكي لإدارة وحل شكاوى العملاء في القطاع المصرفي',
  icons: {
    icon: [
      { url: logo || '', sizes: '32x32', type: 'image/png' },
      { url: logo || '', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: logo || '', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json', // سيحتاج المتصفح لهذا الملف ليعامل التطبيق كـ PWA
};

export const viewport: Viewport = {
  themeColor: '#1414B8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        {/* الربط المباشر للأيقونات لضمان أعلى دقة في كافة المتصفحات */}
        <link rel="icon" href={logo} />
        <link rel="apple-touch-icon" href={logo} />
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
