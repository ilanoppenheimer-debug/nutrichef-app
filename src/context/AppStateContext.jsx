import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, limit,
} from 'firebase/firestore';
import { AppStateContext } from './appState.js';
import { db } from '../lib/firebase.js';
import { useAuth } from './AuthContext.jsx';
import { readStoredJson, writeStoredJson } from '../lib/gemini.js';

export const DEFAULT_PROFILE = {
  weight: '', height: '', age: '', gender: 'Femenino',
  activityLevel: '1.2',
  // Deporte
  sportType: 'Ninguno',
  trainingDuration: '60',
  trainingDaysPerWeek: '3',
  // Localización
  country: 'Chile',
  language: 'es',
  // Macros
  dailyCalories: '', manualCalories: false,
  proteinTarget: '', manualProtein: false,
  fiberTarget: '', manualFiber: false,
  carbTarget: '', manualCarb: false,
  useProteinPowder: false, budgetFriendly: false,
  goals: 'Mantenimiento y energia',
  dietaryStyle: 'Ninguna', religiousDiet: 'Ninguna',
  allergies: [], dislikes: [], learnedPreferences: [],
  preferredSupermarket: '',
};

// Comprueba si el perfil tiene los datos mínimos para funcionar bien
export function isProfileComplete(profile) {
  return Boolean(profile.weight && profile.height && profile.age && profile.goals);
}

function useFirestoreSync(uid, key, value, ready) {
  useEffect(() => {
    if (!uid || !ready) return;
    const timer = setTimeout(() => {
      setDoc(doc(db, 'users', uid), { [key]: value }, { merge: true });
    }, 800);
    return () => clearTimeout(timer);
  }, [uid, key, value, ready]);
}

export function AppStateProvider({ children }) {
  const { user, isLocalMode } = useAuth();
  const uid = user?.uid ?? null;

  const [plan, setPlan] = useState(null);
  const [savedMeals, setSavedMeals] = useState([]);
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [interestedRecipes, setInterestedRecipes] = useState([]);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [generatedRecipes, setGeneratedRecipes] = useState([]); // historial IA
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [firestoreReady, setFirestoreReady] = useState(false);

  // ── Carga inicial ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLocalMode) {
      setProfile({ ...DEFAULT_PROFILE, ...readStoredJson('nutrichef_profile', DEFAULT_PROFILE) });
      setFavoriteRecipes(readStoredJson('nutrichef_favs', []));
      setInterestedRecipes(readStoredJson('nutrichef_interested', []));
      setSavedRecipes(readStoredJson('nutrichef_saved_recipes', []));
      setGeneratedRecipes(readStoredJson('nutrichef_generated', []));
      setFirestoreReady(true);
      return;
    }

    if (!uid) { setFirestoreReady(false); return; }

    setFirestoreReady(false);
    getDoc(doc(db, 'users', uid)).then(async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.profile) setProfile({ ...DEFAULT_PROFILE, ...data.profile });
        if (data.favoriteRecipes) setFavoriteRecipes(data.favoriteRecipes);
        if (data.interestedRecipes) setInterestedRecipes(data.interestedRecipes);
        if (data.savedRecipes) setSavedRecipes(data.savedRecipes);
        if (data.plan) setPlan(data.plan);
        if (data.savedMeals) setSavedMeals(data.savedMeals);
      } else {
        // Usuario nuevo: migrar localStorage
        const lp = readStoredJson('nutrichef_profile', null);
        if (lp) setProfile({ ...DEFAULT_PROFILE, ...lp });
        const lf = readStoredJson('nutrichef_favs', []);
        if (lf.length) setFavoriteRecipes(lf);
        const li = readStoredJson('nutrichef_interested', []);
        if (li.length) setInterestedRecipes(li);
        const lsr = readStoredJson('nutrichef_saved_recipes', []);
        if (lsr.length) setSavedRecipes(lsr);
      }

      // Cargar historial de recetas generadas (subcolección separada)
      try {
        const q = query(
          collection(db, 'users', uid, 'generatedRecipes'),
          orderBy('generatedAt', 'desc'),
          limit(50)
        );
        const snap2 = await getDocs(q);
        setGeneratedRecipes(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (_) { /* subcolección vacía */ }

      setFirestoreReady(true);
    });
  }, [uid, isLocalMode]);

  // ── Sync Firestore ───────────────────────────────────────────────────────────
  const syncReady = firestoreReady && !isLocalMode;
  useFirestoreSync(uid, 'profile', profile, syncReady);
  useFirestoreSync(uid, 'favoriteRecipes', favoriteRecipes, syncReady);
  useFirestoreSync(uid, 'interestedRecipes', interestedRecipes, syncReady);
  useFirestoreSync(uid, 'savedRecipes', savedRecipes, syncReady);
  useFirestoreSync(uid, 'plan', plan, syncReady);
  useFirestoreSync(uid, 'savedMeals', savedMeals, syncReady);

  // ── Sync localStorage (modo local) ──────────────────────────────────────────
  useEffect(() => { if (isLocalMode && firestoreReady) writeStoredJson('nutrichef_profile', profile); }, [profile, isLocalMode, firestoreReady]);
  useEffect(() => { if (isLocalMode && firestoreReady) writeStoredJson('nutrichef_favs', favoriteRecipes); }, [favoriteRecipes, isLocalMode, firestoreReady]);
  useEffect(() => { if (isLocalMode && firestoreReady) writeStoredJson('nutrichef_interested', interestedRecipes); }, [interestedRecipes, isLocalMode, firestoreReady]);
  useEffect(() => { if (isLocalMode && firestoreReady) writeStoredJson('nutrichef_saved_recipes', savedRecipes); }, [savedRecipes, isLocalMode, firestoreReady]);
  useEffect(() => { if (isLocalMode && firestoreReady) writeStoredJson('nutrichef_generated', generatedRecipes.slice(0, 50)); }, [generatedRecipes, isLocalMode, firestoreReady]);

  // ── saveGeneratedRecipe: guarda automáticamente cada receta IA ───────────────
  const saveGeneratedRecipe = useCallback(async (recipe) => {
    if (!recipe?.title) return;

    const entry = {
      ...recipe,
      generatedAt: new Date().toISOString(),
    };

    // Evitar duplicados por título
    setGeneratedRecipes(prev => {
      if (prev.some(r => r.title === recipe.title)) return prev;
      return [entry, ...prev];
    });

    if (uid && !isLocalMode) {
      try {
        await addDoc(collection(db, 'users', uid, 'generatedRecipes'), entry);
      } catch (err) {
        console.error('Error guardando receta generada:', err);
      }
    }
  }, [uid, isLocalMode]);

  const value = useMemo(() => ({
    plan, setPlan,
    savedMeals, setSavedMeals,
    favoriteRecipes, setFavoriteRecipes,
    interestedRecipes, setInterestedRecipes,
    savedRecipes, setSavedRecipes,
    generatedRecipes,
    saveGeneratedRecipe,
    profile, setProfile,
    firestoreReady,
  }), [plan, savedMeals, favoriteRecipes, interestedRecipes, savedRecipes, generatedRecipes, saveGeneratedRecipe, profile, firestoreReady]);

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}
