import { useState } from 'react';
import { ChefHat, ChevronLeft, RefreshCw, Search, Sparkles, Zap } from 'lucide-react';
import RecipeCard from '../components/RecipeCard.jsx';
import { useAppState } from '../context/appState.js';
import {
  buildAbsoluteGuardrail,
  callGeminiAPI, compactProfile,
  buildExploreCacheKey, buildGeneratorRecipeCacheKey,
  buildLocaleInstruction, buildLocalBrandInstruction, buildSupermarketInstruction,
  buildSearchPrompt, detectSearchIntent,
  EXPLORE_CACHE_KEY, GENERATOR_RECIPE_CACHE_KEY,
  RECIPE_JSON_SCHEMA,
} from '../lib/gemini.js';
import { searchLocalRecipes, getFeaturedRecipes, POPULAR_RECIPES } from '../lib/localRecipes.js';

// Recetas populares para mostrar en el estado vacío (sin búsqueda)
const QUICK_PICKS = POPULAR_RECIPES.slice(0, 6).map(r => ({
  id: r.title,
  name: r.title,
  type: r.cuisine,
  description: r.description,
  _local: r,
}));

export default function ExploreView() {
  const { profile, favoriteRecipes, saveGeneratedRecipe } = useAppState();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [sourceLabel, setSourceLabel] = useState(''); // 'local' | 'ia-literal' | 'ia-creative'
  const [noLocalResults, setNoLocalResults] = useState(false);
  const [detectedMode, setDetectedMode] = useState('creative');
  const [forcedMode, setForcedMode] = useState(null); // null | 'local' | 'literal' | 'creative'

  // Recetas destacadas filtradas por perfil
  const featuredRecipes = (typeof getFeaturedRecipes === 'function'
    ? getFeaturedRecipes(profile, 6)
    : POPULAR_RECIPES.slice(0, 6)
  ).map(r => ({ id: r.title, name: r.title, type: r.cuisine, description: r.description, _local: r }));

  const handleSearch = async () => {
    if (!query.trim()) return;
    setRecipe(null); setSuggestions(null); setSourceLabel(''); setNoLocalResults(false);

    // Detectar intención (respeta modo forzado por el usuario)
    const intent = forcedMode && forcedMode !== 'local' ? forcedMode : detectSearchIntent(query);
    setDetectedMode(intent);

    // Si el usuario forzó IA directa, ir directo a la IA sin buscar local
    if (forcedMode === 'literal' || forcedMode === 'creative') {
      await handleSearchWithAI();
      return;
    }

    // Buscar local con filtros de perfil (Kosher, dieta, etc.)
    const localFn = typeof searchLocalRecipes === 'function' ? searchLocalRecipes : () => [];
    const localResults = localFn(query, profile);

    if (localResults.length > 0) {
      // Modo literal: mostrar solo el resultado más relevante
      const results = intent === 'literal' ? localResults.slice(0, 1) : localResults;
      setSuggestions(results.map(r => ({ id: r.title, name: r.title, type: r.cuisine, description: r.description, _local: r })));
      setSourceLabel('local');
      return;
    }

    // Sin resultados locales → mostrar botón de escape
    setNoLocalResults(true);
  };

  const handleSearchWithAI = async () => {
    if (!query.trim()) return;
    setNoLocalResults(false); setLoading(true);
    const intent = (forcedMode && forcedMode !== 'local') ? forcedMode : detectSearchIntent(query);
    setDetectedMode(intent);
    setSourceLabel(intent === 'literal' ? 'ia-literal' : 'ia-creative');

    const cacheKey = buildExploreCacheKey({ query, mode: intent, profile });
    const prompt = buildSearchPrompt({
      query, mode: intent,
      profileStr: compactProfile(profile),
      localeStr: buildLocaleInstruction(profile),
      supermarketInstruction: buildSupermarketInstruction(profile),
      brandInstruction: buildLocalBrandInstruction(profile),
      guardrailInstruction: buildAbsoluteGuardrail(profile),
      favoritesStr: favoriteRecipes.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : '',
    });

    try {
      const result = await callGeminiAPI(prompt, cacheKey, EXPLORE_CACHE_KEY);
      setSuggestions(result.suggestions);
    } catch (err) {
      setSuggestions([{ id: 'error', name: 'Error', type: 'Error', description: err.message }]);
    } finally { setLoading(false); }
  };

  const generateFromSuggestion = async (sugg) => {
    if (sugg._local) { setRecipe(sugg._local); setSuggestions(null); return; }

    setGeneratingRecipe(true);
    setSuggestions(null);

    const cacheKey = buildGeneratorRecipeCacheKey({ suggestion: sugg, ingredients: query, profile });
    const localeStr = buildLocaleInstruction(profile);
    const superStr = buildSupermarketInstruction(profile);
    const brandStr = buildLocalBrandInstruction(profile);
    const guardrailStr = buildAbsoluteGuardrail(profile);
    // En modo literal, instrucción explícita de no añadir extras
    const literalNote = detectedMode === 'literal'
      ? '\nIMPORTANTE: Solo la receta exacta pedida. Sin acompañamientos ni extras no solicitados.'
      : '';

    const prompt = `${localeStr}
Receta completa para "${sugg.name}". ${sugg.description}.
Perfil: ${compactProfile(profile)}.${guardrailStr ? `\n${guardrailStr}` : ''}${superStr ? `\n${superStr}` : ''}${brandStr ? `\n${brandStr}` : ''}${literalNote}
Devuelve SOLO este JSON:
${RECIPE_JSON_SCHEMA}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, GENERATOR_RECIPE_CACHE_KEY);
      if (saveGeneratedRecipe) await saveGeneratedRecipe(result);
      setRecipe(result);
    } catch (err) { console.error(err); }
    finally { setGeneratingRecipe(false); }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">

      {/* Compact search header */}
      <div className="space-y-3">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">Explorar</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Busca un plato, ingrediente o pídele algo a la IA.
          </p>
        </div>

        {/* Search input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder='Ej: falafel en airfryer, algo con pollo...'
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-transparent text-slate-800 dark:text-white placeholder:text-slate-400"
              style={{ '--tw-ring-color': 'var(--c-primary)' }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-2xl text-white font-bold text-sm disabled:opacity-50 shrink-0 min-h-[48px] transition-opacity active:opacity-80"
            style={{ background: 'var(--c-primary)' }}
          >
            Buscar
          </button>
        </div>

        {/* Mode chips — scrollable, secondary */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {[
            { mode: null, label: '🔮 Auto' },
            { mode: 'local', label: '⚡ Local' },
            { mode: 'literal', label: '🎯 Exacto' },
            { mode: 'creative', label: '✨ Creativo' },
          ].map(({ mode, label }) => (
            <button
              key={label}
              onClick={() => setForcedMode(mode)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                forcedMode === mode
                  ? 'text-white border-transparent'
                  : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
              }`}
              style={forcedMode === mode ? { background: 'var(--c-primary)', borderColor: 'var(--c-primary)' } : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Dietary filter notice */}
        {profile.religiousDiet && profile.religiousDiet !== 'Ninguna' && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            🔍 Filtrando para <strong className="text-slate-600 dark:text-slate-300">{profile.religiousDiet}</strong> · {profile.country || 'Chile'}
          </p>
        )}
      </div>

      {/* Sin resultados locales — escape a IA */}
      {noLocalResults && !loading && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 text-center space-y-3 animate-in fade-in">
          <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
            No encontramos <span className="font-black text-slate-800 dark:text-white">"{query}"</span> en el banco local.
          </p>
          {detectedMode === 'literal' && (
            <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-gray-800 px-3 py-2 rounded-xl inline-block">
              🎯 Modo Exacto — la IA generará esa receta específica
            </p>
          )}
          <button
            onClick={handleSearchWithAI}
            className="mx-auto flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm min-h-[48px] active:opacity-80 transition-opacity"
            style={{ background: 'var(--c-primary)' }}
          >
            <Sparkles size={16} />
            {detectedMode === 'literal' ? `Generar "${query}" con IA` : 'Crear opciones con IA'}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">Se guardará en tu historial automáticamente.</p>
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--c-primary)' }} />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Buscando con IA...</p>
        </div>
      )}

      {/* Sugerencias (locales o de IA) */}
      {suggestions && !recipe && !generatingRecipe && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          {/* Badge indicando la fuente */}
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Resultados para "{query}"</h3>
            {sourceLabel === 'local' && (
              <span className="flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                <Zap size={11} /> Local
              </span>
            )}
            {sourceLabel === 'ia-literal' && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border text-white" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
                🎯 Exacto
              </span>
            )}
            {sourceLabel === 'ia-creative' && (
              <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border text-white" style={{ background: 'var(--c-primary)', borderColor: 'var(--c-primary)' }}>
                <Sparkles size={11} /> IA
              </span>
            )}
            {sourceLabel === 'local' && (
              <button onClick={handleSearchWithAI} className="text-xs font-semibold hover:underline flex items-center gap-1 ml-auto" style={{ color: 'var(--c-primary)' }}>
                <Sparkles size={11} /> Más opciones con IA
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {suggestions.map(sugg => (
              <div key={sugg.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 flex flex-col hover:border-slate-300 dark:hover:border-gray-600 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                    {sugg.type}
                  </span>
                  {sugg._local && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <Zap size={11} /> Instantáneo
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white mb-1 leading-tight">{sugg.name}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-3 flex-1 leading-relaxed line-clamp-2">{sugg.description}</p>
                <button
                  onClick={() => generateFromSuggestion(sugg)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity min-h-[44px]"
                  style={{ background: 'var(--c-primary)' }}
                >
                  <ChefHat size={15} /> Ver receta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generando receta con IA */}
      {generatingRecipe && !recipe && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--c-primary)' }} />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Generando receta...</p>
        </div>
      )}

      {/* Receta */}
      {recipe && (
        <div>
          <button
            onClick={() => { setRecipe(null); setSuggestions(suggestions); }}
            className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={18} /> Volver a resultados
          </button>
          <RecipeCard recipe={recipe} />
        </div>
      )}

      {/* Estado vacío — recetas rápidas populares sin búsqueda */}
      {!loading && !suggestions && !recipe && !generatingRecipe && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Zap size={13} className="text-green-500" /> Recetas rápidas · sin IA
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_PICKS.map(sugg => (
              <div
                key={sugg.id}
                onClick={() => generateFromSuggestion(sugg)}
                className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 cursor-pointer hover:border-slate-300 dark:hover:border-gray-600 active:scale-[0.98] transition-all group"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{sugg.type}</span>
                  <Zap size={12} className="text-green-500 shrink-0" />
                </div>
                <p className="font-bold text-sm text-slate-800 dark:text-white leading-snug">{sugg.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight line-clamp-2">{sugg.description}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 dark:text-slate-500">
            Búscalas arriba o escribe cualquier plato para que la IA genere opciones personalizadas.
          </p>
        </div>
      )}
    </div>
  );
}
