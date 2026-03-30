import { useEffect, useRef, useState } from 'react';
import { Apple, Camera, ChefHat, ChevronRight, Flame, RefreshCw, Sparkles } from 'lucide-react';
import RecipeCard from '../components/RecipeCard.jsx';
import { useAppState } from '../context/appState.js';
import {
  buildGeneratorRecipeCacheKey,
  buildGeneratorSuggestionsCacheKey,
  buildLocaleInstruction,
  callGeminiAPI,
  callGeminiVisionAPI,
  compactProfile,
  GENERATOR_SUGGESTIONS_CACHE_KEY,
  getCooldownMessage,
  getGeminiCooldownUntil,
  readStoredJson,
  writeStoredJson,
} from '../lib/gemini.js';

// ── Opciones expandidas ───────────────────────────────────────────────────────
const DISH_TYPES = [
  'Plato Principal',
  'Desayuno',
  'Brunch',
  'Almuerzo',
  'Cena',
  'Snack Proteico (Post-entreno)',
  'Postre Saludable',
  'Meal Prep (Para llevar)',
  'Bebida / Batido',
  'Aperitivo',
];

const CUISINE_STYLES = [
  { value: 'Normal/Casera', label: 'Normal / Casera', emoji: '🏠' },
  { value: 'Comida Local', label: 'Local (de mi país)', emoji: '📍' },
  { value: 'Mediterránea', label: 'Mediterránea', emoji: '🫒' },
  { value: 'Italiana', label: 'Italiana', emoji: '🍝' },
  { value: 'Asiática', label: 'Asiática', emoji: '🍜' },
  { value: 'India', label: 'India', emoji: '🍛' },
  { value: 'Mexicana', label: 'Mexicana', emoji: '🌮' },
  { value: 'Árabe', label: 'Árabe', emoji: '🥙' },
  { value: 'Americana', label: 'Americana', emoji: '🍔' },
  { value: 'Sorpréndeme', label: 'Sorpréndeme', emoji: '✨' },
];

const COMPLEXITY_LEVELS = [
  {
    value: 0, label: 'Rapidísimo', emoji: '⚡',
    color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    hint: 'Máx. 4 ingredientes, menos de 15 min',
    promptInstructions: `MODO ULTRA SIMPLE: Máximo 4-5 ingredientes, 2-3 pasos, menos de 15 minutos. Nombres directos sin florituras. Sin técnicas especiales.`,
  },
  {
    value: 1, label: 'Fácil', emoji: '🟢',
    color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-700',
    hint: 'Pocos pasos, sin técnicas complicadas',
    promptInstructions: `MODO FÁCIL: Máximo 8 ingredientes, pasos claros, menos de 30 minutos. Técnicas básicas.`,
  },
  {
    value: 2, label: 'Normal', emoji: '🟡',
    color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-700',
    hint: 'Recetas caseras con algo de elaboración',
    promptInstructions: `Recetas de complejidad media, caseras y accesibles.`,
  },
  {
    value: 3, label: 'Elaborado', emoji: '🔴',
    color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    hint: 'Más pasos, técnicas intermedias',
    promptInstructions: `Recetas con más elaboración, marinados, salsas, técnicas intermedias.`,
  },
  {
    value: 4, label: 'Gourmet', emoji: '👨‍🍳',
    color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    hint: 'Recetas elaboradas y creativas',
    promptInstructions: `Recetas gourmet, creativas y elaboradas. Técnicas avanzadas, presentación cuidada.`,
  },
];

