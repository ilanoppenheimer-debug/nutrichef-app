import { Calendar, RefreshCw } from 'lucide-react';

function getDayShortLabel(dayName = '', index = 0) {
  const normalized = String(dayName || '').toLowerCase();

  if (normalized.includes('lun')) return 'Lun';
  if (normalized.includes('mar')) return 'Mar';
  if (normalized.includes('mie') || normalized.includes('mié')) return 'Mié';
  if (normalized.includes('jue')) return 'Jue';
  if (normalized.includes('vie')) return 'Vie';
  if (normalized.includes('sab') || normalized.includes('sáb')) return 'Sáb';
  if (normalized.includes('dom')) return 'Dom';

  return `D${index + 1}`;
}

export default function MealPlanHeader({
  profileGoals,
  plan,
  planType,
  loading,
  selectedDayIdx = 0,
  onPlanTypeChange,
  onGeneratePlan,
  onSelectDay,
}) {
  const selectedDayName = plan?.days?.[selectedDayIdx]?.dayName || `Día ${selectedDayIdx + 1}`;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-md md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Planificador Inteligente</h2>
          <p className="mt-1 text-sm text-slate-500">Genera un menú alineado a tus metas ({profileGoals}).</p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto">
          <select
            value={planType}
            onChange={(e) => onPlanTypeChange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none focus:border-transparent focus:ring-2 focus:ring-[--c-primary]"
          >
            <option value="Diario">{plan && plan.days?.length > 1 ? 'Solo el Día Seleccionado' : 'Plan de 1 Día'}</option>
            <option value="Semanal">Plan Semanal (Meal Prep)</option>
          </select>

          <button
            onClick={onGeneratePlan}
            disabled={loading}
            className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-green-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-70"
          >
            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Calendar size={20} />}
            {plan ? (planType === 'Diario' && plan.days?.length > 1 ? 'Regenerar Día Actual' : 'Regenerar Plan') : 'Crear Plan'}
          </button>
        </div>
      </div>

      {plan?.days?.length > 1 && typeof onSelectDay === 'function' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Semana</p>
              <h3 className="text-lg font-bold tracking-tight text-slate-800">Navega tus 7 días sin perder contexto</h3>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 sm:inline-flex">
              {selectedDayName}
            </span>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x">
            {plan.days.map((day, idx) => {
              const isActive = selectedDayIdx === idx;

              return (
                <div key={`day-${idx}`} className="snap-start shrink-0 text-center">
                  <button
                    type="button"
                    onClick={() => onSelectDay(idx)}
                    title={day.dayName}
                    aria-label={`Seleccionar ${day.dayName}`}
                    className={`h-10 w-10 rounded-full border text-[11px] font-black transition-all ${
                      isActive
                        ? 'border-transparent bg-[--c-primary] text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[--c-primary-border] hover:bg-[--c-primary-light]'
                    }`}
                  >
                    {getDayShortLabel(day.dayName, idx).slice(0, 2)}
                  </button>
                  <p className={`mt-1.5 text-[10px] font-bold ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                    {idx + 1}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-slate-500 sm:hidden">Día activo: <span className="font-bold text-slate-700">{selectedDayName}</span></p>
        </div>
      )}
    </div>
  );
}
