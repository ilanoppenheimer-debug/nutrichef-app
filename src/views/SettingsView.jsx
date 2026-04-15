import { useState } from 'react';
import { CheckCircle2, Globe, LogOut, Monitor, Moon, RefreshCw, ShieldCheck, Sun, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme, THEMES } from '../context/ThemeContext.jsx';
import { useProfileStore } from '../stores/useProfileStore.js';
import { useFoodPreferences } from '../hooks/useFoodPreferences.js';
import { ROUTES } from '../routes/paths.js';
import PageLayout from '../components/base/PageLayout.jsx';
import BaseCard from '../components/base/BaseCard.jsx';
import BaseButton from '../components/base/BaseButton.jsx';
import { useConfirmDialog } from '../context/ConfirmDialogContext.jsx';

const COUNTRIES = [
  'Chile', 'Argentina', 'México', 'Colombia', 'Perú', 'España',
  'Venezuela', 'Ecuador', 'Uruguay', 'Bolivia', 'Paraguay',
  'Estados Unidos', 'Brasil', 'Israel',
];

const LANGUAGES = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

export default function SettingsView() {
  const navigate = useNavigate();
  const { user, isLocalMode, logout, linkToGoogle } = useAuth();
  const { themeId, setTheme, colorMode, setMode } = useTheme();
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const { summaryLines } = useFoodPreferences();
  const { askConfirmation } = useConfirmDialog();
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  const handleLinkGoogle = async () => {
    const confirmed = await askConfirmation({
      title: 'Vincular cuenta Google',
      description: '¿Quieres vincular tu cuenta local con Google para sincronizar datos?',
      confirmLabel: 'Sí, vincular',
    });
    if (!confirmed) return;
    setLinkingGoogle(true);
    try {
      await linkToGoogle();
    } catch (err) {
      console.error(err);
    } finally {
      setLinkingGoogle(false);
    }
  };

  const handleLogout = async () => {
    const confirmed = await askConfirmation({
      title: 'Cerrar sesión',
      description: '¿Seguro que quieres cerrar tu sesión actual?',
      confirmLabel: 'Sí, cerrar sesión',
      danger: true,
    });
    if (confirmed) logout();
  };

  return (
    <PageLayout title="Configuración">

      <BaseCard title="Cuenta" className="overflow-hidden">
        <div className="p-5 flex items-center gap-4">
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full border-2 shadow-sm" style={{ borderColor: 'var(--c-primary-border)' }} />
          ) : (
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ background: 'var(--c-primary)' }}>
              {user?.displayName?.[0] || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 dark:text-white truncate">{user?.displayName || (isLocalMode ? 'Modo local' : 'Usuario')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || (isLocalMode ? 'Sin cuenta - solo este dispositivo' : '')}</p>
          </div>
          {isLocalMode ? (
            <BaseButton onClick={handleLinkGoogle} disabled={linkingGoogle} className="shrink-0">
              {linkingGoogle ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
              <span className="hidden sm:inline">Vincular Google</span>
            </BaseButton>
          ) : (
            <BaseButton variant="secondary" onClick={handleLogout} className="shrink-0 text-slate-500 hover:text-red-600">
              <LogOut size={15} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </BaseButton>
          )}
        </div>
        {isLocalMode && (
          <div className="mx-5 mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
            ⚠️ En modo local tus datos no se sincronizan. Vincula tu cuenta Google para no perderlos.
          </div>
        )}
      </BaseCard>

      <BaseCard title="Preferencias alimentarias" className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <ShieldCheck size={12} /> Preferencias alimentarias
          </h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Fuente única para kosher, dietas y restricciones.
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Estas preferencias influyen siempre en los resultados de la IA.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {summaryLines.length > 0 ? summaryLines.map(item => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-gray-700 dark:bg-gray-800 dark:text-slate-300"
              >
                {item}
              </span>
            )) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No hay preferencias activas.
              </p>
            )}
          </div>

          <button
            onClick={() => navigate(ROUTES.preferences)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 py-3 text-sm font-bold text-white"
            style={{ background: 'var(--c-primary)' }}
          >
            Editar preferencias
          </button>
        </div>
      </BaseCard>

      <BaseCard title="Localización" className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Globe size={12} /> Localización
          </h2>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">País / Región</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              La IA usará nombres locales de ingredientes y marcas de tu país. Ej: "palta" en Chile, "aguacate" en México.
            </p>
            <select
              value={profile.country || 'Chile'}
              onChange={e => setProfile({ ...profile, country: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white text-sm outline-none focus:ring-2 min-h-[48px]"
              style={{ '--tw-ring-color': 'var(--c-primary)' }}
            >
              {COUNTRIES.map(country => <option key={country}>{country}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Idioma de respuesta</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Las recetas generadas por la IA responderán en el idioma seleccionado.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LANGUAGES.map(language => (
                <button
                  key={language.code}
                  onClick={() => setProfile({ ...profile, language: language.code })}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all min-h-[48px] ${
                    (profile.language || 'es') === language.code
                      ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                      : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-[--c-primary-border]'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span>{language.label}</span>
                  {(profile.language || 'es') === language.code && <CheckCircle2 size={13} className="ml-auto shrink-0" style={{ color: 'var(--c-primary)' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard title="Apariencia" className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-gray-800">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Apariencia</h2>
        </div>
        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Modo</p>
            <div className="flex gap-2">
              {[
                { value: null, label: 'Sistema', icon: Monitor },
                { value: 'light', label: 'Claro', icon: Sun },
                { value: 'dark', label: 'Oscuro', icon: Moon },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={String(value)}
                  onClick={() => setMode(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all min-h-[64px] ${
                    colorMode === value
                      ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                      : 'border-slate-200 dark:border-gray-700 text-slate-500 dark:text-slate-400 hover:border-[--c-primary-border]'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Color del tema</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(THEMES).map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all min-h-[44px] ${
                    themeId === theme.id
                      ? 'border-[--c-primary] bg-[--c-primary-light] text-[--c-primary-text]'
                      : 'border-slate-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <span>{theme.emoji}</span>
                  {theme.label}
                  {themeId === theme.id && <CheckCircle2 size={13} style={{ color: 'var(--c-primary)' }} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard className="overflow-hidden">
        <div className="p-5 space-y-1 text-sm text-slate-500 dark:text-slate-400">
          <p>NutriChef IA - App personal de nutrición</p>
          <p className="text-xs">Potenciado por Google Gemini 2.5 Flash</p>
        </div>
      </BaseCard>
    </PageLayout>
  );
}
