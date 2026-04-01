export default function PlanSummary({ plan }) {
  if (!plan) {
    return null;
  }

  const stats = [
    { icon: '🔥', label: 'Calorías/día', value: plan.totalCalories },
    { icon: '🥩', label: 'Proteína', value: plan.totalProtein },
    plan.totalFiber ? { icon: '🌿', label: 'Fibra', value: plan.totalFiber } : null,
    plan.days?.length ? { icon: '📅', label: 'Días', value: plan.days.length } : null,
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ icon, label, value }) => (
        <div key={label} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm text-center">
          <p className="text-xl">{icon}</p>
          <p className="mt-1 text-sm font-black text-slate-800">{value}</p>
          <p className="text-[11px] font-medium text-slate-400">{label}</p>
        </div>
      ))}
    </div>
  );
}
