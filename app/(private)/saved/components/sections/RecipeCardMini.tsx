'use client';

import { Clock, Settings2 } from 'lucide-react';
import type { SavedRecipeCard } from '../../types';

type RecipeCardMiniProps = {
  rec: SavedRecipeCard;
  onSelect: (recipe: SavedRecipeCard) => void;
};

export default function RecipeCardMini({ rec, onSelect }: RecipeCardMiniProps) {
  const refinementCount = rec._refinements?.length ?? 0;

  return (
    <div
      onClick={() => onSelect(rec)}
      className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border cursor-pointer hover:shadow-md transition-all group"
      style={{ borderColor: 'var(--c-primary-border)' }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-md"
          style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
        >
          {rec.cuisine || 'Receta'}
        </span>
        {refinementCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
            <Settings2 size={9} /> {refinementCount} ajuste{refinementCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white mb-1 leading-tight text-sm">{rec.title}</h3>
      {rec.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{rec.description}</p>
      )}
      <div className="flex gap-2 text-xs font-semibold text-slate-400">
        {rec.macros?.calories && (
          <span className="bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">🔥 {rec.macros.calories}</span>
        )}
        {rec.macros?.protein && (
          <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
            💪 {rec.macros.protein}
          </span>
        )}
        {rec.prepTime && (
          <span className="bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">⏱ {rec.prepTime}</span>
        )}
      </div>
      {rec.generatedAt && (
        <p className="text-[10px] text-slate-300 dark:text-gray-600 mt-2 flex items-center gap-1">
          <Clock size={9} /> {new Date(rec.generatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
