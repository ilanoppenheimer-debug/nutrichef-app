import { Bookmark, Bot, Heart } from 'lucide-react';
import type { SavedEmptyStateCopy, SavedTabConfig, SavedTabId } from './types';

export const SAVED_PAGE_TITLE = 'Mis Recetas';

export const SAVED_TABS: SavedTabConfig[] = [
  { id: 'favorites', label: 'Favoritas', icon: Heart },
  { id: 'interested', label: 'Me Interesa', icon: Bookmark },
  { id: 'history', label: 'Historial IA', icon: Bot },
];

export const SAVED_EMPTY_BY_TAB: Record<SavedTabId, SavedEmptyStateCopy> = {
  favorites: {
    icon: Heart,
    title: 'Aún no tienes favoritas',
    text: 'Toca el ❤️ en cualquier receta para guardarla aquí.',
  },
  interested: {
    icon: Bookmark,
    title: 'Nada guardado aún',
    text: 'Toca el 🔖 para guardar recetas que quieres probar.',
  },
  history: {
    icon: Bot,
    title: 'Sin historial todavía',
    text: 'Cada receta generada con IA aparece aquí automáticamente.',
  },
};