export default function GeneratorView() {
  const { profile, favoriteRecipes, saveGeneratedRecipe } = useAppState();
  const [ingredients, setIngredients] = useState('');
  const [dishType, setDishType] = useState('Plato Principal');
  const [complexityValue, setComplexityValue] = useState(2);
  const [cuisine, setCuisine] = useState('Normal/Casera');

  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [error, setError] = useState(null);
  const [quotaNotice, setQuotaNotice] = useState(null);
  const [cacheNotice, setCacheNotice] = useState(null);
  const [cooldownUntil, setCooldownUntilState] = useState(() => getGeminiCooldownUntil());
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef(null);

  const complexity = COMPLEXITY_LEVELS[complexityValue];
  const cooldownRemainingMs = Math.max(0, cooldownUntil - now);
  const isCooldownActive = cooldownRemainingMs > 0;
  const cooldownLabel = isCooldownActive ? `Disponible en ${Math.ceil(cooldownRemainingMs / 1000)}s` : null;

  useEffect(() => {
    if (!isCooldownActive) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setCooldownUntilState(getGeminiCooldownUntil());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCooldownActive]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      setScanning(true);
      try {
        const prompt = 'Identifica todos los ingredientes de comida visibles en esta imagen. Devuelve ÚNICAMENTE una lista de los nombres de los ingredientes separados por comas.';
        const resultText = await callGeminiVisionAPI(prompt, base64Data, file.type);
        setIngredients(prev => prev ? `${prev}, ${resultText.trim()}` : resultText.trim());
      } catch (err) {
        setError('Error al escanear la imagen.');
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getSuggestions = async () => {
    if (!ingredients.trim()) { setError('Por favor ingresa algunos ingredientes.'); return; }
    if (isCooldownActive) {
      const msg = getCooldownMessage(cooldownUntil);
      setQuotaNotice(msg); setError(msg); return;
    }

    const suggestionsCacheKey = buildGeneratorSuggestionsCacheKey({
      ingredients, dishType,
      difficulty: complexity.label,
      cuisine,
      profile: { ...profile, favoriteTitles: favoriteRecipes.map(r => r.title) }
    });
    const suggestionsCache = readStoredJson(GENERATOR_SUGGESTIONS_CACHE_KEY, {});

    if (suggestionsCache[suggestionsCacheKey]) {
      setSuggestions(suggestionsCache[suggestionsCacheKey]);
      setCacheNotice('Mostrando opciones guardadas para esta combinación.');
      return;
    }

    setLoading(true);
    setError(null); setQuotaNotice(null); setCacheNotice(null);
    setSuggestions(null); setSelectedRecipe(null);

    const profileStr = compactProfile(profile);
    const localeStr = buildLocaleInstruction(profile);

    // Si la cocina es "Local", indicar explícitamente el país
    const cuisineInstruction = cuisine === 'Comida Local'
      ? `Cocina típica de ${profile.country || 'Chile'}`
      : cuisine;

    const prompt = `${localeStr}
Eres un chef IA. Genera 3 opciones de ${dishType} usando: ${ingredients}.
Estilo: ${cuisineInstruction}. Perfil: ${profileStr}.
${favoriteRecipes.length > 0 ? `Le gustan: ${favoriteRecipes.map(r => r.title).join(', ')}.` : ''}
${complexity.promptInstructions}
Devuelve SOLO este JSON:
{"suggestions":[{"id":1,"name":"...","type":"...","description":"..."}]}`;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result.suggestions);
      suggestionsCache[suggestionsCacheKey] = result.suggestions;
      writeStoredJson(GENERATOR_SUGGESTIONS_CACHE_KEY, suggestionsCache);
    } catch (err) {
      if (err.message?.includes('pausa')) {
        setCooldownUntilState(getGeminiCooldownUntil());
        setNow(Date.now());
        setQuotaNotice(err.message);
      }
      setError(err.message || 'Error al generar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const generateFromSuggestion = async (sugg) => {
    if (isCooldownActive) {
      const msg = getCooldownMessage(cooldownUntil);
      setQuotaNotice(msg); setError(msg); return;
    }

    const recipeCacheKey = buildGeneratorRecipeCacheKey({ suggestion: sugg, ingredients, profile });
    setGeneratingRecipe(true);
    setError(null); setQuotaNotice(null); setCacheNotice(null);

    const profileStr = compactProfile(profile);
    const localeStr = buildLocaleInstruction(profile);

    const cuisineInstruction = cuisine === 'Comida Local'
      ? `Cocina típica de ${profile.country || 'Chile'}`
      : cuisine;

    const prompt = `${localeStr}
Receta completa de ${dishType} estilo ${cuisineInstruction}: "${sugg.name}".
${sugg.description}. Ingredientes base: ${ingredients}.
Perfil: ${profileStr}.
${complexity.promptInstructions}
Devuelve SOLO este JSON:
{"title":"...","description":"...","prepTime":"...","cookTime":"...","cuisine":"...","ingredients":[{"name":"...","amount":"...","substitute":"..."}],"steps":["..."],"macros":{"calories":"...","protein":"...","carbs":"...","fat":"...","fiber":"..."},"tips":"...","marcas_sugeridas":[]}`;

    try {
      const result = await callGeminiAPI(prompt, recipeCacheKey);
      if (saveGeneratedRecipe) await saveGeneratedRecipe(result);
      setSelectedRecipe(result);
    } catch (err) {
      if (err.message?.includes('pausa')) {
        setCooldownUntilState(getGeminiCooldownUntil());
        setNow(Date.now());
        setQuotaNotice(err.message);
      }
      setError(err.message || 'No pude generar la receta ahora.');
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

      {/* Panel izquierdo */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800">
          <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Apple style={{ color: 'var(--c-primary)' }} size={18} />
            ¿Qué hay en tu cocina?
          </h3>

          <div className="space-y-4">
            {/* Ingredientes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Ingredientes disponibles</label>
              <div className="relative">
                <textarea
                  value={ingredients}
                  onChange={e => setIngredients(e.target.value)}
                  placeholder="Ej: Pollo, arroz, tomates, espinaca..."
                  className="w-full p-3 pb-11 rounded-xl border border-slate-200 dark:border-gray-600 focus:ring-2 outline-none bg-slate-50 dark:bg-gray-800 dark:text-white text-sm min-h-[90px] resize-none"
                />
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="absolute bottom-2.5 right-2.5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-500 text-slate-600 dark:text-slate-300 hover:border-[--c-primary] p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm min-h-[36px]"
                >
                  {scanning ? <RefreshCw className="animate-spin" size={13} /> : <Camera size={13} />}
                  {scanning ? 'Escaneando...' : '✨ Foto'}
                </button>
              </div>
            </div>

            {/* Tipo de comida */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tipo de comida</label>
              <select
                value={dishType}
                onChange={e => setDishType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white outline-none text-sm min-h-[44px]"
              >
                {DISH_TYPES.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            {/* Estilo de cocina — grid visual */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Estilo de cocina</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CUISINE_STYLES.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setCuisine(c.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all min-h-[44px] text-left ${
                      cuisine === c.value
                        ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                        : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 hover:border-[--c-primary-border]'
                    }`}
                  >
                    <span className="text-base shrink-0">{c.emoji}</span>
                    <span className="leading-tight">{c.label}</span>
                  </button>
                ))}
              </div>
              {cuisine === 'Comida Local' && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  📍 Usará recetas típicas de <strong>{profile.country || 'Chile'}</strong> · Configurable en Ajustes
                </p>
              )}
            </div>

            {/* Slider de complejidad */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">Complejidad</label>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${complexity.bgColor} ${complexity.color} ${complexity.borderColor}`}>
                  {complexity.emoji} {complexity.label}
                </span>
              </div>
              <input
                type="range" min={0} max={4} step={1} value={complexityValue}
                onChange={e => setComplexityValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, var(--c-primary) 0%, var(--c-primary) ${complexityValue * 25}%, #e2e8f0 ${complexityValue * 25}%, #e2e8f0 100%)` }}
              />
              <div className="flex justify-between mt-1">
                {COMPLEXITY_LEVELS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setComplexityValue(l.value)}
                    className={`text-xs transition-all ${complexityValue === l.value ? complexity.color : 'text-slate-300 dark:text-slate-600'}`}
                  >
                    {l.emoji}
                  </button>
                ))}
              </div>
              <p className={`text-xs mt-2 px-3 py-1.5 rounded-lg border ${complexity.bgColor} ${complexity.color} ${complexity.borderColor}`}>
                {complexity.hint}
              </p>
            </div>

            {/* Botón buscar */}
            <button
              onClick={getSuggestions}
              disabled={loading || generatingRecipe || isCooldownActive}
              className="w-full py-3 px-4 text-white rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm min-h-[48px]"
              style={{ background: 'var(--c-primary)' }}
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <Flame size={18} />}
              {loading ? 'Analizando...' : (isCooldownActive ? cooldownLabel : 'Buscar Opciones')}
            </button>

            {quotaNotice && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-900 dark:text-amber-300">
                <div className="font-semibold">Gemini está limitado temporalmente</div>
                <div className="mt-1">{quotaNotice}</div>
              </div>
            )}
            {cacheNotice && <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 text-xs text-blue-900 dark:text-blue-300">{cacheNotice}</div>}
            {error && <p className="text-red-500 dark:text-red-400 text-xs text-center">{error}</p>}
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="lg:col-span-8">
        {loading && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-4 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700">
            <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--c-primary)' }} />
            <p className="font-medium animate-pulse text-slate-500 dark:text-slate-400 text-sm">
              {complexityValue <= 1 ? 'Buscando algo rápido y sencillo...' : 'Pensando qué preparar...'}
            </p>
          </div>
        )}

        {!loading && !suggestions && !selectedRecipe && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 space-y-4 bg-white/50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700 p-8 text-center">
            <ChefHat size={56} className="opacity-20" />
            <p className="text-base text-slate-500 dark:text-slate-400">Ingresa lo que tienes y te daré opciones para preparar.</p>
            {profile.country && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                📍 Recetas adaptadas para <strong>{profile.country}</strong>
              </p>
            )}
          </div>
        )}

        {suggestions && !selectedRecipe && !generatingRecipe && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles style={{ color: 'var(--c-primary)' }} size={18} />
              {complexityValue <= 1 ? '⚡ Opciones rápidas:' : 'Mira lo que puedes hacer:'}
            </h3>
            <div className="grid gap-3">
              {suggestions.map(sugg => (
                <div key={sugg.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:border-[--c-primary-border] transition-colors">
                  <div className="flex-1">
                    <span className="text-xs font-bold px-3 py-1 rounded-full inline-block mb-2" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
                      {sugg.type}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">{sugg.name}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{sugg.description}</p>
                  </div>
                  <button
                    onClick={() => generateFromSuggestion(sugg)}
                    disabled={generatingRecipe || isCooldownActive}
                    className="w-full sm:w-auto py-2.5 px-5 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 text-sm min-h-[44px]"
                    style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'var(--c-primary)'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'var(--c-primary-light)'; e.currentTarget.style.color = 'var(--c-primary)'; }}
                  >
                    <ChefHat size={16} /> {isCooldownActive ? cooldownLabel : 'Ver Receta'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatingRecipe && !selectedRecipe && (
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center" style={{ color: 'var(--c-primary)' }}>
            <RefreshCw className="animate-spin mb-4" size={40} />
            <p className="font-medium animate-pulse text-sm">Escribiendo el paso a paso...</p>
          </div>
        )}

        {selectedRecipe && (
          <div>
            <button onClick={() => setSelectedRecipe(null)} className="mb-4 font-medium flex items-center gap-1 hover:underline text-sm" style={{ color: 'var(--c-primary)' }}>
              <ChevronRight className="rotate-180" size={16} /> Volver a opciones
            </button>
            <RecipeCard recipe={selectedRecipe} />
          </div>
        )}
      </div>
    </div>
  );
}
