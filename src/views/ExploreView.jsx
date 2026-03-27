import { useState } from 'react';
import { ChefHat, ChevronRight, Compass, RefreshCw, Search, Sparkles } from 'lucide-react';
import RecipeCard from '../components/RecipeCard.jsx';
import { useAppState } from '../context/appState.js';
import {
  callGeminiAPI,
  compactProfile,
  buildExploreCacheKey,
  buildGeneratorRecipeCacheKey,
  EXPLORE_CACHE_KEY,
  GENERATOR_RECIPE_CACHE_KEY,
} from '../lib/gemini.js';

export default function ExploreView() {
  const { profile, favoriteRecipes } = useAppState();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  const profileStr = compactProfile(profile);
  const favStr = favoriteRecipes.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : '';

  const handleDirectSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRecipe(null);
    setSuggestions(null);

    const cacheKey = buildExploreCacheKey({ query, mode: 'direct', profile });

    const prompt = `Genera 3 variaciones saludables de "${query}" para este perfil: ${profileStr}${favStr ? `. Inspirate en: ${favStr}` : ''}.
Devuelve SOLO este JSON:
{"suggestions":[{"id":1,"name":"...","type":"...","description":"..."}]}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, EXPLORE_CACHE_KEY, 400);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
      setSuggestions([{ id: 'error', name: 'Error', type: 'Error', description: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRecipe(null);
    setSuggestions(null);

    const cacheKey = buildExploreCacheKey({ query, mode: 'suggest', profile });

    const prompt = `El usuario quiere: "${query}". Genera 3 sugerencias para este perfil: ${profileStr}${favStr ? `. Le gustan: ${favStr}` : ''}.
Devuelve SOLO este JSON:
{"suggestions":[{"id":1,"name":"...","type":"...","description":"..."}]}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, EXPLORE_CACHE_KEY, 400);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
      setSuggestions([{ id: 'error', name: 'Error', type: 'Error', description: err.message }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFromSuggestion = async (sugg) => {
    setGeneratingRecipe(true);
    setSuggestions(null);

    const cacheKey = buildGeneratorRecipeCacheKey({
      suggestion: sugg,
      ingredients: query,
      profile,
    });

    const prompt = `Receta completa para "${sugg.name}". ${sugg.description}. Perfil: ${profileStr}.
Devuelve SOLO este JSON:
{"title":"...","description":"...","prepTime":"...","cookTime":"...","cuisine":"...","ingredients":[{"name":"...","amount":"...","substitute":"..."}],"steps":["..."],"macros":{"calories":"...","protein":"...","carbs":"...","fat":"...","fiber":"..."},"tips":"..."}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, GENERATOR_RECIPE_CACHE_KEY, 900);
      setRecipe(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-md text-white text-center">
        <Compass size={40} className="mx-auto mb-4 opacity-90" />
        <h2 className="text-3xl font-bold mb-3">Explora y Antójate</h2>
        <p className="text-indigo-100 mb-6 max-w-lg mx-auto">Busca la receta de un plato específico o dinos qué se te antoja.</p>

        <div className="flex flex-col sm:flex-row gap-3 bg-white/10 p-2 rounded-2xl md:rounded-full backdrop-blur-md max-w-2xl mx-auto border border-white/20">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDirectSearch()}
            placeholder="¿Qué quieres comer hoy?"
            className="flex-1 bg-transparent text-white placeholder:text-indigo-200 px-4 py-2 outline-none"
          />
          <div className="flex gap-2">
            <button onClick={handleDirectSearch} disabled={loading || !query.trim()} className="flex-1 sm:flex-none bg-white text-indigo-600 px-5 py-2.5 rounded-xl md:rounded-full font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm">
              <Search size={18} /> Directa
            </button>
            <button onClick={handleSuggest} disabled={loading || !query.trim()} className="flex-1 sm:flex-none bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl md:rounded-full font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm">
              <Sparkles size={18} /> Sugerencias
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
          <RefreshCw className="animate-spin mb-4" size={40} />
          <p className="font-medium animate-pulse">Explorando opciones deliciosas...</p>
        </div>
      )}

      {suggestions && !recipe && !generatingRecipe && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {suggestions.map((sugg) => (
            <div key={sugg.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-indigo-100 dark:border-gray-700 flex flex-col hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full w-max mb-3">{sugg.type}</span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{sugg.name}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 flex-1">{sugg.description}</p>
              <button onClick={() => generateFromSuggestion(sugg)} className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2">
                <ChefHat size={18} /> Ver Receta
              </button>
            </div>
          ))}
        </div>
      )}

      {generatingRecipe && !recipe && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
          <RefreshCw className="animate-spin mb-4" size={40} />
          <p className="font-medium animate-pulse">Escribiendo el paso a paso...</p>
        </div>
      )}

      {recipe && (
        <div>
          <button onClick={() => setRecipe(null)} className="mb-4 text-indigo-600 font-medium flex items-center gap-1 hover:underline">
            <ChevronRight className="rotate-180" size={18} /> Volver a explorar
          </button>
          <RecipeCard recipe={recipe} />
        </div>
      )}
    </div>
  );
}
