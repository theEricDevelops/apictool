'use client';

import AuthProvider from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { StateProvider } from './StateProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StateProvider>
          {children}
        </StateProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}