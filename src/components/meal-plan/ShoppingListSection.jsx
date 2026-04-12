import { PiggyBank, RefreshCw, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { formatCurrencyByCountry } from '@/services/gemini.js';
import { applyShoppingListSafetySwaps } from '@/utils/ingredientIntelligence.js';

const AISLE_ORDER = [
  'Frutas y Verduras',
  'Proteínas',
  'Lácteos y Refrigerados',
  'Almacén',
  'Otros',
];

function normalizeText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

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

function getItemName(item) {
  return typeof item === 'string' ? item : (item.name || item.producto || item.item || 'Ingrediente');
}

function getItemAmount(item) {
  return typeof item === 'string' ? '' : (item.amount || item.cantidad || '');
}

function getItemSourceCategory(category = '') {
  return normalizeText(category);
}

function getAisleName(item, sourceCategory = '') {
  const haystack = `${getItemSourceCategory(sourceCategory)} ${normalizeText(getItemName(item))}`;

  if (/(fruta|verdura|vegetal|produce|ensalada|hierba|hortaliza|tomate|cebolla|lechuga|palta|aguacate|manzana|platano|banana|papa|zanahoria|pepino|espinaca)/.test(haystack)) {
    return 'Frutas y Verduras';
  }

  if (/(proteina|protein|carne|pollo|pavo|res|vacuno|cerdo|huevo|pescado|salmon|salmon|atun|atun|jurel|tofu|legumbre|lenteja|garbanzo|poroto|frijol)/.test(haystack)) {
    return 'Proteínas';
  }

  if (/(lacteo|refrigerad|frio|frío|queso|leche|mantequilla|crema|yogur|yogurt|kefir|hummus)/.test(haystack)) {
    return 'Lácteos y Refrigerados';
  }

  if (/(almacen|almac[eé]n|despensa|basico|b[aá]sico|grano|cereal|arroz|pasta|avena|quinoa|harina|pan|aceite|condimento|salsa|lata|conserva|snack|frutos secos)/.test(haystack)) {
    return 'Almacén';
  }

  return 'Otros';
}

function regroupShoppingList(shoppingList) {
  if (!shoppingList?.categories) return shoppingList;

  const grouped = new Map(AISLE_ORDER.map(name => [name, []]));

  shoppingList.categories.forEach(category => {
    (category.items || []).forEach(item => {
      const aisle = getAisleName(item, category.name);
      grouped.get(aisle)?.push(item);
    });
  });

  return {
    ...shoppingList,
    categories: AISLE_ORDER
      .map(name => ({ name, items: grouped.get(name) || [] }))
      .filter(category => category.items.length > 0),
  };
}

function getItemKey(item, categoryName, index) {
  return `${categoryName}-${getItemName(item)}-${getItemAmount(item)}-${item?.substituteFor || ''}-${index}`;
}

function ShoppingItem({ item, country, checked, onToggle, itemKey }) {
  const name = getItemName(item);
  const amount = getItemAmount(item);
  const priceLabel = typeof item === 'string' ? null : buildPriceRange(item, country);
  const substituteFor = typeof item !== 'string' ? item.substituteFor : null;

  return (
    <li>
      <label
        htmlFor={itemKey}
        className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3 py-3 transition-all ${
          checked
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-200 bg-white hover:border-[--c-primary-border] hover:bg-slate-50'
        }`}
      >
        <input
          id={itemKey}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(itemKey)}
          className="mt-1 h-5 w-5 rounded border-slate-300 text-[--c-primary] focus:ring-2 focus:ring-[--c-primary]"
        />

        <div className="min-w-0 flex-1">
          <span className={`block text-sm leading-snug ${checked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {name}
          </span>
          {substituteFor && (
            <span className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
              Sustituye a {substituteFor}
            </span>
          )}
        </div>

        <div className="min-w-[96px] shrink-0 text-right">
          {amount && (
            <span className={`inline-flex rounded-xl border px-2.5 py-1 text-xs font-bold ${
              checked
                ? 'border-slate-200 bg-slate-100 text-slate-400'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}>
              {amount}
            </span>
          )}
          {priceLabel && (
            <p className="mt-1 text-[11px] font-medium text-slate-400">
              {priceLabel}
            </p>
          )}
        </div>
      </label>
    </li>
  );
}

export default function ShoppingListSection({
  shoppingList,
  loadingList,
  onGenerateShoppingList,
  country = 'Chile',
  optimizeBudget = false,
  profile = {},
}) {
  const [checkedItems, setCheckedItems] = useState({});
  const safeShoppingList = useMemo(
    () => applyShoppingListSafetySwaps(shoppingList, profile),
    [shoppingList, profile]
  );
  const groupedShoppingList = useMemo(
    () => regroupShoppingList(safeShoppingList),
    [safeShoppingList]
  );

  useEffect(() => {
    setCheckedItems({});
  }, [groupedShoppingList]);

  const toggleCheckedItem = (itemKey) => {
    setCheckedItems(current => ({ ...current, [itemKey]: !current[itemKey] }));
  };

  const totalItems = groupedShoppingList?.categories?.reduce((acc, cat) => acc + (cat.items?.length || 0), 0) || 0;
  const checkedCount = groupedShoppingList?.categories?.reduce((acc, category) => (
    acc + (category.items?.reduce((sum, item, index) => {
      const itemKey = getItemKey(item, category.name, index);
      return sum + (checkedItems[itemKey] ? 1 : 0);
    }, 0) || 0)
  ), 0) || 0;
  const fallbackApproxTotal = groupedShoppingList?.categories?.reduce((acc, cat) => (
    acc + (cat.items?.reduce((sum, item) => sum + getAveragePrice(item), 0) || 0)
  ), 0) || 0;
  const totalMin = Number(groupedShoppingList?.estimatedTotalMin || 0);
  const totalMax = Number(groupedShoppingList?.estimatedTotalMax || 0);
  const totalApprox = totalMin || totalMax
    ? Math.round(((totalMin || totalMax) + (totalMax || totalMin)) / 2)
    : Math.round(fallbackApproxTotal);
  const savingsMin = Number(groupedShoppingList?.estimatedSavingsMin || 0);
  const savingsMax = Number(groupedShoppingList?.estimatedSavingsMax || 0);
  const savingsApprox = savingsMin || savingsMax
    ? Math.round(((savingsMin || savingsMax) + (savingsMax || savingsMin)) / 2)
    : 0;
  const totalRangeLabel = totalMin && totalMax
    ? `${formatCurrencyByCountry(totalMin, country)} - ${formatCurrencyByCountry(totalMax, country)}`
    : totalApprox > 0 ? formatCurrencyByCountry(totalApprox, country) : null;

  return (
    <div className="space-y-4">
      {!shoppingList && (
        <button
          onClick={() => onGenerateShoppingList()}
          disabled={loadingList}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 bg-white py-4 font-bold text-slate-500 transition-all hover:border-[--c-primary-border] hover:bg-[--c-primary-light] hover:text-[--c-primary] disabled:opacity-70"
        >
          {loadingList
            ? <><RefreshCw className="animate-spin" size={20} /> Calculando cantidades...</>
            : <><ShoppingCart size={20} /> Generar Lista de Compras</>
          }
        </button>
      )}

      {groupedShoppingList?.categories?.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-800">
                  <ShoppingCart size={18} style={{ color: 'var(--c-primary)' }} />
                  Lista del Súper
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Checklist real por pasillo para que compres con menos ruido visual.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {checkedCount}/{totalItems} listos
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                  {groupedShoppingList.categories.length} pasillos
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:items-center">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">Costo semanal</p>
                <p className="text-lg font-black text-emerald-900">
                  Costo aprox. para esta semana: {totalApprox > 0 ? formatCurrencyByCountry(totalApprox, country) : '—'}
                </p>
                {totalRangeLabel && (
                  <p className="mt-1 text-xs text-emerald-700/80">Rango estimado: {totalRangeLabel}</p>
                )}
              </div>

              {optimizeBudget && savingsApprox > 0 && (
                <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 xl:block">
                  <p className="text-[11px] font-black uppercase tracking-wider text-amber-700">Ahorro Estimado</p>
                  <p className="flex items-center gap-2 text-lg font-black text-amber-900">
                    <PiggyBank size={18} /> {formatCurrencyByCountry(savingsApprox, country)}
                  </p>
                  <p className="mt-1 text-xs text-amber-700/80">frente a una compra estándar</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {groupedShoppingList.categories.map((category, categoryIndex) => (
              <div key={`cat-${categoryIndex}`} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                    {category.name}
                  </h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                    {category.items?.length || 0}
                  </span>
                </div>

                <ul className="space-y-2.5">
                  {category.items?.map((item, itemIndex) => {
                    const itemKey = getItemKey(item, category.name, itemIndex);

                    return (
                      <ShoppingItem
                        key={itemKey}
                        item={item}
                        country={country}
                        checked={Boolean(checkedItems[itemKey])}
                        onToggle={toggleCheckedItem}
                        itemKey={itemKey}
                      />
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
