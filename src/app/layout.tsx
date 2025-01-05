'use client';

import { Auth0Provider } from '@auth0/auth0-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Script from 'next/script';
import '../../styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <html lang="en">
      <body>
        <Auth0Provider
          domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ''}
          clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ''}
          authorizationParams={{
            redirect_uri: redirectUri,
          }}
        >
          <Header />
          <main className="pt-24">
            {children}
          </main>
          <Footer />
        </Auth0Provider>
        <Script src="https://unpkg.com/flowbite@1.4.1/dist/flowbite.js"></Script>
      </body>
    </html>
  );
}
