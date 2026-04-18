import { Target } from 'lucide-react';

export default function ProfileMainGoalSection({ profile, setProfile }) {
  return (
    <section className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
      <h3 className="text-base font-black mb-4 flex items-center gap-2" style={{ color: 'var(--c-primary-text)' }}>
        <Target size={18} /> Tu Meta Principal
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--c-primary-text)' }}>
            Objetivo
          </label>
          <select
            value={profile.goals}
            onChange={(e) => setProfile({ ...profile, goals: e.target.value, manualCalories: false })}
            className="w-full p-3 rounded-xl border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-medium"
            style={{ borderColor: 'var(--c-primary-border)' }}
          >
            <option>Mantenimiento y energia</option>
            <option>Déficit calórico (Pérdida de peso)</option>
            <option>Superávit calórico (Ganancia muscular)</option>
            <option>Comer más saludable general</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--c-primary-text)' }}>
            Nivel de actividad
          </label>
          <select
            value={profile.activityLevel}
            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value, manualCalories: false })}
            className="w-full p-3 rounded-xl border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-medium"
            style={{ borderColor: 'var(--c-primary-border)' }}
          >
            <option value="1.2">Sedentario</option>
            <option value="1.375">Ligero (1-3 días/semana)</option>
            <option value="1.55">Moderado (3-5 días/semana)</option>
            <option value="1.725">Activo (6-7 días/semana)</option>
          </select>
        </div>
      </div>
    </section>
  );
}
