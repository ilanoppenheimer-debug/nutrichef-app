import type { ReactNode } from 'react';

import PrivateLayoutClient from './PrivateLayoutClient';

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <PrivateLayoutClient>{children}</PrivateLayoutClient>;
}
