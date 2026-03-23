import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, Apple, Search, Settings, Calendar, RefreshCw, 
  Clock, Flame, BookOpen, ChevronRight, CheckCircle2, 
  AlertTriangle, Utensils, HeartPulse, Info, Camera,
  MessageSquare, ShoppingCart, Send, Sparkles, Activity, Target, Dumbbell,
  Star, PiggyBank, Edit3, X, Compass, Heart, Bookmark, ThumbsUp, ThumbsDown
} from 'lucide-react';

// --- CONFIGURACIÓN DE LA API ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // La clave se provee en el entorno de ejecución

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [activeTab, setActiveTab] = useState('generator');
  
  // Estado Global del Plan y Comidas Guardadas
  const [plan, setPlan] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]); // Comidas que el usuario quiere forzar en el próximo plan
  
  // Estados de Guardados a largo plazo
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [interestedRecipes, setInterestedRecipes] = useState([]);
  
  // Estado del Perfil del Usuario
  const [profile, setProfile] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'Femenino',
    activityLevel: '1.2',
    dailyCalories: '',
    manualCalories: false,
    proteinTarget: '',
    manualProtein: false,
    fiberTarget: '',
    manualFiber: false,
    useProteinPowder: false,
    budgetFriendly: false, // Low Cost / Económico
    goals: 'Mantenimiento y energía',
    dietaryStyle: 'Ninguna',
    religiousDiet: 'Ninguna',
    allergies: [],
    dislikes: [],
    learnedPreferences: []
  });

  // Cargar datos al iniciar
  useEffect(() => {
    const savedProfile = localStorage.getItem('nutrichef_profile');
    const savedFavs = localStorage.getItem('nutrichef_favs');
    
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedFavs) setFavoriteRecipes(JSON.parse(savedFavs));
  }, []);

  // Guardar datos cada vez que cambien
  useEffect(() => {
    localStorage.setItem('nutrichef_profile', JSON.stringify(profile));
    localStorage.setItem('nutrichef_favs', JSON.stringify(favoriteRecipes));
  }, [profile, favoriteRecipes]);

  return (
    <div className="min-h-screen bg-orange-50 text-slate-800 font-sans pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600">
            <ChefHat size={28} />
            <h1 className="text-xl font-bold tracking-tight">NutriChef IA</h1>
          </div>
          <nav className="flex gap-1 md:gap-4 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'generator' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Utensils size={18} />
              <span className="hidden sm:inline">Crear</span>
            </button>
            <button 
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'explore' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Compass size={18} />
              <span className="hidden sm:inline">Explorar</span>
            </button>
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'saved' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Bookmark size={18} />
              <span className="hidden sm:inline">Guardados</span>
            </button>
            <button 
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'plan' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Calendar size={18} />
              <span className="hidden sm:inline">Plan</span>
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
            >
              <Settings size={18} />
              <span className="hidden sm:inline">Perfil</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === 'profile' && <ProfileView profile={profile} setProfile={setProfile} />}
        {activeTab === 'generator' && <GeneratorView profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />}
        {activeTab === 'explore' && <ExploreView profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />}
        {activeTab === 'saved' && <SavedView profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />}
        {activeTab === 'plan' && <MealPlanView profile={profile} plan={plan} setPlan={setPlan} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />}
      </main>
    </div>
  );
}

// --- SUBCOMPONENTES DE VISTAS ---

