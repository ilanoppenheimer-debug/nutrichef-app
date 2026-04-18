import { Bookmark, Calendar, ChefHat } from 'lucide-react';

import { ROUTES } from '@/lib/routes.js';

export const DESKTOP_NAV_ITEMS = [
  { to: ROUTES.cook, label: 'Cocinar', icon: ChefHat },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
];

export const MOBILE_NAV_ITEMS = [
  { to: ROUTES.cook, label: 'Cocinar', icon: ChefHat },
  { to: ROUTES.plan, label: 'Plan', icon: Calendar },
  { to: ROUTES.saved, label: 'Guardados', icon: Bookmark },
];

export function isActivePath(pathname, to) {
  return pathname === to;
}
