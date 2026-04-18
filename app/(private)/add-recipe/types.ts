import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';

export type AddRecipeTextMode = 'text' | 'url' | 'instagram';
export type AddRecipeMode = AddRecipeTextMode | 'photo';

export type AddRecipeModeOption = {
  id: AddRecipeMode;
  label: string;
  description: string;
  icon: LucideIcon | ComponentType<{ size?: number }>;
};

export type RecipeSafetyAlert = {
  headline?: string;
  detectedAllergens?: string[];
  detectedDislikes?: string[];
};

export type RecipePreview = {
  scanType: 'recipe' | 'product';
  title?: string;
  description?: string;
  safetyAlert?: RecipeSafetyAlert;
  [key: string]: unknown;
};
