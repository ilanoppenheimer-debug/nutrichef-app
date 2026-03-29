// Base de datos local de marcas verificadas por categoría.
// Sirve como contexto para la IA y para la UI de "Guía de Compra".

export const SAFE_BRANDS = {
  kosher: [
    { name: 'Kirkland Signature', note: 'Certificación OU Kosher en la mayoría de productos' },
    { name: 'Philadelphia', note: 'Queso crema certificado Kosher' },
    { name: 'Nature Valley', note: 'Barras de granola con certificación Kosher' },
    { name: 'Isopure Low Carb', note: 'Proteína whey certificada Kosher' },
    { name: 'Empire Kosher', note: 'Pollo y pavo certificado Kosher' },
  ],
  halal: [
    { name: 'Saffron Road', note: 'Línea completa certificada Halal' },
    { name: 'American Halal', note: 'Carnes certificadas Halal' },
    { name: 'Crescent Foods', note: 'Pollo y carnes Halal' },
    { name: 'Ziyad', note: 'Productos mediterráneos Halal' },
  ],
  vegan: [
    { name: 'NotCo (NotMeat, NotMilk)', note: 'IA de origen vegetal — disponible en Chile y Latinoamérica' },
    { name: 'Silk', note: 'Bebidas vegetales (soja, avena, almendra)' },
    { name: 'Beyond Meat', note: 'Hamburguesas y carne vegetal' },
    { name: 'Violife', note: 'Quesos veganos certificados' },
    { name: 'Oatly', note: 'Leche y crema de avena' },
  ],
  powerlifting: [
    { name: 'Optimum Nutrition Gold Standard', note: 'Whey con 24g proteína/servicio — referente mundial' },
    { name: 'MyProtein Impact Whey', note: 'Buena relación precio/calidad, amplia disponibilidad' },
    { name: 'Dymatize ISO100', note: 'Hidrolizado de alta absorción, ideal post-entreno' },
    { name: 'Ghost Whey', note: 'Alta palatabilidad, sabores variados' },
    { name: 'Isopure Zero Carb', note: 'Sin carbohidratos, ideal para déficit' },
  ],
  vegetariana: [
    { name: 'Quorn', note: 'Proteína de micoproteína, textura de carne' },
    { name: 'Garden Gourmet', note: 'Alternativas vegetales de Nestlé' },
    { name: 'Fieldroast', note: 'Embutidos y salchichas vegetarianas' },
  ],
  chile: {
    supermercados: ['Líder (Walmart)', 'Jumbo', 'Santa Isabel', 'Unimarc', 'Tottus'],
    tiendas_especializadas: ['GNC Chile', 'Nutri Express', 'Bodytech', 'Sport Life'],
    vegan_local: ['NotCo', 'Love Corn', 'El Granero'],
    proteinas_local: ['Optimum Nutrition (GNC)', 'MyProtein (envío directo)', 'Dymatize (Jumbo)'],
  },
};

// Determina qué categorías de marcas son relevantes para un perfil dado
export function getRelevantBrandCategories(profile) {
  const cats = [];
  if (profile.religiousDiet === 'Kosher') cats.push('kosher');
  if (profile.religiousDiet === 'Halal') cats.push('halal');
  if (profile.dietaryStyle === 'Vegana') cats.push('vegan');
  if (profile.dietaryStyle === 'Vegetariana') cats.push('vegetariana');
  if (profile.sportType === 'Fuerza/Powerlifting' || profile.useProteinPowder) cats.push('powerlifting');
  return cats;
}

// Texto de contexto para incluir en el prompt de Gemini
export function buildBrandContext(profile) {
  const cats = getRelevantBrandCategories(profile);
  if (!cats.length) return '';

  const lines = cats.flatMap(cat => {
    const brands = SAFE_BRANDS[cat];
    if (!Array.isArray(brands)) return [];
    return [`${cat.toUpperCase()}: ${brands.map(b => b.name).join(', ')}`];
  });

  if (!lines.length) return '';

  return `\nMARCAS DE REFERENCIA VERIFICADAS (incluye algunas en "marcas_sugeridas" si aplica):\n${lines.join('\n')}`;
}

// Etiqueta y color para cada categoría en la UI
export const BRAND_LABELS = {
  kosher: {
    label: 'Kosher',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  halal: {
    label: 'Halal',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  vegan: {
    label: 'Vegano',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  },
  vegetariana: {
    label: 'Vegetariano',
    color: 'bg-lime-100 dark:bg-lime-900/30 text-lime-700 dark:text-lime-300 border-lime-200 dark:border-lime-800',
  },
  powerlifting: {
    label: 'Rendimiento',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  },
};
