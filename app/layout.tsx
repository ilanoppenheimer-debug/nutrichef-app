import './globals.css';
import type { ReactNode } from 'react';
import ClientProviders from './ClientProviders';

export const metadata = {
  title: 'NutriChef IA',
  description: 'Asistente de cocina inteligente',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
