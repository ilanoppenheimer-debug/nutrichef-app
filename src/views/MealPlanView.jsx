import { useState } from 'react';
import {
  BarChart3,
  ChefHat,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';
import MealPlanHeader from '../components/meal-plan/MealPlanHeader.jsx';
import MealPlanSettings from '../components/meal-plan/MealPlanSettings.jsx';
import PlanSummary from '../components/meal-plan/PlanSummary.jsx';
import SavedMealsPanel from '../components/meal-plan/SavedMealsPanel.jsx';
import SelectedDayMeals from '../components/meal-plan/SelectedDayMeals.jsx';
import ShoppingListSection from '../components/meal-plan/ShoppingListSection.jsx';
import SupplementReminder from '../components/meal-plan/SupplementReminder.jsx';
import { useAppState } from '../context/appState.js';
import {
  buildAbsoluteGuardrail,
  buildBudgetOptimizationInstruction,
  callGeminiAPI,
  compactProfile,
  buildMealPlanCacheKey,
  buildShoppingCacheKey,
  buildGeneratorRecipeCacheKey,
  buildShoppingCostInstruction,
  MEALPLAN_CACHE_KEY,
  SHOPPING_CACHE_KEY,
  GENERATOR_RECIPE_CACHE_KEY,
  RECIPE_JSON_SCHEMA,
  readStoredJson,
  writeStoredJson,
} from '../lib/gemini.js';
import { clampServings, parseServingsCount } from '../lib/recipeScaling.js';

function CollapsibleSection({
  title,
  subtitle,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
}) {
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-slate-300"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}>
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold tracking-tight text-slate-800">{title}</h3>
            {subtitle ? <p className="text-xs text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="shrink-0 text-slate-400" /> : <ChevronDown size={20} className="shrink-0 text-slate-400" />}
      </button>

      {isExpanded ? (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function normalizeMealOption(option = {}) {
  const baseServings = clampServings(parseServingsCount(option.baseServings || option.servings || option.selectedServings || 1));
  const selectedServings = clampServings(parseServingsCount(option.selectedServings || option.servings || baseServings));

  return {
    ...option,
    baseServings,
    selectedServings,
    servings: selectedServings,
  };
}

function normalizePlanServings(planData) {
  if (!planData?.days) return planData;

  return {
    ...planData,
    days: planData.days.map(day => ({
      ...day,
      meals: day.meals?.map(meal => ({
        ...meal,
        options: meal.options?.map(option => normalizeMealOption(option)) || [],
      })) || [],
    })),
  };
}

export default function MealPlanView() {
  const { profile, setProfile, setPlan, plan, savedMeals, setSavedMeals, favoriteRecipes } = useAppState();
  const [loading, setLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creatineTaken, setCreatineTaken] = useState(false);
  const [planType, setPlanType] = useState('Diario');
  const [planPreferences, setPlanPreferences] = useState('');
  const [isTrainingDay, setIsTrainingDay] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [swappingData, setSwappingData] = useState(null);
  const [customSwapRequest, setCustomSwapRequest] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const SECTION_PREFS_KEY = 'nutrichef_section_prefs';
  const DEFAULT_SECTIONS = { summary: true, meals: true, shopping: true };
  const [expandedSections, setExpandedSections] = useState(
    () => ({ ...DEFAULT_SECTIONS, ...readStoredJson(SECTION_PREFS_KEY, {}) })
  );
  const [activeTab, setActiveTab] = useState('meals');

  const profileStr = compactProfile(profile);
  const favStr = favoriteRecipes?.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : '';

  const toggleSection = (section) => {
    setExpandedSections(current => {
      const next = { ...current, [section]: !current[section] };
      writeStoredJson(SECTION_PREFS_KEY, next);
      return next;
    });
  };

  const handleSelectDay = (nextDayIdx) => {
    setSelectedDayIdx(nextDayIdx);
    setSelectedRecipe(null);
    setSwappingData(null);
    setCustomSwapRequest('');
  };

  const generateShoppingList = async (planOverride = plan, profileOverride = profile) => {
    if (!planOverride) return;
    setLoadingList(true);

    const shoppingCacheKey = buildShoppingCacheKey(planOverride, profileOverride);
    const mealLines = planOverride.days?.flatMap(day =>
      day.meals?.flatMap(meal =>
        meal.options?.map(option => {
          const servings = clampServings(parseServingsCount(option.selectedServings || option.servings || 1));
          return `- ${day.dayName} / ${meal.type}: ${option.name} (${servings} porciones). ${option.description || ''}`;
        }) ?? []
      ) ?? []
    ).join('\n');

    const budgetStr = buildBudgetOptimizationInstruction(profileOverride);
    const guardrailStr = buildAbsoluteGuardrail(profileOverride);
    const shoppingCostStr = buildShoppingCostInstruction(profileOverride);
    const profileSummary = compactProfile(profileOverride);

    const prompt = `Lista de compras para este plan:
${mealLines}
Perfil: ${profileSummary}.
${guardrailStr}
${budgetStr}
${shoppingCostStr}
Agrupa por categoría de supermercado y suma cantidades totales aproximadas considerando las porciones indicadas.
Si un ingrediente entra en alergias o dislikes del usuario, reemplázalo automáticamente por su sustituto seguro y NO devuelvas el original en la lista final.
Devuelve SOLO este JSON:
{"currency":"...","estimatedTotalMin":0,"estimatedTotalMax":0,"estimatedSavingsMin":0,"estimatedSavingsMax":0,"categories":[{"name":"...","items":[{"name":"...","amount":"...","estimatedPriceMin":0,"estimatedPriceMax":0,"budgetTip":"...","substituteFor":"ingrediente original si hubo reemplazo"}]}]}`;

    try {
      const result = await callGeminiAPI(prompt, shoppingCacheKey, SHOPPING_CACHE_KEY, 600);
      setShoppingList(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const refreshShoppingIfVisible = async (nextPlan, nextProfile = profile) => {
    if (!shoppingList) return;
    await generateShoppingList(nextPlan, nextProfile);
  };

  const generatePlan = async () => {
    setLoading(true);
    setShoppingList(null);
    setSwappingData(null);
    setSelectedRecipe(null);

    const isWeekly = planType === 'Semanal';
    const isUpdatingSingleDay = !isWeekly && plan?.days?.length > 0;
    const targetDayName = isUpdatingSingleDay ? plan.days[selectedDayIdx].dayName : (isWeekly ? 'Dia 1 (Lunes)' : 'Hoy');

    const planCacheKey = buildMealPlanCacheKey({ planType, isTrainingDay, planPreferences, profile, savedMeals });
    const budgetStr = buildBudgetOptimizationInstruction(profile);
    const guardrailStr = buildAbsoluteGuardrail(profile);

    const prompt = `Crea un plan de comidas ${isWeekly ? 'SEMANAL (7 dias, Batch Cooking)' : 'de 1 DIA'}.
Perfil: ${profileStr}${favStr ? `. Inspiracion: ${favStr}` : ''}.${planPreferences ? ` Preferencias: ${planPreferences}.` : ''}${isTrainingDay ? ' Dia entrenamiento: +200kcal, prioriza carbohidratos.' : ' Dia descanso: calorias base.'}${savedMeals.length > 0 ? ` Incluir obligatorio: ${savedMeals.map(m => m.title).join(', ')}.` : ''}
${guardrailStr}
${budgetStr}
${isWeekly ? 'No repetir el mismo menu exacto los 7 dias.' : 'Ofrece 2 opciones por tipo de comida.'}
Las descripciones de opciones de comida deben ser cortas (8-12 palabras), directas y sin frases vacías.
Devuelve SOLO este JSON:
{"summary":"...","totalCalories":"...","totalProtein":"...","totalFiber":"...","days":[{"dayName":"${targetDayName}","meals":[{"type":"Desayuno","options":[{"name":"...","description":"...","calories":"...","protein":"...","fiber":"...","servings":1}]}]}]}`;

    try {
      const result = normalizePlanServings(await callGeminiAPI(
        prompt,
        planCacheKey,
        MEALPLAN_CACHE_KEY,
        isWeekly ? 2000 : 800  // plan semanal necesita más tokens
      ));

      if (isUpdatingSingleDay && result.days?.length > 0) {
        const updatedPlan = normalizePlanServings({ ...plan });
        updatedPlan.days[selectedDayIdx] = result.days[0];
        setPlan(updatedPlan);
      } else {
        setPlan(result);
        setSelectedDayIdx(0);
      }

      setSavedMeals([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async () => {
    if (!swappingData || !customSwapRequest.trim()) return;

    setIsSwapping(true);
    const { dayIdx, mealIdx, currentMealName } = swappingData;
    const currentMealType = plan.days[dayIdx].meals[mealIdx].type;
    const budgetStr = buildBudgetOptimizationInstruction(profile);
    const guardrailStr = buildAbsoluteGuardrail(profile);

    // El swap no se cachea — es siempre una petición nueva y específica
    const prompt = `Reemplaza "${currentMealName}" (${currentMealType}) del ${plan.days[dayIdx].dayName}.
Petición: "${customSwapRequest}". Perfil: ${profileStr}.
${guardrailStr}
${budgetStr}
Devuelve SOLO este JSON:
{"options":[{"name":"...","description":"...","calories":"...","protein":"...","fiber":"...","servings":1}]}`;

    try {
      const result = await callGeminiAPI(prompt, null, null, 200);
      const newPlan = normalizePlanServings({ ...plan });
      newPlan.days[dayIdx].meals[mealIdx].options = result.options?.map(option => normalizeMealOption(option)) || [];
      setPlan(newPlan);
      setSelectedRecipe(null);
      setSwappingData(null);
      setCustomSwapRequest('');
      await refreshShoppingIfVisible(newPlan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  };

  const handleMealServingsChange = async (dayIdx, mealIdx, optionIdx, nextServings) => {
    const newPlan = normalizePlanServings({ ...plan });
    const option = newPlan.days?.[dayIdx]?.meals?.[mealIdx]?.options?.[optionIdx];
    if (!option) return;

    option.selectedServings = clampServings(nextServings);
    option.servings = option.selectedServings;
    setPlan(newPlan);
    await refreshShoppingIfVisible(newPlan);
  };

  const handleBudgetToggle = async () => {
    const nextProfile = { ...profile, budgetFriendly: !profile.budgetFriendly };
    setProfile(nextProfile);
    if (plan) {
      await refreshShoppingIfVisible(plan, nextProfile);
    }
  };

  const generateRecipeFromPlan = async (option) => {
    setSelectedRecipe(null);
    setGeneratingRecipe(true);
    const selectedServings = clampServings(parseServingsCount(option.selectedServings || option.servings || 1));
    const budgetStr = buildBudgetOptimizationInstruction(profile);
    const guardrailStr = buildAbsoluteGuardrail(profile);

    // Reutiliza el mismo caché de recetas que el generador
    const cacheKey = buildGeneratorRecipeCacheKey({
      suggestion: { name: `${option.name} (${selectedServings} porciones)`, type: '' },
      ingredients: option.description || '',
      profile,
    });

    const prompt = `Receta completa para "${option.name}". ${option.description}. Perfil: ${profileStr}. Cal objetivo: ${option.calories}, Prot: ${option.protein}. Debe rendir para ${selectedServings} porciones.
${guardrailStr}
${budgetStr}
Devuelve SOLO este JSON:
${RECIPE_JSON_SCHEMA}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, GENERATOR_RECIPE_CACHE_KEY, 900);
      setSelectedRecipe({ ...result, servings: result.servings || `${selectedServings} porciones` });
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <MealPlanHeader
        profileGoals={profile.goals}
        plan={plan}
        planType={planType}
        loading={loading}
        selectedDayIdx={selectedDayIdx}
        onPlanTypeChange={setPlanType}
        onGeneratePlan={generatePlan}
        onSelectDay={handleSelectDay}
      />
      <MealPlanSettings
        planPreferences={planPreferences}
        onPlanPreferencesChange={setPlanPreferences}
        isTrainingDay={isTrainingDay}
        onTrainingDayToggle={() => setIsTrainingDay(!isTrainingDay)}
        optimizeBudget={profile.budgetFriendly}
        onOptimizeBudgetToggle={handleBudgetToggle}
      />
      <SavedMealsPanel
        savedMeals={savedMeals}
        onRemoveMeal={(index) => setSavedMeals(savedMeals.filter((_, idx) => idx !== index))}
      />
      <SupplementReminder
        creatineTaken={creatineTaken}
        onToggle={() => setCreatineTaken(!creatineTaken)}
      />

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 text-green-600">
          <RefreshCw className="animate-spin mb-4" size={48} />
          <p className="font-medium animate-pulse text-center">
            Planificando tu menú...
            {planType === 'Semanal' && <><br /><span className="text-sm opacity-80">Un plan de 7 días puede tomar unos segundos.</span></>}
          </p>
        </div>
      )}

      {plan && !loading && (
        <div>
          {/* Tab bar — solo móvil */}
          <div className="mb-4 flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm lg:hidden">
            <button
              type="button"
              onClick={() => setActiveTab('meals')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                activeTab === 'meals' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🍽 Comidas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('shopping')}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                activeTab === 'shopping' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🛒 Lista
            </button>
          </div>

          {/* Grid: 2 columnas en PC, 1 en móvil */}
          <div className="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-6">

            {/* Columna izquierda: Resumen + Comidas */}
            <div className={`space-y-6 ${activeTab === 'shopping' ? 'hidden lg:block' : ''}`}>
              <CollapsibleSection
                title="Resumen Nutricional"
                subtitle="Calorías, proteína y fibra del plan."
                icon={BarChart3}
                isExpanded={expandedSections.summary}
                onToggle={() => toggleSection('summary')}
              >
                <PlanSummary plan={plan} />
              </CollapsibleSection>

              <CollapsibleSection
                title="Comidas del Día"
                subtitle={null}
                icon={ChefHat}
                isExpanded={expandedSections.meals}
                onToggle={() => toggleSection('meals')}
              >
                <SelectedDayMeals
                  day={plan.days?.[selectedDayIdx]}
                  profile={profile}
                  selectedDayIdx={selectedDayIdx}
                  swappingData={swappingData}
                  customSwapRequest={customSwapRequest}
                  isSwapping={isSwapping}
                  selectedRecipe={selectedRecipe}
                  generatingRecipe={generatingRecipe}
                  onSwapStart={setSwappingData}
                  onSwapRequestChange={setCustomSwapRequest}
                  onSwapConfirm={handleSwapMeal}
                  onSwapCancel={() => setSwappingData(null)}
                  onGenerateRecipe={generateRecipeFromPlan}
                  onServingsChange={handleMealServingsChange}
                  onCloseRecipe={() => setSelectedRecipe(null)}
                />
              </CollapsibleSection>
            </div>

            {/* Columna derecha: Lista de compras (sticky en PC) */}
            <div className={`lg:sticky lg:top-24 space-y-6 ${activeTab === 'meals' ? 'hidden lg:block' : ''}`}>
              <CollapsibleSection
                title="Lista de Compras"
                subtitle={null}
                icon={ShoppingCart}
                isExpanded={expandedSections.shopping}
                onToggle={() => toggleSection('shopping')}
              >
                <ShoppingListSection
                  shoppingList={shoppingList}
                  loadingList={loadingList}
                  onGenerateShoppingList={generateShoppingList}
                  country={profile.country}
                  optimizeBudget={profile.budgetFriendly}
                  profile={profile}
                />
              </CollapsibleSection>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
