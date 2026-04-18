'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ConfirmDialogProvider } from '@/context/ConfirmDialogContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

