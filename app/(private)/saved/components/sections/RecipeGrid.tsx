'use client';

import type { SavedRecipeCard } from '../../types';
import RecipeCardMini from './RecipeCardMini';

type RecipeGridProps = {
  recipes: SavedRecipeCard[];
  onSelect: (recipe: SavedRecipeCard) => void;
};

export default function RecipeGrid({ recipes, onSelect }: RecipeGridProps) {
  if (!recipes.length) return null;
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((rec, i) => (
        <RecipeCardMini key={`${rec.title}-${i}`} rec={rec} onSelect={onSelect} />
      ))}
    </div>
  );
}
