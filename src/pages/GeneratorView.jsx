import { useEffect, useRef, useState } from 'react';
import { Apple, Camera, ChefHat, ChevronRight, Flame, PiggyBank, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RecipeModal from '../components/RecipeModal.jsx';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useCollectionsStore } from '../stores/useCollectionsStore.js';
import { useFoodPreferences } from '../hooks/useFoodPreferences.js';
import {
  buildAbsoluteGuardrail,
  buildBudgetOptimizationInstruction,
  buildFoodPreferencePromptBlock,
  buildGeneratorRecipeCacheKey,
  buildGeneratorSuggestionsCacheKey,
  buildLocaleInstruction,
  buildLocalBrandInstruction,
  buildSupermarketInstruction,
  buildTimeConstraint,
  callGeminiAPI,
  callGeminiVisionAPI,
  compactProfile,
  GENERATOR_SUGGESTIONS_CACHE_KEY,
  getCooldownMessage,
  getGeminiCooldownUntil,
  RECIPE_JSON_SCHEMA,
  SEARCH_SUGGESTIONS_RESPONSE_SCHEMA,
  TIME_OPTIONS,
  readStoredJson,
  writeStoredJson,
} from '@/services/gemini.js';
import { withFoodPreferences } from '@/utils/foodPreferences.js';
import { ROUTES } from '../routes/paths.js';

// ─── Configuración del slider de complejidad ──────────────────────────────────
const COMPLEXITY_LEVELS = [
  {
    value: 0,
    label: 'Rapidísimo',
    emoji: '⚡',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
    hint: 'Máx. 2 pasos, un solo ingrediente principal',
    promptInstructions: `MODO ULTRA SIMPLE: La receta debe ser extremadamente sencilla.
- Máximo 4-5 ingredientes en total (contando sal, aceite)
- Máximo 2-3 pasos de preparación
- Sin técnicas especiales ni equipamiento raro
- El nombre debe ser directo y sin florituras: "Papas fritas en air fryer", "Huevos revueltos", "Arroz blanco"
- Tiempo total menor a 15 minutos
- NO sugieras nada gourmet, elaborado ni con presentación especial`,
  },
  {
    value: 1,
    label: 'Fácil',
    emoji: '🟢',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 dark:bg-teal-900/20',
    borderColor: 'border-teal-200 dark:border-teal-700',
    hint: 'Pocos pasos, sin técnicas complicadas',
    promptInstructions: `MODO FÁCIL: Recetas simples y directas.
- Máximo 6-8 ingredientes
- Pasos claros y sin tecnicismos
- Tiempo total menor a 30 minutos
- Técnicas básicas: saltear, hervir, hornear directo`,
  },
  {
    value: 2,
    label: 'Normal',
    emoji: '🟡',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-700',
    hint: 'Recetas caseras con algo de elaboración',
    promptInstructions: `Recetas de complejidad media, caseras y accesibles.`,
  },
  {
    value: 3,
    label: 'Elaborado',
    emoji: '🔴',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
    hint: 'Más pasos, técnicas intermedias',
    promptInstructions: `Recetas con más elaboración, técnicas intermedias y más ingredientes. Puede incluir marinados, salsas, etc.`,
  },
  {
    value: 4,
    label: 'Gourmet',
    emoji: '👨‍🍳',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-700',
    hint: 'Recetas elaboradas y creativas',
    promptInstructions: `Recetas gourmet, creativas y elaboradas. Puede incluir técnicas avanzadas, presentación cuidada y combinaciones sofisticadas.`,
  },
];

