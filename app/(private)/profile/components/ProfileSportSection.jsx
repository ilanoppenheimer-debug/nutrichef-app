import { Trophy } from 'lucide-react';

import { SPORT_OPTIONS } from '../constants';

export default function ProfileSportSection({ profile, setProfile }) {
  return (
    <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
      <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Trophy size={16} className="text-amber-500" /> Deporte y Entrenamiento
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Ajusta el TDEE y la proteína según tu tipo de entrenamiento.</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {SPORT_OPTIONS.map((sport) => (
          <button
            key={sport}
            type="button"
            onClick={() => setProfile({ ...profile, sportType: sport, manualCalories: false })}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              profile.sportType === sport ? 'text-white' : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-slate-300'
            }`}
            style={profile.sportType === sport ? { background: 'var(--c-primary)' } : {}}
          >
            {sport}
          </button>
        ))}
      </div>
      {profile.sportType !== 'Ninguno' && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Duración por sesión</label>
            <div className="flex items-center border border-slate-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
              <input
                type="number"
                value={profile.trainingDuration}
                onChange={(e) => setProfile({ ...profile, trainingDuration: e.target.value, manualCalories: false })}
                placeholder="60"
                className="flex-1 p-3 outline-none text-sm dark:text-white bg-transparent"
              />
              <span className="px-2 text-xs text-slate-400 font-medium">min</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Días por semana</label>
            <select
              value={profile.trainingDaysPerWeek}
              onChange={(e) => setProfile({ ...profile, trainingDaysPerWeek: e.target.value, manualCalories: false })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm"
            >
              {['1', '2', '3', '4', '5', '6', '7'].map((d) => (
                <option key={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
