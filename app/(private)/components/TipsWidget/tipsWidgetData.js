/** Datos estáticos del widget de tips (sin JSX). */

export const DAILY_TIPS = [
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

export const TECHNIQUES = [
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

export const SUBSTITUTIONS = [
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

export const MEASURES = [
  {
    label: 'Volumen',
    items: [
      '1 taza = 240 ml',
      '½ taza = 120 ml',
      '¼ taza = 60 ml',
      '1 cda (cucharada) = 15 ml',
      '1 cdta (cucharadita) = 5 ml',
      '1 fl oz = 30 ml',
    ],
  },
  {
    label: 'Peso',
    items: ['1 oz = 28 g', '1 lb = 453 g', '1 stick mantequilla = 113 g'],
  },
  {
    label: 'Temperatura horno',
    items: [
      '150°C = 300°F (suave)',
      '175°C = 350°F (moderado)',
      '200°C = 400°F (fuerte)',
      '220°C = 425°F (muy fuerte)',
      '230°C = 450°F (muy alto)',
    ],
  },
  {
    label: 'Aproximados útiles',
    items: [
      '1 taza de arroz crudo ≈ 185 g',
      '1 taza de harina ≈ 120 g',
      '1 taza de azúcar ≈ 200 g',
      '1 cda de aceite ≈ 14 g',
      '1 huevo grande ≈ 50 g sin cáscara',
    ],
  },
];