export default function GeneratorView() {
  const navigate = useNavigate();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const favoriteRecipes = useCollectionsStore((s) => s.favoriteRecipes);
  const { preferences, summaryLines } = useFoodPreferences();
  const [ingredients, setIngredients] = useState('');
  const [dishType, setDishType] = useState('Plato Principal (Salado)');
  const [complexityValue, setComplexityValue] = useState(2); // default: Normal
  const [cuisine, setCuisine] = useState('Sorpréndeme');

  const [maxTime, setMaxTime] = useState('none');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [error, setError] = useState(null);
  const [scanAlert, setScanAlert] = useState(null);
  const [quotaNotice, setQuotaNotice] = useState(null);
  const [cacheNotice, setCacheNotice] = useState(null);
  const [cooldownUntil, setCooldownUntilState] = useState(() => getGeminiCooldownUntil());
  const [now, setNow] = useState(Date.now());
  const fileInputRef = useRef(null);

  const complexity = COMPLEXITY_LEVELS[complexityValue];
  const effectiveProfile = withFoodPreferences(profile, preferences);
  const foodPreferenceInstruction = buildFoodPreferencePromptBlock(effectiveProfile);
  const cooldownRemainingMs = Math.max(0, cooldownUntil - now);
  const isCooldownActive = cooldownRemainingMs > 0;
  const cooldownLabel = isCooldownActive ? `Disponible en ${Math.ceil(cooldownRemainingMs / 1000)}s` : null;

  useEffect(() => {
    if (!isCooldownActive) return undefined;
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
        const prompt = `Analiza esta imagen.
Perfil del usuario: ${compactProfile(effectiveProfile)}.
${foodPreferenceInstruction}
${buildAbsoluteGuardrail(effectiveProfile)}
Si es un producto o etiqueta y contiene un alérgeno o ingrediente conflictivo, responde SOLO este JSON:
{"mode":"product","headline":"¡CUIDADO! Contiene [alérgeno]","ingredientsText":"","detected":["..."]}.
Si es una imagen de ingredientes o comida segura, responde SOLO este JSON:
{"mode":"ingredients","headline":"","ingredientsText":"ingrediente 1, ingrediente 2","detected":[]}.`;
        const resultText = await callGeminiVisionAPI(prompt, base64Data, file.type);
        const match = resultText.match(/\{[\s\S]*\}/);
        const parsed = match ? JSON.parse(match[0]) : null;

        if (parsed?.mode === 'product' && parsed.headline) {
          setScanAlert(parsed.headline);
          return;
        }

        setScanAlert(null);
        const detectedText = parsed?.ingredientsText || resultText.trim();
        setIngredients(prev => prev ? `${prev}, ${detectedText}` : detectedText);
      } catch (err) {
        setError('Error al escanear la imagen.');
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getSuggestions = async () => {
    if (!ingredients.trim()) {
      setError('Por favor ingresa algunos ingredientes que tengas.');
      return;
    }
    if (isCooldownActive) {
      const msg = getCooldownMessage(cooldownUntil);
      setQuotaNotice(msg); setError(msg);
      return;
    }

    const suggestionsCacheKey = buildGeneratorSuggestionsCacheKey({
      ingredients,
      dishType,
      difficulty: complexity.label,
      cuisine,
      profile: { ...effectiveProfile, favoriteTitles: favoriteRecipes.map(r => r.title) }
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

    const profileStr = compactProfile(effectiveProfile);
    const localeStr = buildLocaleInstruction(effectiveProfile);
    const superStr = buildSupermarketInstruction(effectiveProfile);
    const brandStr = buildLocalBrandInstruction(effectiveProfile);
    const guardrailStr = buildAbsoluteGuardrail(effectiveProfile);
    const timeStr = buildTimeConstraint(maxTime);
    const budgetStr = buildBudgetOptimizationInstruction(effectiveProfile);
    const cuisineLabel = cuisine === 'Comida Local' ? `Cocina típica de ${effectiveProfile.country || 'Chile'}` : cuisine;

    const prompt = `${localeStr}
Eres un chef IA. Genera 3 opciones de ${dishType} estilo ${cuisineLabel} usando: ${ingredients}.
Perfil: ${profileStr}.
${favoriteRecipes.length > 0 ? `Le gustan: ${favoriteRecipes.map(r => r.title).join(', ')}.` : ''}
${foodPreferenceInstruction}
${guardrailStr}
${timeStr}
${superStr}
${brandStr}
${budgetStr}
${complexity.promptInstructions}`;

    try {
      const result = await callGeminiAPI(prompt, null, null, {
        responseSchema: SEARCH_SUGGESTIONS_RESPONSE_SCHEMA,
      });
      setSuggestions(result.suggestions);
      suggestionsCache[suggestionsCacheKey] = result.suggestions;
      writeStoredJson(GENERATOR_SUGGESTIONS_CACHE_KEY, suggestionsCache);
    } catch (err) {
      if (err.message?.includes('limite de solicitudes') || err.message?.includes('Gemini esta en pausa')) {
        setCooldownUntilState(getGeminiCooldownUntil());
        setNow(Date.now());
        setQuotaNotice(err.message);
      }
      setError(err.message || 'Hubo un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const generateFromSuggestion = async (sugg) => {
    if (isCooldownActive) {
      const msg = getCooldownMessage(cooldownUntil);
      setQuotaNotice(msg); setError(msg);
      return;
    }

    const recipeCacheKey = buildGeneratorRecipeCacheKey({ suggestion: sugg, ingredients, profile: effectiveProfile, timeLimit: maxTime });
    setGeneratingRecipe(true);
    setError(null); setQuotaNotice(null); setCacheNotice(null);

    const profileStr2 = compactProfile(effectiveProfile);
    const localeStr2 = buildLocaleInstruction(effectiveProfile);
    const superStr2 = buildSupermarketInstruction(effectiveProfile);
    const brandStr2 = buildLocalBrandInstruction(effectiveProfile);
    const guardrailStr2 = buildAbsoluteGuardrail(effectiveProfile);
    const timeStr2 = buildTimeConstraint(maxTime);
    const budgetStr2 = buildBudgetOptimizationInstruction(effectiveProfile);
    const cuisineLabel2 = cuisine === 'Comida Local' ? `Cocina típica de ${effectiveProfile.country || 'Chile'}` : cuisine;

    const prompt = `${localeStr2}
Receta completa de ${dishType} estilo ${cuisineLabel2}: "${sugg.name}".
${sugg.description}. Ingredientes disponibles: ${ingredients}.
Perfil: ${profileStr2}.
${foodPreferenceInstruction}
${guardrailStr2}
${timeStr2}
${superStr2}
${brandStr2}
${budgetStr2}
${complexity.promptInstructions}`;

    try {
      const result = await callGeminiAPI(prompt, recipeCacheKey, null, {
        responseSchema: RECIPE_JSON_SCHEMA,
      });
      setSelectedRecipe(result);
    } catch (err) {
      if (err.message?.includes('limite de solicitudes') || err.message?.includes('Gemini esta en pausa')) {
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
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-gray-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Apple style={{ color: 'var(--c-primary)' }} size={20} />
            ¿Qué hay en tu cocina?
          </h3>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Preferencias activas
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    La IA las aplica siempre en cada resultado.
                  </p>
                </div>
                <button
                  onClick={() => navigate(ROUTES.preferences)}
                  className="text-xs font-bold hover:underline"
                  style={{ color: 'var(--c-primary)' }}
                >
                  Editar
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {summaryLines.length > 0 ? summaryLines.map(item => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-gray-600 dark:bg-gray-900 dark:text-slate-200"
                  >
                    {item}
                  </span>
                )) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Sin preferencias adicionales.
                  </p>
                )}
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Ingredientes Disponibles</label>
              <div className="relative">
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Ej: Pollo, arroz, tomates, espinaca..."
                  className="w-full p-3 pb-12 rounded-xl border border-slate-200 dark:border-gray-600 focus:ring-2 outline-none bg-slate-50 dark:bg-gray-800 dark:text-white min-h-[100px]"
                />
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="absolute bottom-3 right-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-500 text-slate-600 dark:text-slate-300 hover:border-[--c-primary] p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm z-10"
                >
                  {scanning ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
                  {scanning ? 'Escaneando...' : '✨ Escanear Foto'}
                </button>
              </div>
              {scanAlert && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                  {scanAlert}
                </div>
              )}
            </div>

            {/* Tipo y cocina */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Tipo</label>
                <select value={dishType} onChange={e => setDishType(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white outline-none">
                  <option>Plato Principal (Salado)</option>
                  <option>Desayuno</option>
                  <option>Snack / Picoteo</option>
                  <option>Postre (Dulce)</option>
                  <option>Aperitivo</option>
                  <option>Bebida / Batido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Cocina</label>
                <select value={cuisine} onChange={e => setCuisine(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-800 dark:text-white outline-none">
                  <option>Sorpréndeme</option>
                  <option>Mediterránea</option>
                  <option>Asiática</option>
                  <option>Latinoamericana</option>
                  <option>Fusión</option>
                  <option>India</option>
                </select>
              </div>
            </div>

            {/* ─── Slider de complejidad ─────────────────────────────── */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm text-slate-600 dark:text-slate-400">Complejidad</label>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${complexity.bgColor} ${complexity.color} ${complexity.borderColor} border`}>
                  {complexity.emoji} {complexity.label}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={complexityValue}
                onChange={e => setComplexityValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--c-primary) 0%, var(--c-primary) ${complexityValue * 25}%, #e2e8f0 ${complexityValue * 25}%, #e2e8f0 100%)`
                }}
              />

              {/* Etiquetas del slider */}
              <div className="flex justify-between mt-1">
                {COMPLEXITY_LEVELS.map(l => (
                  <button
                    key={l.value}
                    onClick={() => setComplexityValue(l.value)}
                    className={`text-[9px] font-semibold transition-all ${complexityValue === l.value ? complexity.color : 'text-slate-300 dark:text-slate-600'}`}
                  >
                    {l.emoji}
                  </button>
                ))}
              </div>

              {/* Hint del nivel seleccionado */}
              <p className={`text-xs mt-2 px-3 py-1.5 rounded-lg border ${complexity.bgColor} ${complexity.color} ${complexity.borderColor}`}>
                {complexity.hint}
              </p>
            </div>
            {/* ──────────────────────────────────────────────────────── */}

            {/* Selector de tiempo máximo */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                ⏱ Tiempo máximo de preparación
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {TIME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setMaxTime(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                      maxTime === opt.value
                        ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                        : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'
                    }`}
                  >
                    <span className="text-base">{opt.emoji}</span>
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
              {maxTime !== 'none' && TIME_OPTIONS.find(o => o.value === maxTime)?.hint && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 pl-1">
                  {TIME_OPTIONS.find(o => o.value === maxTime).hint}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4">
              <div className="pr-4">
                <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <PiggyBank size={16} /> Optimizar Presupuesto
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Cambia ingredientes caros por alternativas más accesibles y prioriza temporada.
                </p>
              </div>
              <button
                onClick={() => setProfile(prev => ({ ...prev, budgetFriendly: !prev.budgetFriendly }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${profile.budgetFriendly ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-gray-600'}`}
                aria-label="Activar optimización de presupuesto"
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${profile.budgetFriendly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <button
              onClick={getSuggestions}
              disabled={loading || generatingRecipe || isCooldownActive}
              className="w-full py-3 px-4 text-white rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
              style={{ background: 'var(--c-primary)' }}
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Flame size={20} />}
              {loading ? 'Analizando tu cocina...' : (isCooldownActive ? cooldownLabel : 'Buscar Opciones')}
            </button>

            {quotaNotice && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-300">
                <div className="font-semibold">Gemini está limitado temporalmente</div>
                <div className="mt-1">{quotaNotice}</div>
              </div>
            )}
            {cacheNotice && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-900 dark:text-blue-300">{cacheNotice}</div>
            )}
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="lg:col-span-8">
        {loading && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700 shadow-md">
            <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--c-primary)' }} />
            <p className="font-medium animate-pulse text-slate-500 dark:text-slate-400">
              {complexityValue <= 1 ? 'Buscando algo rápido y sencillo...' : 'Pensando qué preparar con tus ingredientes...'}
            </p>
          </div>
        )}

        {!loading && !suggestions && !selectedRecipe && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-4 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-slate-200 dark:border-gray-700 p-8 text-center shadow-md">
            <ChefHat size={64} className="opacity-20" />
            <p className="text-lg">Ingresa lo que tienes en tu nevera y te daré opciones para preparar.</p>
            {complexityValue <= 1 && (
              <p className="text-sm text-green-500 font-semibold animate-pulse">
                ⚡ Modo {complexity.label} activado — solo recetas rápidas y directas
              </p>
            )}
          </div>
        )}

        {suggestions && !selectedRecipe && !generatingRecipe && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles style={{ color: 'var(--c-primary)' }} />
              {complexityValue <= 1 ? '⚡ Opciones rápidas:' : 'Mira lo que puedes hacer:'}
            </h3>
            <div className="grid gap-4">
              {suggestions.map((sugg) => (
                <div key={sugg.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-slate-200 dark:border-gray-700 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-[--c-primary-border] transition-colors">
                  <div className="flex-1">
                    <span className="text-xs font-bold px-3 py-1 rounded-full inline-block mb-2" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
                      {sugg.type}
                    </span>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{sugg.name}</h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">{sugg.description}</p>
                  </div>
                  <button
                    onClick={() => generateFromSuggestion(sugg)}
                    disabled={generatingRecipe || isCooldownActive}
                    className="w-full sm:w-auto py-2.5 px-6 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-60"
                    style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
                    onMouseOver={e => { e.currentTarget.style.background = 'var(--c-primary)'; e.currentTarget.style.color = 'white'; }}
                    onMouseOut={e => { e.currentTarget.style.background = 'var(--c-primary-light)'; e.currentTarget.style.color = 'var(--c-primary)'; }}
                  >
                    <ChefHat size={18} /> {isCooldownActive ? cooldownLabel : 'Ver Receta'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatingRecipe && !selectedRecipe && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center" style={{ color: 'var(--c-primary)' }}>
            <RefreshCw className="animate-spin mb-4" size={48} />
            <p className="font-medium animate-pulse">Escribiendo el paso a paso...</p>
          </div>
        )}

        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onRecipeChange={setSelectedRecipe}
        />
      </div>
    </div>
  );
}
