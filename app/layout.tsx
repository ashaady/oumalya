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
    colorBackground: '#ffffff',
    colorText: '#120e10',
    colorTextSecondary: '#786d72',
    colorInputBackground: '#fcf9fa',
    colorInputText: '#120e10',
    colorTextOnPrimaryBackground: '#ffffff',
    colorDanger: '#d8487d',
    colorSuccess: '#2ec4b6',
    borderRadius: '12px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, Arial, sans-serif",
  },
  elements: {
    card: {
      background: '#ffffff',
      border: '1px solid rgba(235, 92, 142, 0.22)',
      boxShadow: '0 20px 45px rgba(235, 92, 142, 0.08), 0 4px 16px rgba(18, 14, 16, 0.04)',
      borderRadius: '24px',
    },
    headerTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      color: '#120e10',
      fontSize: '24px',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: '#786d72',
      fontSize: '13.5px',
    },
    socialButtonsBlockButton: {
      background: '#ffffff',
      border: '1.5px solid #ede5e8',
      color: '#120e10',
      borderRadius: '12px',
    },
    socialButtonsBlockButtonText: {
      color: '#120e10',
      fontWeight: '600',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #eb5c8e 0%, #d8487d 100%)',
      border: 'none',
      color: '#ffffff',
      borderRadius: '100px',
    },
    formFieldInput: {
      background: '#fcf9fa',
      border: '1.5px solid #ede5e8',
      color: '#120e10',
    },
    formFieldLabel: {
      color: '#4a4044',
      fontWeight: '500',
    },
    footer: {
      display: 'none !important',
    },
    footerAction: {
      display: 'none !important',
    },
    footerPages: {
      display: 'none !important',
    },
    devModeBadge: {
      display: 'none !important',
    },
    userButtonPopoverCard: {
      background: '#ffffff',
      border: '1px solid rgba(235, 92, 142, 0.25)',
      boxShadow: '0 10px 30px rgba(18, 14, 16, 0.1)',
      color: '#120e10',
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
