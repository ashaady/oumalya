import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import '@/styles/home.scoped.css';
import '@/styles/boutique.scoped.css';
import '@/styles/subpages.scoped.css';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'OUMALYA CLOTHING — Élégance au quotidien',
  description: 'OUMALYA CLOTHING — Abayas élégantes et Crocs tendance au Sénégal.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
