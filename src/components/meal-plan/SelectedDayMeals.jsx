import { Calendar, ChefHat, Edit3, Minus, RefreshCw, Plus, Users, X } from 'lucide-react';
import { parseServingsCount, scaleNutritionLabel } from '../../lib/recipeScaling.js';

export default function SelectedDayMeals({
  day,
  selectedDayIdx,
  swappingData,
  customSwapRequest,
  isSwapping,
  onSwapStart,
  onSwapRequestChange,
  onSwapConfirm,
  onSwapCancel,
  onGenerateRecipe,
  onServingsChange,
}) {
  if (!day) {
    return null;
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
        <Calendar className="text-orange-500" size={20} /> {day.dayName}
      </h3>

      <div className="grid gap-4">
        {day.meals.map((meal, mealIndex) => (
          <div key={`meal-${mealIndex}`} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative">
            <div className="flex justify-between items-center mb-4">
              <div className="bg-orange-100 px-3 py-1 rounded-xl text-orange-700 font-bold inline-block text-sm">
                {meal.type}
              </div>
              <button
                onClick={() => onSwapStart({ dayIdx: selectedDayIdx, mealIdx: mealIndex, currentMealName: meal.options?.[0]?.name || 'Comida' })}
                className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Edit3 size={14} /> Cambiar
              </button>
            </div>

            {swappingData?.dayIdx === selectedDayIdx && swappingData?.mealIdx === mealIndex && (
              <div className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-200 animate-in slide-in-from-top-2">
                <label className="block text-sm font-bold text-orange-900 mb-2">Por que quieres cambiar este plato?</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSwapRequest}
                    onChange={(e) => onSwapRequestChange(e.target.value)}
                    placeholder="Ej: Quiero algo mas liviano, sin huevos, muy rapido..."
                    className="flex-1 p-2 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                  />
                  <button
                    onClick={onSwapConfirm}
                    disabled={isSwapping || !customSwapRequest.trim()}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                  >
                    {isSwapping ? <RefreshCw className="animate-spin" size={16} /> : 'Generar'}
                  </button>
                  <button onClick={onSwapCancel} className="p-2 text-slate-400 hover:text-red-500">
                    <X size={18} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {meal.options && meal.options.map((option, optionIndex) => (
                <div key={`opt-${optionIndex}`} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors flex flex-col">
                  {(() => {
                    const baseServings = parseServingsCount(option.baseServings || option.servings || 1);
                    const selectedServings = parseServingsCount(option.selectedServings || option.servings || baseServings);
                    const factor = selectedServings / baseServings;

                    return (
                      <>
                  <h4 className="font-bold text-slate-800 flex justify-between items-start mb-1 gap-2">
                    {option.name}
                    {meal.options.length > 1 && <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md shrink-0">Opcion {optionIndex + 1}</span>}
                  </h4>
                  <p className="text-slate-600 text-sm mb-4 flex-1">{option.description}</p>
                  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Porciones</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                        <Users size={14} className="text-orange-500" /> {selectedServings} personas
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onServingsChange(selectedDayIdx, mealIndex, optionIndex, selectedServings - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50"
                        aria-label="Reducir porciones"
                      >
                        <Minus size={16} />
                      </button>
                      <button
                        onClick={() => onServingsChange(selectedDayIdx, mealIndex, optionIndex, selectedServings + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-200 bg-orange-50 text-orange-700 transition-colors hover:bg-orange-100"
                        aria-label="Aumentar porciones"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="inline-block text-xs font-semibold bg-white border border-slate-100 text-slate-600 px-2 py-1 rounded-md shadow-sm">
                      🔥 {scaleNutritionLabel(option.calories, factor)}
                    </span>
                    <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                      🥩 {scaleNutritionLabel(option.protein, factor)}
                    </span>
                    <span className="inline-block text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-md">
                      🌿 {scaleNutritionLabel(option.fiber, factor)}
                    </span>
                  </div>
                  <button
                    onClick={() => onGenerateRecipe(option)}
                    className="w-full py-2 bg-white text-orange-600 border border-orange-200 font-semibold rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 mt-auto"
                  >
                    <ChefHat size={16} /> Ver Receta
                  </button>
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
