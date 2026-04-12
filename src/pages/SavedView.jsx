import { useState } from 'react';
import { Bookmark, Bot, Clock, Heart, Settings2 } from 'lucide-react';
import RecipeModal from '../components/RecipeModal.jsx';
import { useCollectionsStore } from '../stores/useCollectionsStore.js';

function RecipeCard_Mini({ rec, onSelect }) {
  return (
    <div
      onClick={() => onSelect(rec)}
      className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border cursor-pointer hover:shadow-md transition-all group"
      style={{ borderColor: 'var(--c-primary-border)' }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
          {rec.cuisine || 'Receta'}
        </span>
        {rec._refinements?.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">
            <Settings2 size={9} /> {rec._refinements.length} ajuste{rec._refinements.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white mb-1 leading-tight text-sm">{rec.title}</h3>
      {rec.description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{rec.description}</p>}
      <div className="flex gap-2 text-xs font-semibold text-slate-400">
        {rec.macros?.calories && <span className="bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">🔥 {rec.macros.calories}</span>}
        {rec.macros?.protein && <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">💪 {rec.macros.protein}</span>}
        {rec.prepTime && <span className="bg-slate-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">⏱ {rec.prepTime}</span>}
      </div>
      {rec.generatedAt && (
        <p className="text-[10px] text-slate-300 dark:text-gray-600 mt-2 flex items-center gap-1">
          <Clock size={9} /> {new Date(rec.generatedAt).toLocaleDateString()}
          {rec._refinedFrom && <span className="ml-1">· refinada de "{rec._refinedFrom}"</span>}
        </p>
      )}
    </div>
  );
}

function RecipeGrid({ recipes, onSelect }) {
  if (!recipes.length) return null;
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {recipes.map((rec, i) => <RecipeCard_Mini key={`${rec.title}-${i}`} rec={rec} onSelect={onSelect} />)}
    </div>
  );
}

const TABS = [
  { id: 'favorites', label: 'Favoritas', icon: Heart },
  { id: 'interested', label: 'Me Interesa', icon: Bookmark },
  { id: 'history', label: 'Historial IA', icon: Bot },
];

export default function SavedView() {
  const favoriteRecipes = useCollectionsStore((s) => s.favoriteRecipes);
  const interestedRecipes = useCollectionsStore((s) => s.interestedRecipes);
  const generatedRecipes = useCollectionsStore((s) => s.generatedRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [tab, setTab] = useState('favorites');

  const counts = {
    favorites: favoriteRecipes.length,
    interested: interestedRecipes.length,
    history: generatedRecipes.length,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Recipe modal — opens on top of the list */}
      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onRecipeChange={setSelectedRecipe}
      />

      <h1 className="text-2xl font-black text-slate-800 dark:text-white">Mis Recetas</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-bold transition-all ${
              tab === t.id
                ? 'bg-white dark:bg-gray-900 shadow-sm text-slate-800 dark:text-white'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            <t.icon size={14} />
            <span className="hidden sm:inline">{t.label}</span>
            {counts[t.id] > 0 && (
              <span className="text-xs font-black bg-slate-200 dark:bg-gray-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Favoritas */}
      {tab === 'favorites' && (
        favoriteRecipes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-center text-slate-400 dark:text-slate-500">
            <Heart size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aún no tienes favoritas</p>
            <p className="text-sm mt-1">Toca el ❤️ en cualquier receta para guardarla aquí.</p>
          </div>
        ) : <RecipeGrid recipes={favoriteRecipes} onSelect={setSelectedRecipe} />
      )}

      {/* Me interesa */}
      {tab === 'interested' && (
        interestedRecipes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-center text-slate-400 dark:text-slate-500">
            <Bookmark size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nada guardado aún</p>
            <p className="text-sm mt-1">Toca el 🔖 para guardar recetas que quieres probar.</p>
          </div>
        ) : <RecipeGrid recipes={interestedRecipes} onSelect={setSelectedRecipe} />
      )}

      {/* Historial IA */}
      {tab === 'history' && (
        generatedRecipes.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl border border-dashed border-slate-200 dark:border-gray-700 text-center text-slate-400 dark:text-slate-500">
            <Bot size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Sin historial todavía</p>
            <p className="text-sm mt-1">Cada receta generada con IA aparece aquí automáticamente. Puedes volver a abrirlas y ajustarlas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {generatedRecipes.length} recetas generadas · ordenadas por fecha · toca cualquiera para ver y ajustar
              </p>
            </div>
            <RecipeGrid recipes={generatedRecipes} onSelect={setSelectedRecipe} />
          </div>
        )
      )}
    </div>
  );
}
