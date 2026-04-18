'use client';

import { ChevronRight } from 'lucide-react';

export type RecipeResultCardRecipe = {
  title: string;
  description?: string;
};

export type RecipeResultCardProps = {
  recipe: RecipeResultCardRecipe;
  onView: () => void;
};

/** Vista previa compacta de una receta generada (tap para abrir detalle). */
export default function RecipeResultCard({ recipe, onView }: RecipeResultCardProps) {
  return (
    <button
      type="button"
      onClick={onView}
      className="w-full text-left p-4 rounded-2xl border border-[--c-primary-border] bg-[--c-primary-light] transition-transform active:scale-[0.98]"
    >
      <p className="font-black text-sm leading-snug text-[--c-primary-text]">{recipe.title}</p>
      {recipe.description ? (
        <p className="text-xs mt-0.5 text-[--c-primary-text] opacity-80 line-clamp-2">{recipe.description}</p>
      ) : null}
      <div className="flex items-center gap-1 mt-2" style={{ color: 'var(--c-primary)' }}>
        <span className="text-xs font-bold">Ver receta</span>
        <ChevronRight size={13} strokeWidth={2.5} />
      </div>
    </button>
  );
}
