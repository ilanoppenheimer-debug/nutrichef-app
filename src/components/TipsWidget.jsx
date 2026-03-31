import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, ChevronRight, Lightbulb, RefreshCw, Ruler, Scale, Utensils, X } from 'lucide-react';

// ─── Tips estáticos — no cuestan tokens ───────────────────────────────────────

const DAILY_TIPS = [
  { emoji: '🧂', text: 'Sazona el agua de cocción de la pasta — debe saber a mar, no a sal.' },
  { emoji: '🍳', text: 'Seca bien la carne antes de sellar. La humedad impide que se dore.' },
  { emoji: '🥚', text: 'Los huevos a temperatura ambiente emulsionan mejor en masas.' },
  { emoji: '🧄', text: 'Aplasta el ajo antes de picarlo — libera más sabor y aroma.' },
  { emoji: '🍋', text: 'Un chorrito de limón al final realza todos los sabores del plato.' },
  { emoji: '🥩', text: 'Deja reposar la carne 5 min después de cocinarla — los jugos se redistribuyen.' },
  { emoji: '🫙', text: 'Guarda las hierbas frescas como flores: en un vaso con agua en la nevera.' },
  { emoji: '🧅', text: 'Cebolla en el congelador 15 min antes de cortarla — sin lágrimas.' },
  { emoji: '🥦', text: 'Verduras al vapor: empiezan a contar cuando el agua hierve, no antes.' },
  { emoji: '🍝', text: 'Guarda un vaso del agua de cocción — el almidón liga salsas perfectamente.' },
  { emoji: '🫒', text: 'El aceite de oliva extra virgen pierde propiedades al freír. Úsalo en frío.' },
  { emoji: '🍚', text: 'Lava el arroz hasta que el agua salga clara — menos almidón, más suelto.' },
  { emoji: '🌡️', text: 'La mantequilla a temperatura ambiente para hornear: lista en 30 min fuera de la nevera.' },
  { emoji: '🥗', text: 'Aliña la ensalada justo antes de servir — evita que se ablande.' },
  { emoji: '🧁', text: 'No abras el horno los primeros 2/3 del tiempo de horneado — el bizcocho baja.' },
];

const TECHNIQUES = [
  { title: 'Juliana', desc: 'Corte en tiras finas (3mm x 5cm). Ideal para salteados y sopas.', emoji: '🔪' },
  { title: 'Brunoise', desc: 'Cubo pequeño (3mm). Para sofritos y salsas que necesitan textura uniforme.', emoji: '🎲' },
  { title: 'Chiffonade', desc: 'Hojas apiladas, enrolladas y cortadas en cintas finas. Para albahaca y espinacas.', emoji: '🌿' },
  { title: 'Sellar', desc: 'Dorar la superficie a fuego alto para crear costra. No cocina por dentro.', emoji: '🥩' },
  { title: 'Sofreír', desc: 'Cocinar a fuego medio-bajo con poca grasa hasta ablandar, sin dorar.', emoji: '🍳' },
  { title: 'Desglasar', desc: 'Añadir líquido a la sartén caliente para levantar los fondos caramelizados.', emoji: '🍷' },
  { title: 'Blanquear', desc: 'Hervir brevemente y enfriar en agua con hielo. Fija el color de verduras.', emoji: '🥦' },
  { title: 'Mise en place', desc: 'Preparar y organizar todos los ingredientes ANTES de empezar a cocinar.', emoji: '📋' },
  { title: 'Al dente', desc: 'Pasta o verdura con resistencia al morder. Saca la pasta 1 min antes del tiempo indicado.', emoji: '🍝' },
  { title: 'Fuego suave', desc: 'Burbujas lentas y ocasionales. Para guisos, salsas y cocción lenta.', emoji: '🔥' },
];

const SUBSTITUTIONS = [
  { from: 'Huevo (1)', to: '1 cdas de semillas de chía + 3 cdas de agua (reposar 5 min)', emoji: '🌱' },
  { from: 'Mantequilla (100g)', to: '85g de aceite de coco o 90g de aceite de oliva suave', emoji: '🫒' },
  { from: 'Leche entera (1 taza)', to: 'Leche vegetal (avena/almendra/soja) en misma cantidad', emoji: '🥛' },
  { from: 'Harina de trigo (1 taza)', to: '⅞ taza de harina de arroz o avena molida', emoji: '🌾' },
  { from: 'Azúcar (1 taza)', to: '¾ taza de miel o ½ taza de dátiles triturados', emoji: '🍯' },
  { from: 'Crema de leche (1 taza)', to: 'Leche de coco entera o yogur griego diluido con leche', emoji: '🥥' },
  { from: 'Vinagre (1 cda)', to: '1 cda de zumo de limón o lima', emoji: '🍋' },
  { from: 'Pan rallado (½ taza)', to: 'Copos de avena molidos o almendras molidas', emoji: '🌰' },
  { from: 'Vino blanco (½ taza)', to: 'Caldo de pollo + 1 cda de vinagre de manzana', emoji: '🍾' },
  { from: 'Queso ricotta (1 taza)', to: 'Queso cottage escurrido o tofu sedoso triturado', emoji: '🧀' },
];

