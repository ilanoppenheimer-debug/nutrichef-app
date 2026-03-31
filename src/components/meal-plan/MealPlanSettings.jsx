import { Activity, PiggyBank, Settings } from 'lucide-react';

export default function MealPlanSettings({
  planPreferences,
  onPlanPreferencesChange,
  isTrainingDay,
  onTrainingDayToggle,
  optimizeBudget,
  onOptimizeBudgetToggle,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
      <h4 className="font-bold text-slate-800 flex items-center gap-2"><Settings size={18} className="text-slate-500" /> Ajustes de este Plan</h4>

      <div className="grid lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tienes alguna preferencia hoy?</label>
          <input
            type="text"
            value={planPreferences}
            onChange={(e) => onPlanPreferencesChange(e.target.value)}
            placeholder="Ej: Quiero comer mas legumbres, menos carne..."
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none bg-slate-50 text-sm transition-all"
          />
        </div>

        <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200">
          <div>
            <h4 className="font-bold text-orange-900 text-sm flex items-center gap-1"><Activity size={16} /> Dia de Entrenamiento</h4>
            <p className="text-xs text-orange-700">Aumenta ligeramente carbohidratos y calorias.</p>
          </div>
          <button onClick={onTrainingDayToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTrainingDay ? 'bg-orange-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTrainingDay ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200">
          <div>
            <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1"><PiggyBank size={16} /> Optimizar Presupuesto</h4>
            <p className="text-xs text-emerald-700">Reduce costo estimado y prioriza formatos ahorro.</p>
          </div>
          <button onClick={onOptimizeBudgetToggle} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${optimizeBudget ? 'bg-emerald-600' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${optimizeBudget ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