function ProfileView({ profile, setProfile }) {
  const commonAllergies = ['Sin Gluten', 'Sin Lácteos', 'Alergia al Maní', 'Alergia a Mariscos', 'Sin Soya'];
  const dietaryStyles = ['Ninguna', 'Vegetariana', 'Vegana', 'Pescatariana', 'Keto', 'Paleo'];
  const religiousDiets = ['Ninguna', 'Halal', 'Kosher', 'Hindú (Sin carne de res)', 'Jainista'];
  const [dislikeInput, setDislikeInput] = useState('');

  // Efecto para calcular calorías y macros automáticamente
  useEffect(() => {
    if (profile.weight && profile.height && profile.age && !profile.manualCalories && !profile.manualProtein && !profile.manualFiber) {
      const w = parseFloat(profile.weight);
      const h = parseFloat(profile.height);
      const a = parseFloat(profile.age);
      
      if (w > 0 && h > 0 && a > 0) {
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        bmr += profile.gender === 'Masculino' ? 5 : -161;
        
        let tdee = bmr * parseFloat(profile.activityLevel);
        let calTarget = tdee;
        let proteinFactor = 1.6;

        if (profile.goals.includes('Déficit')) {
          calTarget -= 500;
          proteinFactor = 2.0;
        } else if (profile.goals.includes('Superávit')) {
          calTarget += 500;
          proteinFactor = 2.2;
        }

        let fiber = Math.round((calTarget / 1000) * 14);

        setProfile(prev => ({
          ...prev,
          dailyCalories: Math.round(calTarget).toString(),
          proteinTarget: Math.round(w * proteinFactor).toString(),
          fiberTarget: fiber.toString()
        }));
      }
    }
  }, [profile.weight, profile.height, profile.age, profile.gender, profile.activityLevel, profile.goals, profile.manualCalories, profile.manualProtein, profile.manualFiber]);

  const toggleAllergy = (res) => {
    if (profile.allergies.includes(res)) {
      setProfile({ ...profile, allergies: profile.allergies.filter(r => r !== res) });
    } else {
      setProfile({ ...profile, allergies: [...profile.allergies, res] });
    }
  };

  const removeLearnedPreference = (index) => {
    const newPrefs = [...profile.learnedPreferences];
    newPrefs.splice(index, 1);
    setProfile({ ...profile, learnedPreferences: newPrefs });
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-orange-100">
      <div className="flex items-center gap-3 mb-8 border-b pb-4">
        <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
          <HeartPulse size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tu Perfil Integral</h2>
          <p className="text-slate-500 text-sm">Medidas, objetivos y preferencias para una personalización total.</p>
        </div>
      </div>

      <div className="space-y-8">
        
        {/* NIVEL DE ACTIVIDAD Y OBJETIVOS */}
        <section className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-200 shadow-inner">
           <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2"><Target size={20} /> Tu Meta Principal</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-orange-900 mb-2">¿Cuál es tu objetivo?</label>
                <select value={profile.goals} onChange={(e) => setProfile({...profile, goals: e.target.value, manualCalories: false})} className="w-full p-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-700 shadow-sm">
                  <option>Mantenimiento y energía</option>
                  <option>Déficit calórico (Pérdida de peso)</option>
                  <option>Superávit calórico (Ganancia muscular)</option>
                  <option>Comer más saludable general</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-orange-900 mb-2">Nivel de Actividad Física</label>
                <select value={profile.activityLevel} onChange={(e) => setProfile({...profile, activityLevel: e.target.value, manualCalories: false})} className="w-full p-3 rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium text-slate-700 shadow-sm">
                  <option value="1.2">Sedentario (Poco o nada)</option>
                  <option value="1.375">Ligero (1-3 días/semana)</option>
                  <option value="1.55">Moderado (3-5 días/semana)</option>
                  <option value="1.725">Activo (Fuerte 6-7 días/semana)</option>
                </select>
              </div>
           </div>
        </section>

        {/* Datos Físicos y Metas */}
        <section className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={18} className="text-blue-500" /> Biometría y Cálculos</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Edad</label>
              <input type="number" value={profile.age} onChange={(e) => setProfile({...profile, age: e.target.value, manualCalories: false})} placeholder="Ej: 30" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Género</label>
              <select value={profile.gender} onChange={(e) => setProfile({...profile, gender: e.target.value, manualCalories: false})} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option>Femenino</option>
                <option>Masculino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Peso (kg)</label>
              <input type="number" value={profile.weight} onChange={(e) => setProfile({...profile, weight: e.target.value, manualCalories: false})} placeholder="Ej: 70" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Altura (cm)</label>
              <input type="number" value={profile.height} onChange={(e) => setProfile({...profile, height: e.target.value, manualCalories: false})} placeholder="Ej: 175" className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
            <div className="bg-orange-100/50 p-4 rounded-xl border border-orange-200">
              <label className="block text-sm font-semibold text-orange-900 mb-1 flex justify-between">
                <span>Meta Diaria (kcal)</span>
                {profile.manualCalories && <span className="text-xs text-orange-600 bg-orange-200 px-2 py-0.5 rounded-full">Manual</span>}
              </label>
              <p className="text-xs text-orange-700 mb-2">Ajustado según biometría.</p>
              <input type="number" value={profile.dailyCalories} onChange={(e) => setProfile({...profile, dailyCalories: e.target.value, manualCalories: true})} placeholder="Ej: 2000" className="w-full p-3 rounded-xl border border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none bg-white" />
            </div>
            <div className="bg-blue-100/50 p-4 rounded-xl border border-blue-200">
              <label className="block text-sm font-semibold text-blue-900 mb-1 flex justify-between">
                <span>Proteína (g)</span>
                {profile.manualProtein && <span className="text-xs text-blue-600 bg-blue-200 px-2 py-0.5 rounded-full">Manual</span>}
              </label>
              <p className="text-xs text-blue-700 mb-2">Calculada para tu objetivo (1.6 - 2.2g/kg).</p>
              <input type="number" value={profile.proteinTarget} onChange={(e) => setProfile({...profile, proteinTarget: e.target.value, manualProtein: true})} placeholder="Ej: 120" className="w-full p-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white" />
            </div>
            <div className="bg-green-100/50 p-4 rounded-xl border border-green-200">
              <label className="block text-sm font-semibold text-green-900 mb-1 flex justify-between">
                <span>Fibra (g)</span>
                {profile.manualFiber && <span className="text-xs text-green-600 bg-green-200 px-2 py-0.5 rounded-full">Manual</span>}
              </label>
              <p className="text-xs text-green-700 mb-2">Aprox. 14g por 1000 kcal.</p>
              <input type="number" value={profile.fiberTarget} onChange={(e) => setProfile({...profile, fiberTarget: e.target.value, manualFiber: true})} placeholder="Ej: 30" className="w-full p-3 rounded-xl border border-green-300 focus:ring-2 focus:ring-green-500 outline-none bg-white" />
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 grid md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1"><Dumbbell size={16} className="text-slate-500"/> Suplemento</h4>
                <p className="text-xs text-slate-500">Permite recetas con Proteína en Polvo.</p>
              </div>
              <button onClick={() => setProfile({...profile, useProteinPowder: !profile.useProteinPowder})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.useProteinPowder ? 'bg-blue-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.useProteinPowder ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-200">
              <div>
                <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-1"><PiggyBank size={16} className="text-emerald-600"/> Modo Económico</h4>
                <p className="text-xs text-emerald-700">Prioriza recetas de bajo costo y Meal Prep.</p>
              </div>
              <button onClick={() => setProfile({...profile, budgetFriendly: !profile.budgetFriendly})} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${profile.budgetFriendly ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.budgetFriendly ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Tipos de Dieta Separados */}
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Apple size={16} className="text-green-500"/> Estilo de Dieta
            </label>
            <div className="flex flex-wrap gap-2">
              {dietaryStyles.map(diet => (
                <button
                  key={diet}
                  onClick={() => setProfile({...profile, dietaryStyle: diet})}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    profile.dietaryStyle === diet ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <BookOpen size={16} className="text-purple-500"/> Dieta Religiosa/Ética
            </label>
            <div className="flex flex-wrap gap-2">
              {religiousDiets.map(diet => (
                <button
                  key={diet}
                  onClick={() => setProfile({...profile, religiousDiet: diet})}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    profile.religiousDiet === diet ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {diet}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Restricciones y Alergias */}
        <section>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500"/> Alergias e Intolerancias Médicas
          </label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map(res => (
              <button
                key={res}
                onClick={() => toggleAllergy(res)}
                className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                  profile.allergies.includes(res) 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200'
                }`}
              >
                {profile.allergies.includes(res) && <CheckCircle2 size={14} />}
                {res}
              </button>
            ))}
          </div>
        </section>

        {/* Dislikes Explícitos */}
        <section>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Ingredientes que NO te gustan (Fijos)</label>
          <p className="text-xs text-slate-500 mb-3">La IA entenderá sinónimos y alimentos de la misma familia. Escribe un alimento y presiona "Enter".</p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all flex flex-wrap gap-2 items-center min-h-[50px]">
            {profile.dislikes.map((item, index) => (
              <span key={index} className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                {item}
                <button onClick={() => setProfile({...profile, dislikes: profile.dislikes.filter((_, i) => i !== index)})} className="text-slate-400 hover:text-red-500 font-bold">×</button>
              </span>
            ))}
            <input 
              type="text" 
              value={dislikeInput}
              onChange={(e) => setDislikeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && dislikeInput.trim()) {
                  e.preventDefault();
                  if (!profile.dislikes.includes(dislikeInput.trim())) {
                    setProfile({...profile, dislikes: [...profile.dislikes, dislikeInput.trim()]});
                  }
                  setDislikeInput('');
                }
              }}
              placeholder={profile.dislikes.length === 0 ? "Ej: Cilantro, Mariscos..." : "Agregar otro..."}
              className="flex-1 bg-transparent outline-none text-sm min-w-[150px]"
            />
          </div>
        </section>

        {/* Preferencias Aprendidas */}
        {profile.learnedPreferences.length > 0 && (
          <section className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
            <label className="block text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <RefreshCw size={16} className="text-blue-500"/> Lo que la IA ha aprendido de ti
            </label>
            <p className="text-xs text-blue-700 mb-3">La aplicación ha registrado esto basado en tu feedback de platos comidos. Haz clic para olvidar una regla.</p>
            <div className="flex flex-wrap gap-2">
              {profile.learnedPreferences.map((pref, i) => (
                <button
                  key={i}
                  onClick={() => removeLearnedPreference(i)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-200 text-blue-800 hover:bg-red-200 hover:text-red-800 transition-colors flex items-center gap-1 group"
                  title="Haz clic para eliminar"
                >
                  {pref} <span className="hidden group-hover:inline ml-1">×</span>
                </button>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

function GeneratorView({ profile, setProfile, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes }) {
  const [ingredients, setIngredients] = useState('');
  const [dishType, setDishType] = useState('Plato Principal (Salado)');
  const [difficulty, setDifficulty] = useState('Media');
  const [cuisine, setCuisine] = useState('Sorpréndeme');
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  
  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result.split(',')[1];
      setScanning(true);
      try {
        const prompt = "Identifica todos los ingredientes de comida visibles en esta imagen. Devuelve ÚNICAMENTE una lista de los nombres de los ingredientes separados por comas, sin texto adicional ni saltos de línea.";
        const resultText = await callGeminiVisionAPI(prompt, base64Data, file.type);
        setIngredients(prev => prev ? `${prev}, ${resultText.trim()}` : resultText.trim());
      } catch (err) {
        console.error(err);
        setError("Error al escanear la imagen.");
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const getSuggestions = async () => {
    if (!ingredients.trim()) {
      setError("Por favor ingresa algunos ingredientes que tengas.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestions(null);
    setSelectedRecipe(null);

    const prompt = `
      Eres un Chef Experto e IA Nutricional. 
      PARÁMETROS DEL USUARIO:
      - Ingredientes disponibles (prioriza usar estos, puedes agregar básicos de despensa): ${ingredients}
      - Tipo de plato: ${dishType} (Dulce o Salado)
      - Nivel de Dificultad: ${difficulty}
      - Tipo de cocina sugerida: ${cuisine}.
      - Modo Económico Activado: ${profile.budgetFriendly ? 'SÍ, minimiza costos y usa lo que hay.' : 'NO, prioriza la creatividad.'}
      
      PERFIL DEL USUARIO (¡ESTRICTO! DEBES CUMPLIR ESTO):
      - Datos físicos y meta: Peso: ${profile.weight || 'N/A'}kg, Calorías Meta: ${profile.dailyCalories || 'N/A'}kcal.
      - Objetivo principal: ${profile.goals}
      - Estilo de dieta: ${profile.dietaryStyle}, Religión: ${profile.religiousDiet}
      - Alergias/Intolerancias: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'Ninguna'}
      - Evitar: ${profile.dislikes.length > 0 ? profile.dislikes.join(', ') : 'Ninguno'}.
      - Platos que le encantan (Inspírate en esto si cuadra): ${favoriteRecipes.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : 'Aún ninguno'}
      - Preferencias aprendidas por IA: ${profile.learnedPreferences.length > 0 ? profile.learnedPreferences.join(' | ') : 'Ninguna'}

      En lugar de imponer una sola receta, genera 3 OPCIONES diferentes de preparaciones (ej. una al horno, otra en sartén, una ensalada fría, etc.) que se puedan hacer con esos ingredientes.

      Devuelve ÚNICAMENTE un JSON válido con este esquema exacto:
      {
        "suggestions": [
          {
            "id": 1,
            "name": "Nombre creativo de la opción",
            "type": "Método/Estilo (Ej: Al horno, Rápido en sartén)",
            "description": "Por qué es buena idea y cómo usa los ingredientes disponibles."
          }
        ]
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result.suggestions);
    } catch (err) {
      setError("Hubo un error al generar las opciones. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateFromSuggestion = async (sugg) => {
    setGeneratingRecipe(true);
    const prompt = `
      Genera la receta completa para: "${sugg.name}".
      Contexto de la idea original: ${sugg.description}. Usando estos ingredientes base: ${ingredients}.
      
      Perfil a cumplir:
      - Objetivo: ${profile.goals} (Calorías Meta: ${profile.dailyCalories || 'N/A'}, Proteína: ${profile.proteinTarget || 'N/A'}g, Fibra: ${profile.fiberTarget || 'N/A'}g).
      - Restricciones: ${[profile.dietaryStyle, profile.religiousDiet, ...profile.allergies].join(', ')}.
      - Evitar: ${profile.dislikes.join(', ')} ${profile.learnedPreferences.join(' ')}.
      - Proteína en polvo: ${profile.useProteinPowder ? 'Sí' : 'No'}.

      Devuelve la respuesta ÚNICAMENTE en un JSON válido con este esquema exacto:
      {
        "title": "Nombre creativo del plato",
        "description": "Breve descripción apetitosa de 2 líneas",
        "prepTime": "XX min",
        "cookTime": "XX min",
        "cuisine": "Tipo de cocina",
        "ingredients": [
          { "name": "Nombre ingrediente", "amount": "Cantidad", "substitute": "Sustituto sugerido si no lo tiene" }
        ],
        "steps": ["Paso 1...", "Paso 2..."],
        "macros": { "calories": "aprox", "protein": "Xg", "carbs": "Xg", "fat": "Xg", "fiber": "Xg" },
        "tips": "Un consejo de cocina relacionado a este plato"
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setSelectedRecipe(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Apple className="text-orange-500" size={20} />
            ¿Qué hay en tu cocina?
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Ingredientes Disponibles</label>
              <div className="relative">
                <textarea 
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="Ej: Pollo, arroz, tomates, espinaca..."
                  className="w-full p-3 pb-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 min-h-[100px]"
                />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="absolute bottom-3 right-3 bg-white border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-300 p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm z-10"
                  title="Escanear ingredientes con foto"
                >
                  {scanning ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
                  {scanning ? 'Escaneando...' : '✨ Escanear Foto'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Tipo</label>
                <select value={dishType} onChange={e => setDishType(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none">
                  <option>Plato Principal (Salado)</option>
                  <option>Desayuno</option>
                  <option>Snack / Picoteo</option>
                  <option>Postre (Dulce)</option>
                  <option>Aperitivo</option>
                  <option>Bebida / Batido</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Dificultad</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none">
                  <option>Fácil</option>
                  <option>Media</option>
                  <option>Difícil (Reto)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Inspiración (Cocina)</label>
              <select value={cuisine} onChange={e => setCuisine(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 outline-none">
                <option>Sorpréndeme</option>
                <option>Mediterránea</option>
                <option>Asiática</option>
                <option>Latinoamericana</option>
                <option>Fusión</option>
                <option>India</option>
              </select>
            </div>

            <button 
              onClick={getSuggestions}
              disabled={loading || generatingRecipe}
              className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Flame size={20} />}
              {loading ? 'Analizando tu cocina...' : 'Buscar Opciones'}
            </button>
            {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8">
        {loading && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-orange-400 space-y-4 bg-white/50 rounded-3xl border border-dashed border-orange-200">
            <RefreshCw className="animate-spin" size={48} />
            <p className="font-medium animate-pulse">Pensando qué preparar con tus ingredientes...</p>
          </div>
        )}
        
        {!loading && !suggestions && !selectedRecipe && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 space-y-4 bg-white/50 rounded-3xl border border-dashed border-slate-200 p-8 text-center">
            <ChefHat size={64} className="opacity-20" />
            <p className="text-lg">Ingresa lo que tienes en tu nevera y te daré opciones para preparar.</p>
          </div>
        )}

        {suggestions && !selectedRecipe && !generatingRecipe && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Sparkles className="text-orange-500" /> Mira lo que puedes hacer:</h3>
            <div className="grid gap-4">
              {suggestions.map((sugg) => (
                <div key={sugg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-orange-300 transition-colors">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full inline-block mb-2">
                      {sugg.type}
                    </span>
                    <h4 className="text-xl font-bold text-slate-800 mb-2">{sugg.name}</h4>
                    <p className="text-slate-600 text-sm">{sugg.description}</p>
                  </div>
                  <button 
                    onClick={() => generateFromSuggestion(sugg)}
                    className="w-full sm:w-auto py-2.5 px-6 bg-orange-50 text-orange-700 font-bold rounded-xl hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-2 shrink-0"
                  >
                    <ChefHat size={18} /> Ver Receta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatingRecipe && !selectedRecipe && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-orange-500">
            <RefreshCw className="animate-spin mb-4" size={48} />
            <p className="font-medium animate-pulse">Escribiendo el paso a paso de la receta...</p>
          </div>
        )}

        {selectedRecipe && (
          <div>
             <button onClick={() => setSelectedRecipe(null)} className="mb-4 text-orange-600 font-medium flex items-center gap-1 hover:underline">
               <ChevronRight className="rotate-180" size={18} /> Volver a opciones
             </button>
             <RecipeCard recipe={selectedRecipe} profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />
          </div>
        )}
      </div>
    </div>
  );
}

function ExploreView({ profile, setProfile, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  const handleDirectSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRecipe(null);
    setSuggestions(null);

    const prompt = `
      El usuario buscó específicamente variaciones o alternativas saludables de: "${query}".
      Genera 3 opciones distintas de este plato, estrictamente adaptadas a su perfil nutricional:
      - Objetivo: ${profile.goals} (Calorías: ${profile.dailyCalories || 'N/A'}, Proteína: ${profile.proteinTarget || 'N/A'}g).
      - Dieta: ${profile.dietaryStyle}, Religión: ${profile.religiousDiet}.
      - Evitar: ${[...profile.allergies, ...profile.dislikes, ...profile.learnedPreferences].join(', ')}.
      - Platos que ya le gustan: ${favoriteRecipes.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : 'Ninguno registrado'}.
      - Presupuesto: ${profile.budgetFriendly ? 'Económico/Low Cost' : 'Normal'}
      
      Devuelve ÚNICAMENTE un JSON con esta estructura:
      {
        "suggestions": [
          {
            "id": 1,
            "name": "Nombre de la variación (Ej: Lasaña Keto)",
            "type": "Variación / Estilo",
            "description": "Por qué es perfecta y cómo se adapta a su dieta"
          }
        ]
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggest = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setRecipe(null);
    setSuggestions(null);

    const prompt = `
      El usuario tiene el siguiente antojo o idea: "${query}".
      Genera 3 sugerencias creativas y deliciosas que satisfagan esto, estrictamente adaptadas a su perfil nutricional:
      - Objetivo: ${profile.goals} (Calorías: ${profile.dailyCalories || 'N/A'}, Proteína: ${profile.proteinTarget || 'N/A'}g).
      - Dieta: ${profile.dietaryStyle}, Religión: ${profile.religiousDiet}.
      - Evitar: ${[...profile.allergies, ...profile.dislikes, ...profile.learnedPreferences].join(', ')}.
      - Platos que ya le gustan: ${favoriteRecipes.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : 'Ninguno registrado'}.
      - Presupuesto: ${profile.budgetFriendly ? 'Económico/Low Cost' : 'Normal'}
      
      Devuelve ÚNICAMENTE un JSON con esta estructura:
      {
        "suggestions": [
          {
            "id": 1,
            "name": "Nombre de la sugerencia",
            "type": "Ej: Postre, Snack, Cena",
            "description": "Por qué es perfecto para su antojo y cómo se adapta a su dieta"
          }
        ]
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateFromSuggestion = async (sugg) => {
    setGeneratingRecipe(true);
    setSuggestions(null);
    const prompt = `
      Genera la receta completa para: "${sugg.name}".
      Contexto del plato: ${sugg.description}.
      Perfil a cumplir:
      - Objetivo: ${profile.goals} (Calorías Meta: ${profile.dailyCalories || 'N/A'}, Proteína: ${profile.proteinTarget || 'N/A'}g, Fibra: ${profile.fiberTarget || 'N/A'}g).
      - Restricciones: ${[profile.dietaryStyle, profile.religiousDiet, ...profile.allergies].join(', ')}.
      - Evitar: ${profile.dislikes.join(', ')} ${profile.learnedPreferences.join(' ')}.
      - Proteína en polvo: ${profile.useProteinPowder ? 'Sí' : 'No'}.

      Devuelve la respuesta ÚNICAMENTE en un JSON válido con este esquema exacto:
      {
        "title": "Nombre creativo del plato",
        "description": "Breve descripción",
        "prepTime": "XX min", "cookTime": "XX min", "cuisine": "Tipo",
        "ingredients": [ { "name": "Ingrediente", "amount": "Cant.", "substitute": "Sustituto" } ],
        "steps": ["Paso 1..."],
        "macros": { "calories": "aprox", "protein": "Xg", "carbs": "Xg", "fat": "Xg", "fiber": "Xg" },
        "tips": "Tip"
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setRecipe(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl shadow-md text-white text-center">
        <Compass size={40} className="mx-auto mb-4 opacity-90" />
        <h2 className="text-3xl font-bold mb-3">Explora y Antójate</h2>
        <p className="text-indigo-100 mb-6 max-w-lg mx-auto">Busca la receta de un plato específico (ej: "Lasaña") o dinos qué se te antoja para darte sugerencias (ej: "Algo dulce con chocolate").</p>
        
        <div className="flex flex-col sm:flex-row gap-3 bg-white/10 p-2 rounded-2xl md:rounded-full backdrop-blur-md max-w-2xl mx-auto border border-white/20">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDirectSearch()}
            placeholder="¿Qué quieres comer hoy?" 
            className="flex-1 bg-transparent text-white placeholder:text-indigo-200 px-4 py-2 outline-none"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleDirectSearch}
              disabled={loading || !query.trim()}
              className="flex-1 sm:flex-none bg-white text-indigo-600 px-5 py-2.5 rounded-xl md:rounded-full font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
            >
              <Search size={18} /> Directa
            </button>
            <button 
              onClick={handleSuggest}
              disabled={loading || !query.trim()}
              className="flex-1 sm:flex-none bg-indigo-700 hover:bg-indigo-800 text-white px-5 py-2.5 rounded-xl md:rounded-full font-bold transition-colors disabled:opacity-50 flex justify-center items-center gap-2 shadow-sm"
            >
              <Sparkles size={18} /> Sugerencias
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
          <RefreshCw className="animate-spin mb-4" size={40} />
          <p className="font-medium animate-pulse">Explorando opciones deliciosas...</p>
        </div>
      )}

      {suggestions && !recipe && !generatingRecipe && (
        <div className="grid md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
          {suggestions.map((sugg) => (
            <div key={sugg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 flex flex-col hover:shadow-md transition-shadow">
              <span className="text-xs font-bold text-purple-600 bg-purple-100 px-3 py-1 rounded-full w-max mb-3">
                {sugg.type}
              </span>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{sugg.name}</h3>
              <p className="text-slate-600 text-sm mb-6 flex-1">{sugg.description}</p>
              <button 
                onClick={() => generateFromSuggestion(sugg)}
                className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ChefHat size={18} /> Ver Receta
              </button>
            </div>
          ))}
        </div>
      )}

      {generatingRecipe && !recipe && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-500">
          <RefreshCw className="animate-spin mb-4" size={40} />
          <p className="font-medium animate-pulse">Escribiendo el paso a paso de la receta...</p>
        </div>
      )}

      {recipe && (
        <div>
          <button onClick={() => setRecipe(null)} className="mb-4 text-indigo-600 font-medium flex items-center gap-1 hover:underline">
             <ChevronRight className="rotate-180" size={18} /> Volver a explorar
          </button>
          <RecipeCard recipe={recipe} profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />
        </div>
      )}
    </div>
  );
}

function SavedView({ profile, setProfile, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  if (selectedRecipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedRecipe(null)} className="mb-4 text-orange-600 font-medium flex items-center gap-1 hover:underline">
          <ChevronRight className="rotate-180" size={18} /> Volver a Mis Guardados
        </button>
        <RecipeCard recipe={selectedRecipe} profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Heart className="text-red-500" fill="currentColor" /> Mis Recetas Favoritas
        </h2>
        {favoriteRecipes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            Aún no has marcado ninguna receta como favorita. 
            <br /> <span className="text-sm">La IA usará lo que guardes aquí para aprender de tus gustos reales.</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteRecipes.map((rec, i) => (
              <div key={`fav-${i}`} onClick={() => setSelectedRecipe(rec)} className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 cursor-pointer hover:shadow-md hover:border-red-300 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">{rec.cuisine || 'Receta'}</span>
                  <Heart size={18} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor"/>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 leading-tight">{rec.title}</h3>
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">🔥 {rec.macros?.calories || '?'}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md">⏱️ {rec.prepTime || '?'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Bookmark className="text-blue-500" fill="currentColor" /> Me Interesa Probar
        </h2>
        {interestedRecipes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500">
            Guarda aquí las recetas que te llamen la atención para revisarlas más tarde.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {interestedRecipes.map((rec, i) => (
              <div key={`int-${i}`} onClick={() => setSelectedRecipe(rec)} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{rec.cuisine || 'Receta'}</span>
                  <Bookmark size={18} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor"/>
                </div>
                <h3 className="font-bold text-slate-800 mb-2 leading-tight">{rec.title}</h3>
                <div className="flex gap-2 text-xs font-semibold text-slate-500">
                  <span className="bg-slate-100 px-2 py-1 rounded-md">🔥 {rec.macros?.calories || '?'}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-md">⏱️ {rec.prepTime || '?'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MealPlanView({ profile, plan, setPlan, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes }) {
  const [loading, setLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [creatineTaken, setCreatineTaken] = useState(false);
  const [planType, setPlanType] = useState('Diario');

  const [planPreferences, setPlanPreferences] = useState('');
  const [isTrainingDay, setIsTrainingDay] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  const [swappingData, setSwappingData] = useState(null); 
  const [customSwapRequest, setCustomSwapRequest] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    setShoppingList(null);
    setSwappingData(null);
    
    const isWeekly = planType === 'Semanal';
    const isUpdatingSingleDay = !isWeekly && plan && plan.days && plan.days.length > 0;
    const targetDayName = isUpdatingSingleDay ? plan.days[selectedDayIdx].dayName : (isWeekly ? 'Día 1 (Lunes)' : 'Hoy');
    
    const prompt = `
      Crea un plan de comidas ${isWeekly ? 'SEMANAL (7 días completos, enfocado en Meal Prep/Batch Cooking)' : 'de 1 DÍA COMPLETO'} adaptado a este perfil:
      - Datos: Peso ${profile.weight || 'N/A'}kg. Meta de Calorías Base: ${profile.dailyCalories || 'Adecuadas'} kcal/día. Proteínas: ${profile.proteinTarget || 'Adecuada'} g/día.
      - Objetivo: ${profile.goals}
      - Dieta: ${profile.dietaryStyle}, ${profile.religiousDiet}
      - Evitar: ${[...profile.allergies, ...profile.dislikes, ...profile.learnedPreferences].join(', ')}
      - Platos que le encantan al usuario (úsalos de inspiración si es posible): ${favoriteRecipes?.length > 0 ? favoriteRecipes.map(r => r.title).join(', ') : 'Ninguno registrado'}
      - Presupuesto Económico Activado: ${profile.budgetFriendly ? 'SÍ, usa legumbres, arroz, vegetales de estación. Muy barato.' : 'NO'}
      - PREFERENCIAS PUNTUALES PARA ESTE PLAN: ${planPreferences || 'Ninguna'}
      - DÍA DE ENTRENAMIENTO: ${isTrainingDay ? 'SÍ. Aumenta las calorías diarias un 10-15% (aprox +200-300 kcal) y prioriza los carbohidratos (complejos y simples) alrededor del entreno (snacks o comida principal) para energía y recuperación.' : 'NO. Es día de descanso, mantén las calorías base calculadas y evita el exceso de carbohidratos simples.'}
      - COMIDAS FIJADAS POR EL USUARIO (OBLIGATORIO INCLUIR ESTAS EN EL PLAN): ${savedMeals.length > 0 ? savedMeals.map(m => m.title).join(', ') : 'Ninguna'}

      ${!isWeekly ? 'Para CADA TIPO DE COMIDA (Desayuno, Almuerzo, Snack, Cena), ofrece 2 OPCIONES DISTINTAS para dar variedad.' : 'Para el plan semanal, usa la estrategia de "Batch Cooking". NO repitas el mismo menú exacto los 7 días. Crea 2 o 3 opciones diferentes de almuerzos/cenas y altérnalas a lo largo de la semana para dar variedad sin complicar la cocina.'}

      Devuelve un JSON estricto con esta estructura:
      {
        "summary": "Resumen motivacional y tips para el plan, mencionando si hay adaptaciones por entrenamiento o preferencias",
        "totalCalories": "aprox kcal (promedio diario ajustado)",
        "totalProtein": "aprox g (promedio diario)",
        "totalFiber": "aprox g (promedio diario)",
        "days": [
          {
            "dayName": "${targetDayName}",
            "meals": [
              {
                "type": "Desayuno",
                "options": [
                  { "name": "Nombre", "description": "Breve", "calories": "kcal", "protein": "Xg", "fiber": "Xg" }
                ]
              }
            ]
          }
        ]
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      
      if (isUpdatingSingleDay && result.days && result.days.length > 0) {
        const updatedPlan = { ...plan };
        updatedPlan.days[selectedDayIdx] = result.days[0];
        setPlan(updatedPlan);
      } else {
        setPlan(result);
        setSelectedDayIdx(0); 
      }
      setSavedMeals([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async () => {
    if (!swappingData || !customSwapRequest.trim()) return;
    setIsSwapping(true);

    const { dayIdx, mealIdx, currentMealName } = swappingData;
    const currentMealType = plan.days[dayIdx].meals[mealIdx].type;

    const prompt = `
      El usuario está viendo su plan de comidas y quiere reemplazar el "${currentMealName}" (${currentMealType}) del ${plan.days[dayIdx].dayName}.
      Petición especial del usuario para este reemplazo: "${customSwapRequest}".
      
      Asegúrate de que siga cumpliendo su perfil: ${profile.goals}, Dieta: ${profile.dietaryStyle}, Evitar: ${[...profile.allergies, ...profile.dislikes].join(', ')}.

      Devuelve ÚNICAMENTE un JSON con la nueva comida (manteniendo el formato original):
      {
        "options": [
          { "name": "Nuevo Plato", "description": "Por qué cumple con la petición...", "calories": "...", "protein": "...", "fiber": "..." }
        ]
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      const newPlan = { ...plan };
      newPlan.days[dayIdx].meals[mealIdx].options = result.options;
      setPlan(newPlan);
      
      setSwappingData(null);
      setCustomSwapRequest('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwapping(false);
    }
  };

  const generateRecipeFromPlan = async (opt) => {
    setGeneratingRecipe(true);
    const prompt = `
      Genera la receta completa para: "${opt.name}".
      Contexto del plato: ${opt.description}.
      Perfil a cumplir:
      - Objetivo: ${profile.goals} (Ajustado a esta comida -> Calorías Meta: ${opt.calories}, Proteína: ${opt.protein}, Fibra: ${opt.fiber}).
      - Restricciones: ${[profile.dietaryStyle, profile.religiousDiet, ...profile.allergies].join(', ')}.
      - Evitar: ${profile.dislikes.join(', ')} ${profile.learnedPreferences.join(' ')}.
      - Proteína en polvo: ${profile.useProteinPowder ? 'Sí' : 'No'}.

      Devuelve la respuesta ÚNICAMENTE en un JSON válido con este esquema exacto:
      {
        "title": "Nombre creativo del plato",
        "description": "Breve descripción",
        "prepTime": "XX min", "cookTime": "XX min", "cuisine": "Tipo",
        "ingredients": [ { "name": "Ingrediente", "amount": "Cant.", "substitute": "Sustituto" } ],
        "steps": ["Paso 1..."],
        "macros": { "calories": "aprox", "protein": "Xg", "carbs": "Xg", "fat": "Xg", "fiber": "Xg" },
        "tips": "Tip"
      }
    `;

    try {
      const result = await callGeminiAPI(prompt);
      setSelectedRecipe(result);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingRecipe(false);
    }
  };

  if (generatingRecipe) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-green-600">
        <RefreshCw className="animate-spin mb-4" size={48} />
        <p className="font-medium animate-pulse">Escribiendo la receta detallada...</p>
      </div>
    );
  }

  if (selectedRecipe) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedRecipe(null)} className="mb-4 text-green-600 font-medium flex items-center gap-1 hover:underline">
          <ChevronRight className="rotate-180" size={18} /> Volver a mi Plan
        </button>
        <RecipeCard recipe={selectedRecipe} profile={profile} setProfile={setProfile} savedMeals={savedMeals} setSavedMeals={setSavedMeals} favoriteRecipes={favoriteRecipes} setFavoriteRecipes={setFavoriteRecipes} interestedRecipes={interestedRecipes} setInterestedRecipes={setInterestedRecipes} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Planificador Inteligente</h2>
            <p className="text-slate-500 text-sm mt-1">Genera un menú alineado a tus metas ({profile.goals}).</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <select 
              value={planType} 
              onChange={e => setPlanType(e.target.value)}
              className="px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none bg-slate-50 font-bold text-slate-700"
            >
              <option value="Diario">{plan && plan.days?.length > 1 ? 'Solo el Día Seleccionado' : 'Plan de 1 Día'}</option>
              <option value="Semanal">Plan Semanal (Meal Prep)</option>
            </select>

            <button 
              onClick={generatePlan}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
            >
              {loading ? <RefreshCw className="animate-spin" size={20} /> : <Calendar size={20} />}
              {plan ? (planType === 'Diario' && plan.days?.length > 1 ? 'Regenerar Día Actual' : 'Regenerar Plan') : 'Crear Plan'}
            </button>
          </div>
       </div>

       {/* Opciones de Planificación Dinámicas */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 space-y-4">
         <h4 className="font-bold text-slate-800 flex items-center gap-2"><Settings size={18} className="text-slate-500" /> Ajustes de este Plan</h4>
         
         <div className="grid md:grid-cols-2 gap-6">
           <div>
             <label className="block text-sm font-semibold text-slate-700 mb-2">¿Tienes alguna preferencia hoy?</label>
             <input 
               type="text" 
               value={planPreferences}
               onChange={e => setPlanPreferences(e.target.value)}
               placeholder="Ej: Quiero comer más legumbres, menos carne..."
               className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-green-500 outline-none bg-slate-50 text-sm transition-all"
             />
           </div>
           
           <div className="flex items-center justify-between bg-orange-50 p-4 rounded-xl border border-orange-200">
             <div>
               <h4 className="font-bold text-orange-900 text-sm flex items-center gap-1"><Activity size={16} /> Día de Entrenamiento</h4>
               <p className="text-xs text-orange-700">Aumenta ligeramente carbohidratos y calorías.</p>
             </div>
             <button onClick={() => setIsTrainingDay(!isTrainingDay)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isTrainingDay ? 'bg-orange-600' : 'bg-slate-300'}`}>
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isTrainingDay ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
           </div>
         </div>
       </div>

       {/* Widget de Comidas Guardadas */}
       {savedMeals.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                <Star size={20} />
              </div>
              <div>
                <h4 className="font-bold text-yellow-900 text-sm">Comidas Fijadas ({savedMeals.length})</h4>
                <p className="text-yellow-700 text-xs">Estas comidas se incluirán en tu próximo plan.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {savedMeals.map((m, i) => (
                <span key={`saved-${i}`} className="bg-white px-2 py-1 border border-yellow-300 rounded-md text-yellow-800 flex items-center gap-1">
                  {m.title}
                  <button onClick={() => setSavedMeals(savedMeals.filter((_, idx) => idx !== i))} className="hover:text-red-500 font-bold ml-1">×</button>
                </span>
              ))}
            </div>
          </div>
       )}

       {/* Recordatorio de Suplementos */}
       <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-200 p-2 rounded-lg text-blue-700">
              <Dumbbell size={20} />
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm">Recordatorio de Suplementos</h4>
              <p className="text-blue-700 text-xs">Creatina (5g diarios recomendados)</p>
            </div>
          </div>
          <button 
            onClick={() => setCreatineTaken(!creatineTaken)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              creatineTaken ? 'bg-green-500 text-white' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            {creatineTaken ? <CheckCircle2 size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-blue-400"></div>}
            {creatineTaken ? 'Tomada' : 'Marcar como tomada'}
          </button>
       </div>

       {loading && (
          <div className="flex flex-col items-center justify-center p-12 text-green-600">
            <RefreshCw className="animate-spin mb-4" size={48} />
            <p className="font-medium animate-pulse text-center">Planificando tu menú...<br/>{planType === 'Semanal' && <span className="text-sm opacity-80">Un plan de 7 días puede tomar unos segundos extras.</span>}</p>
          </div>
       )}

       {plan && !loading && (
         <div className="space-y-8">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-green-900 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">Resumen del Plan</h3>
                <div className="flex flex-wrap gap-2 text-sm font-bold justify-end">
                  <span className="bg-white px-3 py-1 rounded-full shadow-sm">🔥 ~{plan.totalCalories}/día</span>
                  <span className="bg-white px-3 py-1 rounded-full shadow-sm text-blue-600">🥩 ~{plan.totalProtein} Prot</span>
                  {plan.totalFiber && <span className="bg-white px-3 py-1 rounded-full shadow-sm text-green-600">🌿 ~{plan.totalFiber} Fibra</span>}
                </div>
              </div>
              <p className="opacity-90 text-sm">{plan.summary}</p>
            </div>

            {/* Selector de Días (Calendario Horizontal) */}
            {plan.days && plan.days.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar snap-x">
                {plan.days.map((day, idx) => (
                  <button 
                    key={`day-${idx}`}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`snap-start shrink-0 px-5 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      selectedDayIdx === idx 
                        ? 'bg-orange-600 text-white shadow-md' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50'
                    }`}
                  >
                    <Calendar size={18} />
                    {day.dayName}
                  </button>
                ))}
              </div>
            )}

            {/* Renderizado de Comidas (Solo muestra el día seleccionado) */}
            {plan.days && plan.days[selectedDayIdx] && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                  <Calendar className="text-orange-500" size={20} /> {plan.days[selectedDayIdx].dayName}
                </h3>
                
                <div className="grid gap-4">
                  {plan.days[selectedDayIdx].meals.map((meal, mIdx) => (
                    <div key={`meal-${mIdx}`} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative">
                      <div className="flex justify-between items-center mb-4">
                        <div className="bg-orange-100 px-3 py-1 rounded-xl text-orange-700 font-bold inline-block text-sm">
                          {meal.type}
                        </div>
                        <button 
                          onClick={() => setSwappingData({ dayIdx: selectedDayIdx, mealIdx: mIdx, currentMealName: meal.options?.[0]?.name || 'Comida' })}
                          className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Cambiar
                        </button>
                      </div>

                      {/* Modal/Input para Swap en línea */}
                      {swappingData?.dayIdx === selectedDayIdx && swappingData?.mealIdx === mIdx && (
                        <div className="mb-4 bg-orange-50 p-4 rounded-xl border border-orange-200 animate-in slide-in-from-top-2">
                          <label className="block text-sm font-bold text-orange-900 mb-2">¿Por qué quieres cambiar este plato?</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={customSwapRequest}
                              onChange={e => setCustomSwapRequest(e.target.value)}
                              placeholder="Ej: Quiero algo más liviano, sin huevos, muy rápido..."
                              className="flex-1 p-2 rounded-lg border border-orange-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                            />
                            <button 
                              onClick={handleSwapMeal}
                              disabled={isSwapping || !customSwapRequest.trim()}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                            >
                              {isSwapping ? <RefreshCw className="animate-spin" size={16} /> : 'Generar'}
                            </button>
                            <button onClick={() => setSwappingData(null)} className="p-2 text-slate-400 hover:text-red-500">
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {meal.options && meal.options.map((opt, i) => (
                          <div key={`opt-${i}`} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-orange-300 transition-colors flex flex-col">
                            <h4 className="font-bold text-slate-800 flex justify-between items-start mb-1 gap-2">
                              {opt.name}
                              {meal.options.length > 1 && <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-md shrink-0">Opción {i + 1}</span>}
                            </h4>
                            <p className="text-slate-600 text-sm mb-4 flex-1">{opt.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="inline-block text-xs font-semibold bg-white border border-slate-100 text-slate-600 px-2 py-1 rounded-md shadow-sm">
                                🔥 {opt.calories}
                              </span>
                              <span className="inline-block text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                🥩 {opt.protein}
                              </span>
                              <span className="inline-block text-xs font-semibold bg-green-50 text-green-600 px-2 py-1 rounded-md">
                                🌿 {opt.fiber}
                              </span>
                            </div>
                            <button 
                              onClick={() => generateRecipeFromPlan(opt)}
                              className="w-full py-2 bg-white text-orange-600 border border-orange-200 font-semibold rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 mt-auto"
                            >
                              <ChefHat size={16} /> Ver Receta
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shopping List Generator */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              {!shoppingList && (
                <button
                  onClick={async () => {
                    if (!plan) return;
                    setLoadingList(true);
                    const prompt = `Basado en el siguiente plan de comidas: ${JSON.stringify(plan)}. 
                    Calcula las cantidades totales aproximadas necesarias de cada ingrediente para todo el plan y genera una lista de compras agrupada por categorías lógicas del supermercado. 
                    Si el perfil dice Modo Económico, sugiere comprar al por mayor o marcas blancas. 
                    Devuelve ÚNICAMENTE un JSON válido con este esquema: 
                    { "categories": [ { "name": "Categoría", "items": [ { "name": "Nombre del producto", "amount": "Cantidad total (ej: 500g, 1 kg, 2 unid)" } ] } ] }`;
                    try {
                      const result = await callGeminiAPI(prompt);
                      setShoppingList(result);
                    } catch (err) {
                      console.error(err);
                    } finally {
                      setLoadingList(false);
                    }
                  }}
                  disabled={loadingList}
                  className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 font-bold transition-all flex justify-center items-center gap-2"
                >
                  {loadingList ? <RefreshCw className="animate-spin" size={20} /> : <ShoppingCart size={20} />}
                  {loadingList ? 'Calculando cantidades...' : '✨ Generar Lista de Compras Inteligente'}
                </button>
              )}

              {shoppingList && shoppingList.categories && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 animate-in fade-in slide-in-from-bottom-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ShoppingCart className="text-orange-500" /> Lista del Súper
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {shoppingList.categories.map((cat, i) => (
                      <div key={`cat-${i}`} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">{cat.name}</h4>
                        <ul className="space-y-3">
                          {cat.items && cat.items.map((item, j) => (
                            <li key={`item-${j}`} className="flex justify-between items-start gap-2 text-slate-600 text-sm border-b border-slate-200/50 last:border-0 pb-2 last:pb-0">
                              <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0"></div>
                                <span className="leading-snug">{typeof item === 'string' ? item : (item.name || item.producto || item.item || 'Ingrediente')}</span>
                              </div>
                              {typeof item !== 'string' && (item.amount || item.cantidad) && (
                                <span className="font-semibold text-slate-700 whitespace-nowrap text-right bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-100">
                                  {item.amount || item.cantidad}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
         </div>
       )}
    </div>
  );
}

// --- COMPONENTES COMPARTIDOS ---

function RecipeCard({ recipe, profile, setProfile, savedMeals, setSavedMeals, favoriteRecipes, setFavoriteRecipes, interestedRecipes, setInterestedRecipes }) {
  const [chefQuestion, setChefQuestion] = useState('');
  const [chefAnswer, setChefAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); // 'like' | 'dislike'
  const [feedbackReason, setFeedbackReason] = useState('');

  // Estados de Guardado
  const isSavedForPlan = savedMeals && savedMeals.some(m => m.title === recipe.title);
  const isFavorite = favoriteRecipes && favoriteRecipes.some(r => r.title === recipe.title);
  const isInterested = interestedRecipes && interestedRecipes.some(r => r.title === recipe.title);
  
  const toggleSaveForPlan = () => {
    if (isSavedForPlan) setSavedMeals(savedMeals.filter(m => m.title !== recipe.title));
    else setSavedMeals([...(savedMeals || []), { title: recipe.title, calories: recipe.macros?.calories }]);
  };

  const toggleFavorite = () => {
    if (isFavorite) setFavoriteRecipes(favoriteRecipes.filter(r => r.title !== recipe.title));
    else {
      setFavoriteRecipes([...(favoriteRecipes || []), recipe]);
      if (isInterested) setInterestedRecipes(interestedRecipes.filter(r => r.title !== recipe.title));
    }
  };

  const toggleInterested = () => {
    if (isInterested) setInterestedRecipes(interestedRecipes.filter(r => r.title !== recipe.title));
    else {
      setInterestedRecipes([...(interestedRecipes || []), recipe]);
      if (isFavorite) setFavoriteRecipes(favoriteRecipes.filter(r => r.title !== recipe.title));
    }
  };

  const askChef = async () => {
    if (!chefQuestion.trim()) return;
    setAsking(true);
    const prompt = `El usuario está cocinando esta receta: "${recipe.title}". Ingredientes: ${recipe.ingredients ? recipe.ingredients.map(i => i.name).join(', ') : 'Desconocidos'}. Pregunta del usuario sobre el plato: "${chefQuestion}". Responde de forma concisa, útil y amable en un solo párrafo corto, asumiendo el rol de un chef experto.`;
    
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      setChefAnswer(data.candidates?.[0]?.content?.parts?.[0]?.text || "No tengo una respuesta para eso ahora.");
    } catch (err) {
      console.error(err);
      setChefAnswer("Hubo un error de conexión con el Chef IA.");
    } finally {
      setAsking(false);
      setChefQuestion('');
    }
  };

  const submitFeedback = () => {
    if (!feedbackReason.trim()) return;
    
    const prefix = feedbackType === 'like' ? 'Le encantó (buscar sabores parecidos): ' : 'Evitar/No le gustó: ';
    
    setProfile(prev => ({
      ...prev,
      learnedPreferences: [...prev.learnedPreferences, `${prefix} ${feedbackReason}`]
    }));
    
    setFeedbackGiven(true);
  };

  if (!recipe) return null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-orange-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera de Receta */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white relative">
        
        {/* Controles de Guardado Superiores */}
        <div className="absolute top-6 right-6 flex flex-col sm:flex-row gap-2">
          <button 
            onClick={toggleInterested}
            title="Me interesa para después"
            className={`p-2.5 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-sm ${
              isInterested ? 'bg-blue-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
            }`}
          >
            <Bookmark size={18} fill={isInterested ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={toggleFavorite}
            title="Marcar como Favorito"
            className={`p-2.5 rounded-full flex items-center justify-center transition-all shadow-md backdrop-blur-sm ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white border border-white/20'
            }`}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>

          <button 
            onClick={toggleSaveForPlan}
            className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1.5 transition-all shadow-md backdrop-blur-sm ${
              isSavedForPlan ? 'bg-yellow-400 text-yellow-900' : 'bg-black/20 hover:bg-black/30 text-white border border-white/20'
            }`}
          >
            <Star size={16} fill={isSavedForPlan ? "currentColor" : "none"} /> 
            <span className="hidden sm:inline">{isSavedForPlan ? 'Fijada en Plan' : 'Añadir a Plan'}</span>
          </button>
        </div>

        <div className="flex justify-between items-start mb-4 mt-8 sm:mt-0">
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            {recipe.cuisine || 'Receta Adaptada'}
          </span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-3 pr-24">{recipe.title}</h2>
        <p className="text-orange-50 text-lg opacity-90">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <div className="flex items-center gap-2 bg-black/10 px-4 py-2 rounded-xl backdrop-blur-sm">
            <Clock size={18} />
            <span className="font-medium">Prep: {recipe.prepTime || '?'} | Cocción: {recipe.cookTime || '?'}</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Ingredientes */}
          <div className="md:col-span-5 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Apple className="text-orange-500" /> Ingredientes
              </h3>
              <ul className="space-y-3">
                {recipe.ingredients && recipe.ingredients.map((ing, i) => (
                  <li key={`ing-${i}`} className="flex flex-col bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-800">{ing.name}</span>
                      <span className="text-sm text-slate-500 bg-white px-2 py-1 rounded-md shadow-sm">{ing.amount}</span>
                    </div>
                    {ing.substitute && (
                      <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded-lg flex gap-1 items-start">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>¿No tienes? Prueba con: <strong>{ing.substitute}</strong></span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Macros */}
            {recipe.macros && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">Información Nutricional</h4>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-slate-400">Cal</div>
                    <div className="font-bold text-slate-700 text-sm md:text-base truncate">{recipe.macros.calories || '-'}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-slate-400">Prot</div>
                    <div className="font-bold text-slate-700 text-sm md:text-base truncate">{recipe.macros.protein || '-'}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-slate-400">Carb</div>
                    <div className="font-bold text-slate-700 text-sm md:text-base truncate">{recipe.macros.carbs || '-'}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-slate-400">Grasa</div>
                    <div className="font-bold text-slate-700 text-sm md:text-base truncate">{recipe.macros.fat || '-'}</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col justify-center">
                    <div className="text-xs text-green-500">Fibra</div>
                    <div className="font-bold text-green-700 text-sm md:text-base truncate">{recipe.macros.fiber || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pasos */}
          <div className="md:col-span-7 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                <BookOpen className="text-orange-500" /> Preparación
              </h3>
              <div className="space-y-6">
                {recipe.steps && recipe.steps.map((step, i) => (
                  <div key={`step-${i}`} className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 leading-relaxed pt-1">{typeof step === 'string' ? step : (step.text || step.description || JSON.stringify(step))}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {recipe.tips && typeof recipe.tips === 'string' && (
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-3">
                <Info className="text-blue-500 shrink-0" />
                <p className="text-sm text-blue-900 leading-relaxed"><span className="font-bold">Tip del Chef: </span>{recipe.tips}</p>
              </div>
            )}

            {/* Módulo de Aprendizaje Activo (Post-Consumo) */}
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200 mt-8">
              <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                <RefreshCw size={18} /> ¿Ya preparaste y comiste esto?
              </h4>
              <p className="text-sm text-orange-700 mb-4">Danos tu opinión para que la IA siga aprendiendo de tus gustos y mejore futuras recetas.</p>
              
              {!feedbackGiven ? (
                !feedbackType ? (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setFeedbackType('like')}
                      className="px-4 py-3 bg-white border border-green-300 text-green-700 rounded-xl hover:bg-green-50 font-medium transition-colors flex-1 flex flex-col items-center gap-1 shadow-sm"
                    >
                      <ThumbsUp size={24} /> Me encantó
                    </button>
                    <button 
                      onClick={() => setFeedbackType('dislike')}
                      className="px-4 py-3 bg-white border border-red-300 text-red-700 rounded-xl hover:bg-red-50 font-medium transition-colors flex-1 flex flex-col items-center gap-1 shadow-sm"
                    >
                      <ThumbsDown size={24} /> No me gustó
                    </button>
                  </div>
                ) : (
                  <div className="animate-in slide-in-from-top-2">
                    <label className={`block text-sm font-bold mb-2 ${feedbackType === 'like' ? 'text-green-800' : 'text-red-800'}`}>
                      {feedbackType === 'like' ? '¡Genial! ¿Qué fue lo que más te gustó?' : '¡Lo sentimos! ¿Qué fue lo que no te gustó?'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input 
                        type="text" 
                        value={feedbackReason}
                        onChange={e => setFeedbackReason(e.target.value)}
                        placeholder={feedbackType === 'like' ? "Ej: El toque de ajo, la textura crocante..." : "Ej: Odié el sabor del coliflor, estaba muy seco..."}
                        className={`flex-1 p-3 rounded-xl border focus:ring-2 outline-none text-sm bg-white ${
                          feedbackType === 'like' ? 'border-green-200 focus:ring-green-500' : 'border-red-200 focus:ring-red-500'
                        }`}
                      />
                      <button 
                        onClick={submitFeedback}
                        disabled={!feedbackReason.trim()}
                        className={`px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-sm ${
                          feedbackType === 'like' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        Enseñar a la IA
                      </button>
                      <button 
                        onClick={() => {setFeedbackType(null); setFeedbackReason('');}}
                        className="p-3 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-xl"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-sm font-medium text-green-700 bg-green-100 p-4 rounded-xl flex items-center gap-2 border border-green-200 shadow-inner">
                  <CheckCircle2 size={18} /> ¡Perfecto! He guardado tu opinión en tu perfil para tenerlo en cuenta.
                </div>
              )}
            </div>

            {/* Asistente Culinario / Ask the Chef */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare size={18} className="text-orange-500" /> ✨ Pregúntale al Chef IA
              </h4>
              <p className="text-sm text-slate-500 mb-4">¿Dudas sobre un reemplazo? ¿Técnicas de preparación? ¡Consulta al chef para esta receta!</p>
              
              {chefAnswer && (
                <div className="mb-4 p-4 bg-orange-100 text-orange-900 rounded-xl text-sm border border-orange-200 animate-in fade-in">
                  <span className="font-bold block mb-1">👨‍🍳 Chef:</span>
                  {chefAnswer}
                </div>
              )}

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={chefQuestion}
                  onChange={e => setChefQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askChef()}
                  placeholder="Ej: ¿A cuántos grados precaliento el horno?"
                  className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-white"
                />
                <button 
                  onClick={askChef}
                  disabled={asking || !chefQuestion.trim()}
                  className="bg-slate-800 hover:bg-slate-900 text-white px-5 rounded-xl font-bold transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {asking ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// --- LÓGICA DE API GEMINI ---

async function callGeminiAPI(promptText) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("FALTA LA API KEY. Revisa que el archivo .env esté bien escrito.");
    throw new Error("API Key faltante");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: { 
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Detalle del error de Google:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) throw new Error("La IA no devolvió ningún texto.");
    
    // EL ANTÍDOTO: Limpiar cualquier formato de código que envíe Gemini antes de leerlo
    const cleanText = textResult.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("Fallo general en la conexión con la IA:", error);
    throw error;
  }
}

async function callGeminiVisionAPI(promptText, base64Image, mimeType) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ 
      role: "user",
      parts: [
        { text: promptText },
        { inlineData: { mimeType: mimeType, data: base64Image } }
      ] 
    }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

 if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // ESTA LÍNEA HARÁ QUE SALTE UN POP-UP EN TU PANTALLA
      alert("DIAGNÓSTICO DE GOOGLE:\n" + JSON.stringify(errorData, null, 2));
      console.error("Detalle del error de Google:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}