// Banco de recetas locales — cero tokens de Gemini
// Organizadas por categoría con soporte para filtros de dieta y deporte

// ─────────────────────────────────────────────────────────────────────────────
// DESAYUNOS DE FUERZA (Powerlifting / Alta proteína)
// ─────────────────────────────────────────────────────────────────────────────
import { isDietSelected, matchesRestriction, withFoodPreferences } from './foodPreferences.js';

const DESAYUNOS_FUERZA = [
  {
    title: 'Omelette de claras con avena',
    description: 'El desayuno clásico de atletas de fuerza. Alta proteína, carbos de liberación lenta.',
    prepTime: '5 min', cookTime: '8 min', cuisine: 'Fitness',
    tags: ['omelette', 'claras', 'avena', 'powerlifting', 'fuerza', 'proteína', 'desayuno', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Claras de huevo', amount: '6 unidades (200ml)', substitute: '3 huevos enteros' },
      { name: 'Avena en copos', amount: '40g', substitute: 'Copos de centeno' },
      { name: 'Espinacas baby', amount: 'Un puñado', substitute: 'Rúcula' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
      { name: 'Aceite de oliva', amount: '1 cdta', substitute: 'Aceite de coco' },
    ],
    steps: [
      'Bate las claras con sal y pimienta.',
      'En sartén con aceite a fuego medio, vierte las claras. Cocina 2 min hasta que los bordes estén firmes.',
      'Añade la avena cruda y las espinacas sobre la mitad de la tortilla.',
      'Dobla por la mitad, cocina 1 min más y sirve.',
    ],
    macros: { calories: '280 kcal', protein: '34g', carbs: '22g', fat: '4g', fiber: '3g' },
    tips: 'La avena cruda dentro del omelette da una textura interesante y hace el desayuno mucho más saciante.',
  },
  {
    title: 'Pancakes de banana y proteína',
    description: 'Solo 3 ingredientes. Alta proteína, sin harina refinada.',
    prepTime: '3 min', cookTime: '8 min', cuisine: 'Fitness',
    tags: ['pancakes', 'banana', 'proteína', 'fuerza', 'powerlifting', 'desayuno', 'sin harina'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Banana madura', amount: '1 grande (120g)', substitute: 'Puré de manzana (100g)' },
      { name: 'Huevos', amount: '2 unidades', substitute: 'Claras (4 unidades)' },
      { name: 'Proteína en polvo (vainilla)', amount: '1 medida (30g)', substitute: 'Avena molida (30g)' },
      { name: 'Aceite de coco', amount: '1 cdta', substitute: 'Mantequilla' },
    ],
    steps: [
      'Tritura la banana con un tenedor hasta obtener puré.',
      'Mezcla con los huevos batidos y la proteína hasta obtener una masa homogénea.',
      'Calienta la sartén con aceite a fuego medio-bajo.',
      'Vierte porciones pequeñas (3-4 cdas). Cocina 2 min por lado hasta que estén dorados.',
    ],
    macros: { calories: '340 kcal', protein: '38g', carbs: '30g', fat: '8g', fiber: '2g' },
    tips: 'Cuanto más madura la banana, más dulce y fácil de triturar. Sirve con miel o frutos rojos.',
  },
  {
    title: 'Shakshuka de huevos',
    description: 'Plato mediterráneo-israelí. Huevos pochados en salsa de tomate especiada. Clásico Kosher.',
    prepTime: '5 min', cookTime: '20 min', cuisine: 'Mediterránea',
    tags: ['shakshuka', 'huevos', 'tomate', 'kosher', 'mediterráneo', 'desayuno', 'almuerzo', 'halal'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Tomates en lata (triturados)', amount: '400g', substitute: '4 tomates frescos triturados' },
      { name: 'Huevos', amount: '4 unidades', substitute: '' },
      { name: 'Pimiento rojo', amount: '1 unidad', substitute: 'Pimiento verde' },
      { name: 'Cebolla', amount: '1 mediana', substitute: '' },
      { name: 'Ajo', amount: '3 dientes', substitute: '1 cdta ajo en polvo' },
      { name: 'Comino', amount: '1 cdta', substitute: '' },
      { name: 'Pimentón dulce', amount: '1 cdta', substitute: 'Paprika ahumada' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Sofríe la cebolla y el pimiento en aceite a fuego medio, 5 min.',
      'Añade el ajo y las especias, sofríe 1 min más.',
      'Vierte los tomates, ajusta sal y cocina 10 min a fuego medio hasta reducir.',
      'Haz 4 huecos en la salsa y rompe un huevo en cada uno.',
      'Tapa y cocina 5-7 min hasta que las claras estén cuajadas pero las yemas líquidas.',
    ],
    macros: { calories: '310 kcal', protein: '20g', carbs: '22g', fat: '16g', fiber: '6g' },
    tips: 'Sirve directamente de la sartén con pan de pita o challah para mojar. Añade feta encima si no es Kosher estricto.',
  },
  {
    title: 'Bowl de avena nocturna con whey',
    description: 'Overnight oats potenciado. Listo al despertar, sin cocción.',
    prepTime: '5 min', cookTime: '0 min', cuisine: 'Fitness',
    tags: ['avena', 'overnight', 'whey', 'proteína', 'desayuno', 'meal prep', 'fuerza', 'sin cocción'],
    isKosher: true, isDairy: true, sportType: 'fuerza',
    ingredients: [
      { name: 'Avena en copos gruesos', amount: '80g', substitute: 'Avena fina' },
      { name: 'Proteína en polvo (chocolate/vainilla)', amount: '1 medida (30g)', substitute: '' },
      { name: 'Leche descremada o vegetal', amount: '250ml', substitute: 'Agua' },
      { name: 'Yogur griego 0%', amount: '100g', substitute: 'Yogur natural' },
      { name: 'Chía', amount: '1 cda', substitute: '' },
      { name: 'Frutos rojos', amount: '100g', substitute: 'Banana en rodajas' },
    ],
    steps: [
      'Mezcla la avena, proteína en polvo, leche, yogur y chía en un frasco o bowl.',
      'Revuelve bien, tapa y refrigera mínimo 8 horas (toda la noche).',
      'Al servir, añade los frutos rojos encima.',
    ],
    macros: { calories: '480 kcal', protein: '42g', carbs: '55g', fat: '6g', fiber: '8g' },
    tips: 'Puedes preparar 3-4 frascos el domingo para toda la semana. Dura 4 días en nevera.',
  },
  {
    title: 'Tostadas de pavo y aguacate',
    description: 'Proteína + grasas buenas. Desayuno completo en 5 minutos.',
    prepTime: '5 min', cookTime: '2 min', cuisine: 'Básico',
    tags: ['tostada', 'pavo', 'aguacate', 'palta', 'desayuno', 'proteína', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Pan integral o de centeno', amount: '2 rebanadas', substitute: 'Pan de masa madre' },
      { name: 'Pechuga de pavo laminada', amount: '80g', substitute: 'Pollo cocido' },
      { name: 'Aguacate maduro', amount: '½ unidad', substitute: '' },
      { name: 'Tomate cherry', amount: '6 unidades', substitute: '½ tomate' },
      { name: 'Limón', amount: 'Unas gotas', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Tuesta el pan.',
      'Aplasta el aguacate con limón, sal y pimienta.',
      'Extiende el aguacate sobre las tostadas.',
      'Coloca el pavo y los tomates cherry cortados por la mitad encima.',
    ],
    macros: { calories: '320 kcal', protein: '24g', carbs: '30g', fat: '12g', fiber: '7g' },
    tips: 'El pavo certificado Kosher es fácil de encontrar. Verifica el sello en el envase.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ALMUERZOS MEAL PREP
// ─────────────────────────────────────────────────────────────────────────────
const ALMUERZOS_MEAL_PREP = [
  {
    title: 'Pollo al curry con arroz integral',
    description: 'Meal prep clásico. Se prepara en cantidad y aguanta 4 días en nevera.',
    prepTime: '10 min', cookTime: '30 min', cuisine: 'Asiática',
    tags: ['pollo', 'curry', 'arroz integral', 'meal prep', 'almuerzo', 'kosher', 'halal'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '600g (para 4 porciones)', substitute: 'Muslos sin piel' },
      { name: 'Arroz integral', amount: '2 tazas (370g)', substitute: 'Quinoa' },
      { name: 'Leche de coco', amount: '200ml', substitute: 'Caldo de pollo' },
      { name: 'Curry en polvo', amount: '2 cdas', substitute: 'Garam masala' },
      { name: 'Cebolla', amount: '1 grande', substitute: '' },
      { name: 'Ajo', amount: '4 dientes', substitute: '' },
      { name: 'Jengibre fresco', amount: '1 trozo (2cm)', substitute: '½ cdta jengibre en polvo' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Sal', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Cuece el arroz integral según el paquete (aprox. 35 min).',
      'Sofríe cebolla, ajo y jengibre en aceite 5 min.',
      'Añade el pollo en trozos y el curry. Sella 3 min por cada lado.',
      'Vierte la leche de coco, ajusta sal y cocina 15 min a fuego medio.',
      'Divide en 4 contenedores con arroz. Guarda en nevera.',
    ],
    macros: { calories: '520 kcal', protein: '48g', carbs: '52g', fat: '12g', fiber: '4g' },
    tips: 'Prepara el doble el domingo. Congela 2 porciones para la segunda semana.',
  },
  {
    title: 'Lentejas con vegetales al horno',
    description: 'Alto en proteína vegetal y fibra. Económico y fácil de escalar.',
    prepTime: '10 min', cookTime: '35 min', cuisine: 'Mediterránea',
    tags: ['lentejas', 'vegetales', 'vegano', 'vegetariano', 'kosher', 'halal', 'meal prep', 'almuerzo', 'fibra'],
    isKosher: true, isDairy: false, isVegan: true, sportType: 'general',
    ingredients: [
      { name: 'Lentejas verdes o pardinas', amount: '300g (secas)', substitute: 'Lentejas rojas' },
      { name: 'Zanahoria', amount: '2 medianas', substitute: '' },
      { name: 'Pimiento rojo', amount: '1 unidad', substitute: '' },
      { name: 'Calabacín', amount: '1 mediano', substitute: 'Berenjena' },
      { name: 'Tomates cherry', amount: '200g', substitute: '2 tomates medianos' },
      { name: 'Ajo', amount: '4 dientes', substitute: '' },
      { name: 'Aceite de oliva', amount: '3 cdas', substitute: '' },
      { name: 'Comino y pimentón', amount: '1 cdta de cada uno', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Enjuaga las lentejas y cuécelas en agua con sal 25-30 min. Escurre.',
      'Corta todos los vegetales en trozos medianos.',
      'En bandeja de horno, mezcla los vegetales con aceite y especias. Asa a 200°C, 25 min.',
      'Mezcla las lentejas con los vegetales asados y sirve.',
    ],
    macros: { calories: '420 kcal', protein: '22g', carbs: '60g', fat: '10g', fiber: '18g' },
    tips: 'Las lentejas no necesitan remojar. El truco para que no queden pastosas es no tapar la olla.',
  },
  {
    title: 'Salmón al horno con papas rústicas',
    description: 'Omega-3 + carbohidratos de calidad. El almuerzo de recuperación ideal.',
    prepTime: '10 min', cookTime: '25 min', cuisine: 'Mediterránea',
    tags: ['salmón', 'pescado', 'papas', 'horno', 'omega3', 'kosher', 'meal prep', 'almuerzo', 'recuperación'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Filete de salmón', amount: '180g por porción', substitute: 'Trucha o merluza' },
      { name: 'Papas medianas', amount: '2 unidades (300g)', substitute: 'Batata dulce' },
      { name: 'Limón', amount: '1 unidad', substitute: '' },
      { name: 'Ajo en polvo', amount: '1 cdta', substitute: '2 dientes de ajo laminados' },
      { name: 'Eneldo seco', amount: '1 cdta', substitute: 'Orégano o tomillo' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Precalienta el horno a 200°C.',
      'Corta las papas en gajos. Mezcla con 1 cda de aceite, sal y ajo en polvo.',
      'Asa las papas 15 min en bandeja.',
      'Coloca el salmón junto a las papas. Aliña con aceite, limón, eneldo, sal y pimienta.',
      'Hornea 12-15 min más hasta que el salmón esté opaco en el centro.',
    ],
    macros: { calories: '550 kcal', protein: '42g', carbs: '45g', fat: '20g', fiber: '4g' },
    tips: 'El salmón está listo cuando se desmiga fácilmente con un tenedor. No lo sobre-cocines.',
  },
  {
    title: 'Bowl de quinoa, garbanzos y vegetales',
    description: 'Proteína completa vegetal. Frío o caliente, perfecto para llevar.',
    prepTime: '10 min', cookTime: '20 min', cuisine: 'Mediterránea',
    tags: ['quinoa', 'garbanzos', 'bowl', 'vegano', 'vegetariano', 'kosher', 'meal prep', 'proteína vegetal'],
    isKosher: true, isDairy: false, isVegan: true, sportType: 'general',
    ingredients: [
      { name: 'Quinoa', amount: '1 taza (185g cruda)', substitute: 'Arroz integral' },
      { name: 'Garbanzos cocidos', amount: '240g (1 lata)', substitute: 'Lentejas cocidas' },
      { name: 'Pepino', amount: '1 mediano', substitute: '' },
      { name: 'Tomate cherry', amount: '150g', substitute: '' },
      { name: 'Perejil fresco', amount: 'Un manojo', substitute: 'Cilantro' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Limón', amount: '1 unidad (jugo)', substitute: 'Vinagre de manzana' },
      { name: 'Sal y comino', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Cuece la quinoa en 2 tazas de agua con sal. 15 min a fuego bajo. Deja reposar 5 min.',
      'Escurre y enjuaga los garbanzos.',
      'Corta el pepino y los tomates en trozos pequeños.',
      'Mezcla todo con aceite de oliva, limón, comino y perejil picado.',
    ],
    macros: { calories: '480 kcal', protein: '20g', carbs: '72g', fat: '12g', fiber: '12g' },
    tips: 'La quinoa es una proteína completa — contiene los 9 aminoácidos esenciales, ideal para dietas sin carne.',
  },
  {
    title: 'Pollo a la plancha con batata y brócoli',
    description: 'El trío de oro del meal prep. Simple, completo y escalable.',
    prepTime: '10 min', cookTime: '25 min', cuisine: 'Fitness',
    tags: ['pollo', 'batata', 'boniato', 'brócoli', 'meal prep', 'fuerza', 'kosher', 'almuerzo', 'fitness'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '150g por porción', substitute: 'Pavo en filetes' },
      { name: 'Batata (boniato)', amount: '200g por porción', substitute: 'Papas' },
      { name: 'Brócoli', amount: '200g por porción', substitute: 'Coliflor' },
      { name: 'Aceite de oliva', amount: '1 cda', substitute: '' },
      { name: 'Ajo en polvo, orégano, sal', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Corta la batata en cubos de 2cm. Asa en horno a 200°C con un hilo de aceite y sal, 20 min.',
      'Blanquea el brócoli en agua hirviendo 3 min. Escurre y salte en sartén con ajo en polvo.',
      'Sazona el pollo y cocina a la plancha 5 min por lado.',
      'Divide en contenedores y guarda hasta 4 días.',
    ],
    macros: { calories: '490 kcal', protein: '44g', carbs: '52g', fat: '8g', fiber: '8g' },
    tips: 'Para 5 días de meal prep: multiplica todos los ingredientes por 5 y cocina todo de una vez.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CENAS LIGERAS / RECUPERACIÓN
// ─────────────────────────────────────────────────────────────────────────────
const CENAS_RECUPERACION = [
  {
    title: 'Sopa de verduras con tofu',
    description: 'Digestiva, caliente y antiinflamatoria. Perfecta para la noche.',
    prepTime: '10 min', cookTime: '20 min', cuisine: 'Asiática',
    tags: ['sopa', 'verduras', 'tofu', 'vegano', 'vegetariano', 'cena', 'recuperación', 'ligero', 'kosher'],
    isKosher: true, isDairy: false, isVegan: true, sportType: 'general',
    ingredients: [
      { name: 'Tofu firme', amount: '200g', substitute: 'Huevo duro en cubos' },
      { name: 'Caldo de vegetales', amount: '1 litro', substitute: 'Agua con sal' },
      { name: 'Zanahoria', amount: '2 medianas', substitute: '' },
      { name: 'Apio', amount: '2 ramas', substitute: '' },
      { name: 'Puerro', amount: '1 unidad', substitute: 'Cebolla' },
      { name: 'Espinacas', amount: '100g', substitute: 'Acelga' },
      { name: 'Jengibre fresco', amount: '1 trozo (1cm)', substitute: '¼ cdta jengibre en polvo' },
      { name: 'Salsa de soja (Kosher)', amount: '1 cda', substitute: '' },
    ],
    steps: [
      'Escurre y corta el tofu en cubos. Dóralo en sartén con una gota de aceite.',
      'En olla grande, calienta el caldo con jengibre.',
      'Añade la zanahoria, apio y puerro cortados. Cocina 15 min.',
      'Añade las espinacas y el tofu. Cocina 2 min más.',
      'Sazona con salsa de soja y sirve.',
    ],
    macros: { calories: '220 kcal', protein: '18g', carbs: '18g', fat: '8g', fiber: '5g' },
    tips: 'Para una sopa más proteica, añade 1 huevo batido vertiéndolo en hilo fino mientras remueves.',
  },
  {
    title: 'Merluza al vapor con quinoa',
    description: 'Cena de recuperación. Fácil de digerir, rico en proteína magra.',
    prepTime: '5 min', cookTime: '15 min', cuisine: 'Básico',
    tags: ['merluza', 'pescado', 'vapor', 'quinoa', 'cena', 'kosher', 'ligero', 'recuperación'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Filete de merluza', amount: '180g', substitute: 'Bacalao o tilapia' },
      { name: 'Quinoa', amount: '80g (cruda)', substitute: 'Arroz blanco' },
      { name: 'Limón', amount: '½ unidad', substitute: '' },
      { name: 'Ajo', amount: '1 diente', substitute: '' },
      { name: 'Perejil', amount: 'Al gusto', substitute: 'Eneldo' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Cuece la quinoa en agua con sal (2:1). 15 min a fuego bajo.',
      'Sazona el filete con limón, ajo rallado, sal y pimienta.',
      'Cocina al vapor 8-10 min o en sartén antiadherente sin aceite, 3-4 min por lado.',
      'Sirve con quinoa y espolvorea perejil.',
    ],
    macros: { calories: '380 kcal', protein: '38g', carbs: '42g', fat: '5g', fiber: '3g' },
    tips: 'Al vapor es el método que más preserva los ácidos grasos omega-3 del pescado.',
  },
  {
    title: 'Ensalada de garbanzos y atún',
    description: 'Sin cocción, alta en proteína y fibra. Lista en 5 minutos.',
    prepTime: '5 min', cookTime: '0 min', cuisine: 'Mediterránea',
    tags: ['garbanzos', 'atún', 'ensalada', 'kosher', 'cena', 'sin cocción', 'proteína', 'fibra'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Garbanzos cocidos', amount: '200g (1 lata)', substitute: 'Alubias blancas' },
      { name: 'Atún al natural', amount: '1 lata (120g)', substitute: 'Caballa o sardinas' },
      { name: 'Pepino', amount: '½ unidad', substitute: '' },
      { name: 'Tomate', amount: '1 mediano', substitute: '' },
      { name: 'Aceitunas negras', amount: '10 unidades', substitute: '' },
      { name: 'Perejil fresco', amount: 'Un puñado', substitute: '' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Limón', amount: '½ unidad (jugo)', substitute: 'Vinagre' },
    ],
    steps: [
      'Escurre y enjuaga los garbanzos.',
      'Escurre el atún.',
      'Corta el pepino y el tomate en cubos.',
      'Mezcla todo, aliña con aceite, limón y sal. Espolvorea perejil.',
    ],
    macros: { calories: '420 kcal', protein: '32g', carbs: '38g', fat: '14g', fiber: '10g' },
    tips: 'Añade una pizca de comino al aliño para un toque mediterráneo.',
  },
  {
    title: 'Tortilla española ligera al horno',
    description: 'Versión más saludable sin freír. Misma textura, menos grasa.',
    prepTime: '15 min', cookTime: '20 min', cuisine: 'Española',
    tags: ['tortilla', 'huevo', 'patata', 'papa', 'horno', 'cena', 'ligero', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Patatas medianas', amount: '2 unidades (300g)', substitute: 'Batata dulce' },
      { name: 'Huevos', amount: '4 unidades', substitute: '' },
      { name: 'Claras de huevo', amount: '3 unidades', substitute: '' },
      { name: 'Cebolla', amount: '½ unidad', substitute: '' },
      { name: 'Aceite de oliva', amount: '1 cda', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Cuece las patatas laminadas en microondas 5 min con un poco de agua y sal.',
      'Sofríe la cebolla con aceite a fuego suave 5 min.',
      'Bate los huevos y las claras. Mezcla con las patatas y cebolla.',
      'Vierte en molde de horno engrasado. Hornea a 180°C, 18-20 min.',
    ],
    macros: { calories: '310 kcal', protein: '22g', carbs: '30g', fat: '10g', fiber: '3g' },
    tips: 'Al horno la tortilla queda más esponjosa. Desmolda en caliente para que no se pegue.',
  },
  {
    title: 'Crema de lentejas rojas',
    description: 'Reconfortante y digestiva. Lista en 25 minutos, sin remojo previo.',
    prepTime: '5 min', cookTime: '25 min', cuisine: 'Mediterránea',
    tags: ['lentejas', 'crema', 'sopa', 'vegano', 'kosher', 'halal', 'cena', 'recuperación', 'fibra'],
    isKosher: true, isDairy: false, isVegan: true, sportType: 'general',
    ingredients: [
      { name: 'Lentejas rojas', amount: '200g', substitute: 'Lentejas verdes (más tiempo)' },
      { name: 'Caldo de vegetales', amount: '800ml', substitute: 'Agua con pastilla' },
      { name: 'Zanahoria', amount: '2 medianas', substitute: '' },
      { name: 'Cebolla', amount: '1 mediana', substitute: '' },
      { name: 'Ajo', amount: '3 dientes', substitute: '' },
      { name: 'Comino en polvo', amount: '1 cdta', substitute: '' },
      { name: 'Cúrcuma', amount: '½ cdta', substitute: '' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Jugo de limón', amount: '1 cda', substitute: '' },
    ],
    steps: [
      'Sofríe cebolla y ajo en aceite 5 min.',
      'Añade zanahoria, comino y cúrcuma. Sofríe 2 min.',
      'Añade las lentejas rojas (sin remojo) y el caldo.',
      'Cocina 20 min a fuego medio hasta que las lentejas estén blandas.',
      'Tritura con batidora. Añade limón y ajusta sal.',
    ],
    macros: { calories: '360 kcal', protein: '20g', carbs: '54g', fat: '8g', fiber: '14g' },
    tips: 'Las lentejas rojas se deshacen solas sin necesitar batidora. Ideal para preparar de noche para el día siguiente.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SNACKS PROTEICOS
// ─────────────────────────────────────────────────────────────────────────────
const SNACKS_PROTEICOS = [
  {
    title: 'Hummus casero con bastones de zanahoria',
    description: 'Snack Kosher clásico. Rico en proteína vegetal y fibra. Sin cocción.',
    prepTime: '5 min', cookTime: '0 min', cuisine: 'Mediterránea',
    tags: ['hummus', 'zanahoria', 'snack', 'kosher', 'vegano', 'sin cocción', 'proteína vegetal', 'fibra'],
    isKosher: true, isDairy: false, isVegan: true, sportType: 'general',
    ingredients: [
      { name: 'Garbanzos cocidos', amount: '240g (1 lata)', substitute: '' },
      { name: 'Tahini (pasta de sésamo)', amount: '2 cdas', substitute: 'Crema de cacahuete' },
      { name: 'Ajo', amount: '1 diente', substitute: '½ cdta ajo en polvo' },
      { name: 'Limón', amount: '1 unidad (jugo)', substitute: '' },
      { name: 'Aceite de oliva', amount: '2 cdas', substitute: '' },
      { name: 'Comino', amount: '½ cdta', substitute: '' },
      { name: 'Sal', amount: 'Al gusto', substitute: '' },
      { name: 'Zanahorias', amount: '3 medianas (cortadas en bastones)', substitute: 'Apio, pepino' },
    ],
    steps: [
      'Escurre y enjuaga los garbanzos. Reserva 3 cdas del líquido.',
      'Tritura los garbanzos con tahini, ajo, limón, comino y sal.',
      'Añade aceite y el líquido reservado hasta conseguir textura cremosa.',
      'Sirve con bastones de zanahoria para mojar.',
    ],
    macros: { calories: '280 kcal', protein: '10g', carbs: '30g', fat: '14g', fiber: '8g' },
    tips: 'El hummus dura 5 días en nevera. Añade una capa de aceite de oliva encima para conservarlo mejor.',
  },
  {
    title: 'Yogur griego con nueces y miel',
    description: 'Proteína + grasas buenas + probióticos. El snack más simple y efectivo.',
    prepTime: '2 min', cookTime: '0 min', cuisine: 'Básico',
    tags: ['yogur', 'griego', 'nueces', 'miel', 'snack', 'proteína', 'probióticos', 'kosher'],
    isKosher: true, isDairy: true, sportType: 'general',
    ingredients: [
      { name: 'Yogur griego 0% o 2%', amount: '200g', substitute: 'Yogur natural' },
      { name: 'Nueces', amount: '20g (1 puñado pequeño)', substitute: 'Almendras o pistachos' },
      { name: 'Miel', amount: '1 cda', substitute: 'Sirope de arce' },
      { name: 'Canela', amount: '¼ cdta (opcional)', substitute: '' },
    ],
    steps: [
      'Sirve el yogur en un bowl.',
      'Añade las nueces troceadas encima.',
      'Rocía con miel y espolvorea canela.',
    ],
    macros: { calories: '250 kcal', protein: '18g', carbs: '20g', fat: '10g', fiber: '1g' },
    tips: 'El yogur griego tiene el doble de proteína que el normal. Busca marcas con certificación Kosher si aplica.',
  },
  {
    title: 'Batido post-entreno de fuerza',
    description: 'Ventana anabólica. Proteína + carbos simples para recuperación rápida.',
    prepTime: '3 min', cookTime: '0 min', cuisine: 'Fitness',
    tags: ['batido', 'shake', 'post entreno', 'proteína', 'fuerza', 'powerlifting', 'recuperación', 'whey'],
    isKosher: false, isDairy: true, sportType: 'fuerza',
    ingredients: [
      { name: 'Proteína whey (chocolate)', amount: '1 medida (30g)', substitute: 'Caseína o proteína vegetal' },
      { name: 'Leche descremada', amount: '300ml', substitute: 'Agua (menos cremoso)' },
      { name: 'Banana madura', amount: '1 mediana', substitute: 'Dátiles (3 unidades)' },
      { name: 'Mantequilla de almendra', amount: '1 cda', substitute: 'Crema de cacahuete' },
      { name: 'Hielo', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Mete todos los ingredientes en la batidora.',
      'Bate 30-45 segundos.',
      'Consume dentro de los 30-45 minutos post-entreno.',
    ],
    macros: { calories: '420 kcal', protein: '46g', carbs: '42g', fat: '8g', fiber: '3g' },
    tips: 'Para Kosher estricto usa proteína vegetal o whey con certificación. Isopure y algunas líneas de Optimum Nutrition tienen certificación.',
  },
  {
    title: 'Huevos duros con sal y pimentón',
    description: 'El snack Kosher más simple y proteico que existe.',
    prepTime: '1 min', cookTime: '10 min', cuisine: 'Básico',
    tags: ['huevo', 'huevo duro', 'snack', 'kosher', 'proteína', 'rápido', 'básico'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Huevos', amount: '3 unidades', substitute: '' },
      { name: 'Sal', amount: 'Al gusto', substitute: '' },
      { name: 'Pimentón o paprika', amount: '¼ cdta', substitute: 'Curry en polvo' },
      { name: 'Agua', amount: 'Para hervir', substitute: '' },
    ],
    steps: [
      'Pon los huevos en agua fría. Lleva a ebullición.',
      'Cuando hierva, cuenta 9-10 minutos para yema firme.',
      'Pasa a agua fría para cortar la cocción. Pela.',
      'Parte por la mitad, espolvorea sal y pimentón.',
    ],
    macros: { calories: '210 kcal', protein: '18g', carbs: '1g', fat: '14g', fiber: '0g' },
    tips: 'Prepara 6-8 huevos duros el domingo. Duran 7 días en nevera sin pelar.',
  },
  {
    title: 'Banana con mantequilla de almendra',
    description: 'Carbos + grasas buenas. Snack pre-entreno o post-comida.',
    prepTime: '1 min', cookTime: '0 min', cuisine: 'Básico',
    tags: ['banana', 'plátano', 'almendra', 'mantequilla', 'snack', 'pre entreno', 'rápido', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Banana', amount: '1 grande', substitute: 'Manzana o pera' },
      { name: 'Mantequilla de almendra', amount: '2 cdas', substitute: 'Crema de cacahuete, tahini' },
    ],
    steps: [
      'Pela la banana.',
      'Unta la mantequilla de almendra directamente o úsala como dip.',
    ],
    macros: { calories: '260 kcal', protein: '6g', carbs: '36g', fat: '12g', fiber: '4g' },
    tips: 'Ideal 60-90 min antes de entrenar. Los carbos de la banana + grasas de la almendra dan energía sostenida.',
  },
  {
    title: 'Tuna crackers Kosher',
    description: 'Atún con galletas integrales. Proteína rápida sin refrigeración.',
    prepTime: '3 min', cookTime: '0 min', cuisine: 'Básico',
    tags: ['atún', 'galletas', 'crackers', 'kosher', 'snack', 'proteína', 'sin cocción', 'rápido'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Atún al natural (Kosher)', amount: '1 lata (120g)', substitute: 'Sardinas' },
      { name: 'Galletas integrales (Kosher)', amount: '8 unidades', substitute: 'Arroz inflado, matzah' },
      { name: 'Mostaza', amount: '1 cdta', substitute: 'Aceite de oliva + limón' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Escurre el atún.',
      'Mezcla con mostaza, sal y pimienta.',
      'Sirve encima de las galletas.',
    ],
    macros: { calories: '280 kcal', protein: '28g', carbs: '24g', fat: '6g', fiber: '3g' },
    tips: 'Las latas de atún con certificación Kosher más comunes: StarKist Kosher y Bumble Bee Kosher. El matzah es naturalmente Kosher.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Exportación y función de búsqueda mejorada
// ─────────────────────────────────────────────────────────────────────────────

export const POPULAR_RECIPES = [
  // Recetas originales básicas
  {
    title: 'Huevos revueltos',
    description: 'Rápido, proteico y versátil. Listo en 5 minutos.',
    prepTime: '2 min', cookTime: '3 min', cuisine: 'Básico',
    tags: ['huevo', 'huevos', 'revueltos', 'desayuno', 'rápido', 'proteína', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Huevos', amount: '3 unidades', substitute: 'Claras de huevo (6)' },
      { name: 'Sal', amount: 'Al gusto', substitute: '' },
      { name: 'Mantequilla o aceite', amount: '1 cdta', substitute: 'Aceite de oliva' },
      { name: 'Pimienta negra', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Bate los huevos con sal y pimienta en un bowl.',
      'Calienta la sartén a fuego medio-bajo con mantequilla.',
      'Vierte los huevos y revuelve lentamente con una espátula hasta que estén cremosos. Retira antes de que estén totalmente secos.',
    ],
    macros: { calories: '220 kcal', protein: '18g', carbs: '1g', fat: '16g', fiber: '0g' },
    tips: 'El secreto es fuego bajo y no parar de mover. Saca del fuego un poco antes, el calor residual termina la cocción.',
  },
  {
    title: 'Papas fritas en air fryer',
    description: 'Crujientes por fuera, suaves por dentro. Sin aceite extra.',
    prepTime: '5 min', cookTime: '18 min', cuisine: 'Básico',
    tags: ['papas', 'papa', 'patatas', 'fritas', 'air fryer', 'airfryer', 'crujiente', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Papas', amount: '2 medianas (400g)', substitute: 'Batata/boniato' },
      { name: 'Aceite de oliva', amount: '1 cda', substitute: 'Aceite vegetal' },
      { name: 'Sal', amount: '1 cdta', substitute: '' },
      { name: 'Ajo en polvo', amount: '½ cdta (opcional)', substitute: '' },
      { name: 'Pimentón', amount: '½ cdta (opcional)', substitute: '' },
    ],
    steps: [
      'Corta las papas en bastones o gajos del mismo tamaño (aprox. 1cm de grosor).',
      'Remojar en agua fría 15-20 minutos para sacar el almidón. Secar muy bien con papel absorbente.',
      'Mezcla con el aceite y las especias.',
      'Air fryer a 200°C, 15-18 minutos. Agitar a la mitad del tiempo.',
    ],
    macros: { calories: '280 kcal', protein: '5g', carbs: '55g', fat: '5g', fiber: '4g' },
    tips: 'El paso de remojar y secar bien es clave para que queden crujientes.',
  },
  {
    title: 'Arroz blanco básico',
    description: 'La base perfecta. Suelto y bien cocido.',
    prepTime: '2 min', cookTime: '15 min', cuisine: 'Básico',
    tags: ['arroz', 'arroz blanco', 'básico', 'guarnición', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Arroz', amount: '1 taza (185g)', substitute: 'Arroz integral (+10 min)' },
      { name: 'Agua', amount: '2 tazas (480ml)', substitute: 'Caldo de pollo' },
      { name: 'Sal', amount: '1 cdta', substitute: '' },
      { name: 'Aceite o mantequilla', amount: '1 cdta', substitute: '' },
    ],
    steps: [
      'Lava el arroz hasta que el agua salga casi transparente.',
      'En una olla, lleva el agua a hervir con la sal.',
      'Agrega el arroz, reduce a fuego muy bajo, tapa y cocina 12-15 minutos sin destapar.',
      'Retira del fuego y deja reposar tapado 5 minutos. Esponja con un tenedor.',
    ],
    macros: { calories: '340 kcal', protein: '6g', carbs: '74g', fat: '1g', fiber: '1g' },
    tips: 'La regla de oro: 1 taza de arroz = 2 tazas de agua.',
  },
  {
    title: 'Pechuga de pollo a la plancha',
    description: 'Jugosa por dentro, dorada por fuera. La proteína más rápida.',
    prepTime: '5 min', cookTime: '10 min', cuisine: 'Básico',
    tags: ['pollo', 'pechuga', 'plancha', 'proteína', 'sano', 'dieta', 'kosher', 'fuerza'],
    isKosher: true, isDairy: false, sportType: 'fuerza',
    ingredients: [
      { name: 'Pechuga de pollo', amount: '1 unidad (150-200g)', substitute: 'Muslo sin piel' },
      { name: 'Aceite de oliva', amount: '1 cda', substitute: 'Aceite vegetal' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
      { name: 'Ajo en polvo', amount: '½ cdta', substitute: 'Ajo fresco laminado' },
    ],
    steps: [
      'Seca la pechuga con papel. Aplana levemente si es muy gruesa.',
      'Unta con aceite y sazona por ambos lados.',
      'Plancha o sartén a fuego medio-alto, bien caliente. 4-5 minutos por lado sin mover.',
      'Deja reposar 3 minutos antes de cortar.',
    ],
    macros: { calories: '220 kcal', protein: '42g', carbs: '0g', fat: '5g', fiber: '0g' },
    tips: 'La clave es no moverla durante la cocción para que selle bien.',
  },
  {
    title: 'Avena con fruta',
    description: 'Desayuno nutritivo y saciante. Sin cocción si usas overnight oats.',
    prepTime: '2 min', cookTime: '5 min', cuisine: 'Básico',
    tags: ['avena', 'oats', 'overnight', 'desayuno', 'fruta', 'saludable', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Avena en copos', amount: '50g (½ taza)', substitute: '' },
      { name: 'Leche o bebida vegetal', amount: '200ml', substitute: 'Agua' },
      { name: 'Plátano o fruta de temporada', amount: '1 unidad', substitute: '' },
      { name: 'Miel o sirope de arce', amount: '1 cdta (opcional)', substitute: '' },
      { name: 'Canela', amount: '½ cdta (opcional)', substitute: '' },
    ],
    steps: [
      'Mezcla la avena con la leche en un bol o cazo.',
      'Calienta a fuego medio removiendo 3-5 minutos hasta que espese.',
      'Sirve con la fruta troceada, miel y canela.',
    ],
    macros: { calories: '310 kcal', protein: '10g', carbs: '55g', fat: '5g', fiber: '7g' },
    tips: 'Versión overnight: mezcla en un frasco la noche anterior y deja en la nevera.',
  },
  {
    title: 'Ensalada básica de atún',
    description: 'Alta en proteína, sin cocción, lista en 5 minutos.',
    prepTime: '5 min', cookTime: '0 min', cuisine: 'Básico',
    tags: ['atún', 'ensalada', 'proteína', 'rápido', 'sin cocción', 'kosher'],
    isKosher: true, isDairy: false, sportType: 'general',
    ingredients: [
      { name: 'Atún en lata (al natural)', amount: '1 lata (120g escurrido)', substitute: 'Sardinas o caballa' },
      { name: 'Lechuga o mix de hojas', amount: '2 puñados', substitute: '' },
      { name: 'Tomate', amount: '1 mediano', substitute: '' },
      { name: 'Pepino', amount: '½ unidad', substitute: '' },
      { name: 'Aceite de oliva', amount: '1 cda', substitute: '' },
      { name: 'Limón o vinagre', amount: 'Al gusto', substitute: '' },
      { name: 'Sal y pimienta', amount: 'Al gusto', substitute: '' },
    ],
    steps: [
      'Lava y trocea las verduras.',
      'Escurre el atún y desmenuza.',
      'Mezcla todo, aliña con aceite, limón, sal y pimienta justo antes de comer.',
    ],
    macros: { calories: '220 kcal', protein: '28g', carbs: '8g', fat: '8g', fiber: '3g' },
    tips: 'Aliña siempre justo antes de servir.',
  },
  {
    title: 'Batido de proteínas básico',
    description: 'Post-entrenamiento o desayuno rápido. Sin cocción.',
    prepTime: '3 min', cookTime: '0 min', cuisine: 'Básico',
    tags: ['batido', 'proteína', 'shake', 'smoothie', 'post entreno', 'desayuno', 'fuerza'],
    isKosher: false, isDairy: true, sportType: 'fuerza',
    ingredients: [
      { name: 'Leche o bebida vegetal', amount: '300ml', substitute: 'Agua' },
      { name: 'Plátano', amount: '1 mediano', substitute: 'Fresas o mango' },
      { name: 'Proteína en polvo (opcional)', amount: '1 medida', substitute: '' },
      { name: 'Mantequilla de cacahuete', amount: '1 cda', substitute: 'Almendras' },
      { name: 'Avena', amount: '2 cdas', substitute: '' },
    ],
    steps: [
      'Mete todo en la batidora.',
      'Bate 30-60 segundos hasta que quede homogéneo.',
      'Sirve inmediatamente.',
    ],
    macros: { calories: '380 kcal', protein: '28g', carbs: '45g', fat: '8g', fiber: '4g' },
    tips: 'Con el plátano congelado queda más cremoso y frío.',
  },
  // Categorías nuevas
  ...DESAYUNOS_FUERZA,
  ...ALMUERZOS_MEAL_PREP,
  ...CENAS_RECUPERACION,
  ...SNACKS_PROTEICOS,
];

// ── Función de búsqueda mejorada con filtros de dieta y deporte ───────────────
function getMacroValue(recipe, key) {
  return parseFloat(String(recipe?.macros?.[key] || '0').replace(/[^\d.]/g, '')) || 0;
}

function containsRecipeSignal(recipe, signals = []) {
  const haystack = [
    recipe?.title || '',
    ...(recipe?.tags || []),
    ...(recipe?.ingredients || []).map(ingredient => ingredient.name || ''),
  ].join(' ').toLowerCase();

  return signals.some(signal => haystack.includes(signal));
}

export function searchLocalRecipes(query, profile = null) {
  if (!query?.trim() && !profile) return [];

  const q = (query || '').trim().toLowerCase();
  profile = profile ? withFoodPreferences(profile, profile?.foodPreferences) : profile;

  return POPULAR_RECIPES.filter(recipe => {
    // ── Filtro Kosher: si el perfil requiere Kosher, excluir no-Kosher ──
    if (profile?.religiousDiet === 'Kosher' && !recipe.isKosher) return false;

    // ── Filtro Halal ──
    if (profile?.religiousDiet === 'Halal' && recipe.isHalal === false) return false;

    // ── Filtro vegano ──
    if (profile?.dietaryStyle === 'Vegana' && !recipe.isVegan) return false;

    // ── Filtro vegetariano (permite isVegan también) ──
    if (profile?.dietaryStyle === 'Vegetariana' && !recipe.isVegan && !recipe.isVegetarian) return false;

    // ── Filtro de alérgenos ──
    if (profile?.allergies?.includes('Sin Lácteos') && recipe.isDairy) return false;
    if (matchesRestriction(profile, ['sin lacteos', 'sin lactosa']) && recipe.isDairy) return false;
    if (isDietSelected(profile, 'high_protein') && getMacroValue(recipe, 'protein') < 18) return false;
    if (isDietSelected(profile, 'low_carb') && getMacroValue(recipe, 'carbs') > 25) return false;
    if (isDietSelected(profile, 'keto') && getMacroValue(recipe, 'carbs') > 15) return false;
    if (isDietSelected(profile, 'pescatarian') && containsRecipeSignal(recipe, ['pollo', 'pavo', 'res', 'cerdo', 'carne', 'jamon', 'ham', 'beef', 'chicken', 'turkey'])) return false;
    if (isDietSelected(profile, 'paleo') && (
      recipe.isDairy ||
      containsRecipeSignal(recipe, ['arroz', 'avena', 'pan', 'pasta', 'fideos', 'quinoa', 'lentejas', 'garbanzos', 'porotos', 'frijol', 'soja', 'maiz'])
    )) return false;

    // ── Si no hay query, devolver todas las que pasen los filtros ──
    if (!q) return true;

    // ── Búsqueda por texto ──
    const matchesTitle = recipe.title.toLowerCase().includes(q);
    const matchesTags = recipe.tags.some(tag =>
      tag.toLowerCase().includes(q) || q.includes(tag.toLowerCase())
    );
    const matchesSport = q.includes('fuerza') || q.includes('powerlifting')
      ? recipe.sportType === 'fuerza'
      : true;

    return matchesTitle || matchesTags;
  });
}

// Devuelve recetas destacadas para el estado vacío (filtradas por perfil)
export function getFeaturedRecipes(profile = null, limit = 6) {
  const filtered = searchLocalRecipes('', profile);
  // Priorizar recetas de fuerza si el perfil es powerlifter
  if (profile?.sportType === 'Fuerza/Powerlifting') {
    const fuerza = filtered.filter(r => r.sportType === 'fuerza');
    const resto = filtered.filter(r => r.sportType !== 'fuerza');
    return [...fuerza, ...resto].slice(0, limit);
  }
  return filtered.slice(0, limit);
}
