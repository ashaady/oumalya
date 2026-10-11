import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@/styles/globals.css';
import '@/styles/home.scoped.css';
import '@/styles/boutique.scoped.css';
import '@/styles/subpages.scoped.css';
import '@/styles/admin.scoped.css';
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

const clerkOumalyaAppearance = {
  variables: {
    colorPrimary: '#eb5c8e',
    colorBackground: '#131117',
    colorText: '#f5f5f7',
    colorTextSecondary: '#9e9ea8',
    colorInputBackground: '#1a1921',
    colorInputText: '#ffffff',
    colorTextOnPrimaryBackground: '#ffffff',
    colorDanger: '#ff4d6d',
    colorSuccess: '#2ec4b6',
    borderRadius: '14px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  elements: {
    card: {
      background: 'linear-gradient(165deg, rgba(23, 21, 28, 0.96) 0%, rgba(14, 13, 18, 0.98) 100%)',
      border: '1px solid rgba(235, 92, 142, 0.25)',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(235, 92, 142, 0.15)',
      borderRadius: '22px',
    },
    headerTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      color: '#ffffff',
    },
    headerSubtitle: {
      color: '#9e9ea8',
    },
    socialButtonsBlockButton: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      color: '#ffffff',
    },
    socialButtonsBlockButtonText: {
      color: '#ffffff',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #eb5c8e 0%, #d8487d 100%)',
      border: 'none',
      color: '#ffffff',
    },
    footerActionLink: {
      color: '#eb5c8e',
    },
    formFieldInput: {
      background: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      color: '#ffffff',
    },
    userButtonPopoverCard: {
      background: '#141318',
      border: '1px solid rgba(235, 92, 142, 0.25)',
      color: '#ffffff',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_ZmFzdC10b3J0b2lzZS01MTUuY2xlcmsuYWNjb3VudHMuZGV2JA'}
      appearance={clerkOumalyaAppearance}
    >
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
    </ClerkProvider>
  );
}