const MEASURES = [
  { label: 'Volumen', items: [
    '1 taza = 240 ml',
    '½ taza = 120 ml',
    '¼ taza = 60 ml',
    '1 cda (cucharada) = 15 ml',
    '1 cdta (cucharadita) = 5 ml',
    '1 fl oz = 30 ml',
  ]},
  { label: 'Peso', items: [
    '1 oz = 28 g',
    '1 lb = 453 g',
    '1 stick mantequilla = 113 g',
  ]},
  { label: 'Temperatura horno', items: [
    '150°C = 300°F (suave)',
    '175°C = 350°F (moderado)',
    '200°C = 400°F (fuerte)',
    '220°C = 425°F (muy fuerte)',
    '230°C = 450°F (muy alto)',
  ]},
  { label: 'Aproximados útiles', items: [
    '1 taza de arroz crudo ≈ 185 g',
    '1 taza de harina ≈ 120 g',
    '1 taza de azúcar ≈ 200 g',
    '1 cda de aceite ≈ 14 g',
    '1 huevo grande ≈ 50 g sin cáscara',
  ]},
];

const TABS = [
  { id: 'tip', label: 'Tip del día', icon: Lightbulb },
  { id: 'techniques', label: 'Técnicas', icon: Utensils },
  { id: 'substitutions', label: 'Sustituciones', icon: ArrowLeftRight },
  { id: 'measures', label: 'Medidas', icon: Ruler },
];

// Elige un tip del día basado en la fecha (cambia cada día, no en cada render)
function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
}

function getDailyTechnique() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return TECHNIQUES[dayOfYear % TECHNIQUES.length];
}

export default function TipsWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('tip');
  const [techIdx, setTechIdx] = useState(() => TECHNIQUES.indexOf(getDailyTechnique()));
  const [subIdx, setSubIdx] = useState(0);
  const panelRef = useRef(null);

  const dailyTip = getDailyTip();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'var(--c-primary)' }}
        title="Tips de cocina"
        aria-label="Abrir tips de cocina"
      >
        {open ? <X size={20} className="text-white" /> : <Lightbulb size={22} className="text-white" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-36 right-4 sm:bottom-20 sm:right-6 z-30 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 dark:border-gray-800" style={{ background: 'var(--c-primary-light)' }}>
            <span className="font-black text-sm" style={{ color: 'var(--c-primary-text)' }}>💡 Tips de Cocina</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-gray-800 overflow-x-auto no-scrollbar">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-bold transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'text-[--c-primary] border-b-2 border-[--c-primary]'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido */}
          <div className="p-4 max-h-72 overflow-y-auto">

            {/* Tip del día */}
            {tab === 'tip' && (
              <div className="space-y-3">
                <div className="rounded-xl p-4 border" style={{ background: 'var(--c-primary-light)', borderColor: 'var(--c-primary-border)' }}>
                  <div className="text-3xl mb-2">{dailyTip.emoji}</div>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: 'var(--c-primary-text)' }}>{dailyTip.text}</p>
                  <p className="text-xs mt-2 opacity-50" style={{ color: 'var(--c-primary-text)' }}>Tip del día — cambia mañana</p>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Explora las otras pestañas para técnicas, sustituciones y equivalencias 👆</p>
              </div>
            )}

            {/* Técnicas */}
            {tab === 'techniques' && (
              <div className="space-y-2">
                {TECHNIQUES.map((t, i) => (
                  <div
                    key={t.title}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      techIdx === i
                        ? 'border-[--c-primary] bg-[--c-primary-light]'
                        : 'border-slate-100 dark:border-gray-700 hover:border-[--c-primary-border] bg-slate-50 dark:bg-gray-800'
                    }`}
                    onClick={() => setTechIdx(techIdx === i ? -1 : i)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{t.emoji}</span>
                      <span className="font-bold text-sm text-slate-800 dark:text-white">{t.title}</span>
                      <ChevronRight size={14} className={`ml-auto text-slate-400 transition-transform ${techIdx === i ? 'rotate-90' : ''}`} />
                    </div>
                    {techIdx === i && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed pl-7">{t.desc}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sustituciones */}
            {tab === 'substitutions' && (
              <div className="space-y-2">
                {SUBSTITUTIONS.map((s, i) => (
                  <div
                    key={s.from}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      subIdx === i
                        ? 'border-[--c-primary] bg-[--c-primary-light]'
                        : 'border-slate-100 dark:border-gray-700 hover:border-[--c-primary-border] bg-slate-50 dark:bg-gray-800'
                    }`}
                    onClick={() => setSubIdx(subIdx === i ? -1 : i)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.emoji}</span>
                      <span className="font-bold text-xs text-slate-800 dark:text-white flex-1 leading-tight">{s.from}</span>
                      <ChevronRight size={14} className={`text-slate-400 transition-transform ${subIdx === i ? 'rotate-90' : ''}`} />
                    </div>
                    {subIdx === i && (
                      <div className="mt-2 pl-6">
                        <div className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--c-primary-text)' }}>
                          <ArrowLeftRight size={11} className="shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{s.to}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Medidas */}
            {tab === 'measures' && (
              <div className="space-y-4">
                {MEASURES.map(cat => (
                  <div key={cat.label}>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1">
                      <Scale size={11} /> {cat.label}
                    </h4>
                    <div className="space-y-1">
                      {cat.items.map(item => (
                        <div key={item} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-slate-100 dark:border-gray-700">
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
