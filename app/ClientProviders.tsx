'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmDialogProvider } from '@/context/ConfirmDialogContext';
import QueryProvider from '@/providers/QueryProvider';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmDialogProvider>
          <QueryProvider>{children}</QueryProvider>
        </ConfirmDialogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

