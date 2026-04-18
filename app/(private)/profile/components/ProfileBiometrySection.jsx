import { Activity, ChevronDown, ChevronUp, Dumbbell, PiggyBank } from 'lucide-react';

export default function ProfileBiometrySection({ profile, setProfile, openSections, toggleProfileSection }) {
  return (
    <section className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-md">
      <button type="button" onClick={() => toggleProfileSection('biometry')} className="flex w-full items-center justify-between">
        <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Activity size={16} className="text-blue-500" /> Biometría y Macros
        </h3>
        {openSections.biometry ? (
          <ChevronUp size={16} className="text-slate-400" />
        ) : (
          <ChevronDown size={16} className="text-slate-400" />
        )}
      </button>
      {openSections.biometry && (
        <div className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Edad', field: 'age', placeholder: '30' },
              { label: 'Peso (kg)', field: 'weight', placeholder: '70' },
              { label: 'Altura (cm)', field: 'height', placeholder: '175' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
                <input
                  type="number"
                  value={profile[field]}
                  onChange={(e) => setProfile({ ...profile, [field]: e.target.value, manualCalories: false })}
                  placeholder={placeholder}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Género</label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value, manualCalories: false })}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 outline-none bg-white dark:bg-gray-800 dark:text-white text-sm"
              >
                <option>Femenino</option>
                <option>Masculino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 dark:border-gray-700">
            {[
              { label: 'Calorías', field: 'dailyCalories', manualKey: 'manualCalories', suffix: 'kcal', color: 'orange' },
              { label: 'Proteína', field: 'proteinTarget', manualKey: 'manualProtein', suffix: 'g', color: 'blue' },
              { label: 'Carbohidratos', field: 'carbTarget', manualKey: 'manualCarb', suffix: 'g', color: 'amber' },
              { label: 'Fibra', field: 'fiberTarget', manualKey: 'manualFiber', suffix: 'g', color: 'green' },
            ].map(({ label, field, manualKey, suffix, color }) => (
              <div
                key={field}
                className={`bg-${color}-50 dark:bg-${color}-900/20 p-3 rounded-xl border border-${color}-100 dark:border-${color}-800`}
              >
                <div className="flex justify-between items-center mb-1">
                  <label className={`text-xs font-bold text-${color}-800 dark:text-${color}-300`}>{label}</label>
                  {profile[manualKey] && (
                    <span
                      className={`text-[9px] bg-${color}-200 dark:bg-${color}-800 text-${color}-700 px-1.5 py-0.5 rounded-full font-bold`}
                    >
                      Manual
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={profile[field]}
                    onChange={(e) => setProfile({ ...profile, [field]: e.target.value, [manualKey]: true })}
                    placeholder="—"
                    className="flex-1 p-2 rounded-lg border outline-none bg-white dark:bg-gray-800 dark:text-white text-sm font-bold min-w-0"
                  />
                  <span className={`text-xs text-${color}-600 dark:text-${color}-400 font-medium shrink-0`}>{suffix}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-gray-700">
            {[
              {
                key: 'useProteinPowder',
                label: 'Proteína en Polvo',
                desc: 'Permite recetas con suplemento.',
                icon: Dumbbell,
                color: 'blue',
              },
              {
                key: 'budgetFriendly',
                label: 'Modo Económico',
                desc: 'Prioriza recetas de bajo costo.',
                icon: PiggyBank,
                color: 'emerald',
              },
            ].map(({ key, label, desc, icon: Icon, color }) => (
              <div
                key={key}
                className={`flex items-center justify-between bg-${color}-50 dark:bg-${color}-900/20 p-4 rounded-xl border border-${color}-200 dark:border-${color}-800`}
              >
                <div>
                  <h4 className={`font-bold text-${color}-900 dark:text-${color}-300 text-sm flex items-center gap-1`}>
                    <Icon size={15} /> {label}
                  </h4>
                  <p className={`text-xs text-${color}-700 dark:text-${color}-400`}>{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, [key]: !profile[key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    profile[key] ? `bg-${color}-600` : 'bg-slate-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
