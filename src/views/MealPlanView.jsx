import { useState } from 'react';
import { ChevronRight, RefreshCw } from 'lucide-react';
import MealPlanHeader from '../components/meal-plan/MealPlanHeader.jsx';
import MealPlanSettings from '../components/meal-plan/MealPlanSettings.jsx';
import PlanSummary from '../components/meal-plan/PlanSummary.jsx';
import RecipeCard from '../components/RecipeCard.jsx';
import SavedMealsPanel from '../components/meal-plan/SavedMealsPanel.jsx';
import SelectedDayMeals from '../components/meal-plan/SelectedDayMeals.jsx';
import ShoppingListSection from '../components/meal-plan/ShoppingListSection.jsx';
import SupplementReminder from '../components/meal-plan/SupplementReminder.jsx';
import { useAppState } from '../context/appState.js';
import {
  callGeminiAPI,
  compactProfile,
  buildMealPlanCacheKey,
  buildShoppingCacheKey,
  buildGeneratorRecipeCacheKey,
  MEALPLAN_CACHE_KEY,
  SHOPPING_CACHE_KEY,
  GENERATOR_RECIPE_CACHE_KEY,
} from '../lib/gemini.js';

export default function MealPlanView() {
  const { profile, setPlan, plan, savedMeals, setSavedMeals, favoriteRecipes } = useAppState();
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

  const profileStr = compactProfile(profile);
  const favStr = favoriteRecipes?.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : '';

  const generatePlan = async () => {
    setLoading(true);
    setShoppingList(null);
    setSwappingData(null);

    const isWeekly = planType === 'Semanal';
    const isUpdatingSingleDay = !isWeekly && plan?.days?.length > 0;
    const targetDayName = isUpdatingSingleDay ? plan.days[selectedDayIdx].dayName : (isWeekly ? 'Dia 1 (Lunes)' : 'Hoy');

    const planCacheKey = buildMealPlanCacheKey({ planType, isTrainingDay, planPreferences, profile, savedMeals });

    const prompt = `Crea un plan de comidas ${isWeekly ? 'SEMANAL (7 dias, Batch Cooking)' : 'de 1 DIA'}.
Perfil: ${profileStr}${favStr ? `. Inspiracion: ${favStr}` : ''}.${planPreferences ? ` Preferencias: ${planPreferences}.` : ''}${isTrainingDay ? ' Dia entrenamiento: +200kcal, prioriza carbohidratos.' : ' Dia descanso: calorias base.'}${savedMeals.length > 0 ? ` Incluir obligatorio: ${savedMeals.map(m => m.title).join(', ')}.` : ''}
${isWeekly ? 'No repetir el mismo menu exacto los 7 dias.' : 'Ofrece 2 opciones por tipo de comida.'}
Devuelve SOLO este JSON:
{"summary":"...","totalCalories":"...","totalProtein":"...","totalFiber":"...","days":[{"dayName":"${targetDayName}","meals":[{"type":"Desayuno","options":[{"name":"...","description":"...","calories":"...","protein":"...","fiber":"..."}]}]}]}`;

    try {
      const result = await callGeminiAPI(
        prompt,
        planCacheKey,
        MEALPLAN_CACHE_KEY,
        isWeekly ? 2000 : 800  // plan semanal necesita más tokens
      );

      if (isUpdatingSingleDay && result.days?.length > 0) {
        const updatedPlan = { ...plan };
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

    // El swap no se cachea — es siempre una petición nueva y específica
    const prompt = `Reemplaza "${currentMealName}" (${currentMealType}) del ${plan.days[dayIdx].dayName}.
Petición: "${customSwapRequest}". Perfil: ${profileStr}.
Devuelve SOLO este JSON:
{"options":[{"name":"...","description":"...","calories":"...","protein":"...","fiber":"..."}]}`;

    try {
      const result = await callGeminiAPI(prompt, null, null, 200);
      const newPlan = { ...plan };
      newPlan.days[dayIdx].meals[mealIdx].options = result.options;
      setPlan(newPlan);
      setSwappingData(null);
      setCustomSwapRequest('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  };

  const generateRecipeFromPlan = async (option) => {
    setGeneratingRecipe(true);

    // Reutiliza el mismo caché de recetas que el generador
    const cacheKey = buildGeneratorRecipeCacheKey({
      suggestion: { name: option.name, type: '' },
      ingredients: option.description || '',
      profile,
    });

    const prompt = `Receta completa para "${option.name}". ${option.description}. Perfil: ${profileStr}. Cal objetivo: ${option.calories}, Prot: ${option.protein}.
Devuelve SOLO este JSON:
{"title":"...","description":"...","prepTime":"...","cookTime":"...","cuisine":"...","ingredients":[{"name":"...","amount":"...","substitute":"..."}],"steps":["..."],"macros":{"calories":"...","protein":"...","carbs":"...","fat":"...","fiber":"..."},"tips":"..."}`;

    try {
      const result = await callGeminiAPI(prompt, cacheKey, GENERATOR_RECIPE_CACHE_KEY, 900);
      setSelectedRecipe(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const generateShoppingList = async () => {
    if (!plan) return;
    setLoadingList(true);

    // El shopping list se cachea por los nombres de las comidas del plan
    const shoppingCacheKey = buildShoppingCacheKey(plan);
    const mealNames = plan.days?.flatMap(d =>
      d.meals?.flatMap(m => m.options?.map(o => o.name) ?? []) ?? []
    ).join(', ');

    const prompt = `Lista de compras para este plan: ${mealNames}.${profile.budgetFriendly ? ' Modo economico: sugiere marcas blancas y compras al por mayor.' : ''}
Agrupa por categoria de supermercado con cantidades totales aproximadas.
Devuelve SOLO este JSON:
{"categories":[{"name":"...","items":[{"name":"...","amount":"..."}]}]}`;

    try {
      const result = await callGeminiAPI(prompt, shoppingCacheKey, SHOPPING_CACHE_KEY, 600);
      setShoppingList(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  if (generatingRecipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-green-600">
        <RefreshCw className="animate-spin mb-4" size={48} />
        <p className="font-medium animate-pulse">Escribiendo la receta detallada...</p>
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedRecipe(null)} className="mb-4 text-green-600 font-medium flex items-center gap-1 hover:underline">
          <ChevronRight className="rotate-180" size={18} /> Volver a mi Plan
        </button>
        <RecipeCard recipe={selectedRecipe} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <MealPlanHeader
        profileGoals={profile.goals}
        plan={plan}
        planType={planType}
        loading={loading}
        onPlanTypeChange={setPlanType}
        onGeneratePlan={generatePlan}
      />
      <MealPlanSettings
        planPreferences={planPreferences}
        onPlanPreferencesChange={setPlanPreferences}
        isTrainingDay={isTrainingDay}
        onTrainingDayToggle={() => setIsTrainingDay(!isTrainingDay)}
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
        <div className="space-y-8">
          <PlanSummary plan={plan} selectedDayIdx={selectedDayIdx} onSelectDay={setSelectedDayIdx} />
          <SelectedDayMeals
            day={plan.days?.[selectedDayIdx]}
            selectedDayIdx={selectedDayIdx}
            swappingData={swappingData}
            customSwapRequest={customSwapRequest}
            isSwapping={isSwapping}
            onSwapStart={setSwappingData}
            onSwapRequestChange={setCustomSwapRequest}
            onSwapConfirm={handleSwapMeal}
            onSwapCancel={() => setSwappingData(null)}
            onGenerateRecipe={generateRecipeFromPlan}
          />
          <ShoppingListSection
            shoppingList={shoppingList}
            loadingList={loadingList}
            onGenerateShoppingList={generateShoppingList}
          />
        </div>
      )}
    </div>
  );
}
