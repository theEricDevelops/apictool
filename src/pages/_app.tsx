// filepath: /src/pages/_app.tsx
import { AppProps } from 'next/app';
import { Auth0Provider } from '@auth0/auth0-react';
import '../../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const redirectUri = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN || ''}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || ''}
      authorizationParams={{
        redirect_uri: redirectUri,
      }}
    >
      <Component {...pageProps} />
    </Auth0Provider>
  );
}

export default MyApp;