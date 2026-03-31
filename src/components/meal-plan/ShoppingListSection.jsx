import { Check, PiggyBank, RefreshCw, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { formatCurrencyByCountry } from '../../lib/gemini.js';

function buildPriceRange(item, country) {
  const min = Number(item?.estimatedPriceMin || 0);
  const max = Number(item?.estimatedPriceMax || 0);

  if (!min && !max) return null;
  if (!max || min === max) return formatCurrencyByCountry(min || max, country);
  return `${formatCurrencyByCountry(min, country)} - ${formatCurrencyByCountry(max, country)}`;
}

function getAveragePrice(item) {
  const min = Number(item?.estimatedPriceMin || 0);
  const max = Number(item?.estimatedPriceMax || 0);
  if (!min && !max) return 0;
  if (!max) return min;
  if (!min) return max;
  return (min + max) / 2;
}

function ShoppingItem({ item, country }) {
  const [checked, setChecked] = useState(false);
  const name = typeof item === 'string' ? item : (item.name || item.producto || item.item || 'Ingrediente');
  const amount = typeof item !== 'string' ? (item.amount || item.cantidad || '') : '';
  const priceLabel = typeof item === 'string' ? null : buildPriceRange(item, country);

  return (
    <li
      onClick={() => setChecked(c => !c)}
      className={`rounded-xl cursor-pointer transition-all select-none ${
        checked
          ? 'bg-green-50 dark:bg-green-900/20 opacity-60'
          : 'hover:bg-slate-100 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-start gap-3 py-2.5 px-3">
        <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          checked ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-gray-500'
        }`}>
          {checked && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>

        <span className={`flex-1 text-sm leading-snug ${
          checked
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-700 dark:text-slate-200'
        }`}>
          {name}
        </span>

        <div className="shrink-0 min-w-[88px] flex flex-col items-end gap-1 text-right">
          {amount && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border whitespace-nowrap ${
              checked
                ? 'bg-slate-100 dark:bg-gray-700 text-slate-400 border-slate-200 dark:border-gray-600'
                : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-gray-600 shadow-sm'
            }`}>
              {amount}
            </span>
          )}
          {priceLabel && (
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
              {priceLabel}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export default function ShoppingListSection({
  shoppingList,
  loadingList,
  onGenerateShoppingList,
  country = 'Chile',
  optimizeBudget = false,
}) {
  const totalItems = shoppingList?.categories?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0;
  const fallbackApproxTotal = shoppingList?.categories?.reduce((acc, cat) => (
    acc + (cat.items?.reduce((sum, item) => sum + getAveragePrice(item), 0) || 0)
  ), 0) || 0;
  const totalMin = Number(shoppingList?.estimatedTotalMin || 0);
  const totalMax = Number(shoppingList?.estimatedTotalMax || 0);
  const totalApprox = totalMin || totalMax
    ? Math.round(((totalMin || totalMax) + (totalMax || totalMin)) / 2)
    : Math.round(fallbackApproxTotal);
  const savingsMin = Number(shoppingList?.estimatedSavingsMin || 0);
  const savingsMax = Number(shoppingList?.estimatedSavingsMax || 0);
  const savingsApprox = savingsMin || savingsMax
    ? Math.round(((savingsMin || savingsMax) + (savingsMax || savingsMin)) / 2)
    : 0;
  const totalRangeLabel = totalMin && totalMax
    ? `${formatCurrencyByCountry(totalMin, country)} - ${formatCurrencyByCountry(totalMax, country)}`
    : totalApprox > 0 ? formatCurrencyByCountry(totalApprox, country) : null;

  return (
    <div className="mt-8 pt-8 border-t border-slate-200 dark:border-gray-700">
      {!shoppingList && (
        <button
          onClick={() => onGenerateShoppingList()}
          disabled={loadingList}
          className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-[--c-primary] hover:border-[--c-primary-border] hover:bg-[--c-primary-light] font-bold transition-all flex justify-center items-center gap-2"
        >
          {loadingList
            ? <><RefreshCw className="animate-spin" size={20} /> Calculando cantidades...</>
            : <><ShoppingCart size={20} /> Generar Lista de Compras</>
          }
        </button>
      )}

      {shoppingList?.categories && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-800 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <ShoppingCart size={18} style={{ color: 'var(--c-primary)' }} />
                  Lista del Súper
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1">
                    ({totalItems} productos)
                  </span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Toca para marcar y compara precios por ingrediente.</p>
              </div>
              <p className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 text-right">Precios estimados por ingrediente</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider font-black text-emerald-700 dark:text-emerald-300">Costo semanal</p>
                <p className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                  Costo aprox. para esta semana: {totalApprox > 0 ? formatCurrencyByCountry(totalApprox, country) : '—'}
                </p>
                {totalRangeLabel && (
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">Rango estimado: {totalRangeLabel}</p>
                )}
              </div>

              {optimizeBudget && savingsApprox > 0 && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 hidden lg:block">
                  <p className="text-[11px] uppercase tracking-wider font-black text-amber-700 dark:text-amber-300">Ahorro Estimado</p>
                  <p className="text-lg font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <PiggyBank size={18} /> {formatCurrencyByCountry(savingsApprox, country)}
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mt-1">frente a una compra estándar</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-gray-800">
            {shoppingList.categories.map((cat, i) => (
              <div key={`cat-${i}`} className="p-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2 px-3">
                  {cat.name}
                </h4>

                <ul className="space-y-0.5">
                  {cat.items?.map((item, j) => (
                    <ShoppingItem key={`item-${i}-${j}`} item={item} country={country} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
