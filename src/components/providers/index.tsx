'use client';

import AuthProvider from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
          {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
