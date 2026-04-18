import type { LucideIcon } from 'lucide-react';

export type SavedTabId = 'favorites' | 'interested' | 'history';

export type SavedRecipeCard = {
  title: string;
  cuisine?: string;
  description?: string;
  macros?: { calories?: string | number; protein?: string | number };
  prepTime?: string;
  generatedAt?: string;
  _refinements?: unknown[];
};

export type SavedTabConfig = {
  id: SavedTabId;
  label: string;
  icon: LucideIcon;
};

export type SavedEmptyStateCopy = {
  icon: LucideIcon;
  title: string;
  text: string;
};
