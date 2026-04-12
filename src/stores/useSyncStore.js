import { useEffect, useRef } from 'react';
import {
  collection, doc, getDoc, getDocs, setDoc,
  query, orderBy, limit,
} from 'firebase/firestore';
import { db } from '@/services/firebase.js';
import { useAuth } from '../context/AuthContext.jsx';
import { readStoredJson, writeStoredJson } from '@/services/gemini.js';
import { useProfileStore, DEFAULT_PROFILE } from './useProfileStore.js';
import { useCollectionsStore } from './useCollectionsStore.js';

// ── Debounced Firestore field writer ────────────────────────────────────────

function createDebouncedSync(uid, key, delayMs = 800) {
  let timer = null;
  return {
    sync(value) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setDoc(doc(db, 'users', uid), { [key]: value }, { merge: true });
      }, delayMs);
    },
    stop() {
      clearTimeout(timer);
    },
  };
}

// ── Sync hook — mount once in App.jsx ───────────────────────────────────────

export function useSyncStore() {
  const { user, isLocalMode } = useAuth();
  const uid = user?.uid ?? null;
  const unsubsRef = useRef([]);

  useEffect(() => {
    const profileStore = useProfileStore;
    const collectionsStore = useCollectionsStore;

    // ── Cleanup previous subscriptions ─────────────────────────────────
    unsubsRef.current.forEach((fn) => fn());
    unsubsRef.current = [];

    // ── LOCAL MODE ─────────────────────────────────────────────────────
    if (isLocalMode) {
      profileStore.getState().setProfile({
        ...DEFAULT_PROFILE,
        ...readStoredJson('nutrichef_profile', DEFAULT_PROFILE),
      });

      const cs = collectionsStore.getState();
      cs.setFavoriteRecipes(readStoredJson('nutrichef_favs', []));
      cs.setInterestedRecipes(readStoredJson('nutrichef_interested', []));
      cs.setSavedRecipes(readStoredJson('nutrichef_saved_recipes', []));
      cs.setGeneratedRecipes(readStoredJson('nutrichef_generated', []));

      profileStore.getState().setFirestoreReady(true);

      // Subscribe to changes → write localStorage
      const unsub1 = profileStore.subscribe(
        (state) => state.profile,
        (profile) => {
          if (profileStore.getState().firestoreReady) {
            writeStoredJson('nutrichef_profile', profile);
          }
        },
      );

      const localKeys = [
        ['favoriteRecipes', 'nutrichef_favs'],
        ['interestedRecipes', 'nutrichef_interested'],
        ['savedRecipes', 'nutrichef_saved_recipes'],
      ];
      const collUnsubs = localKeys.map(([field, lsKey]) =>
        collectionsStore.subscribe(
          (state) => state[field],
          (val) => {
            if (profileStore.getState().firestoreReady) writeStoredJson(lsKey, val);
          },
        ),
      );

      const unsubGen = collectionsStore.subscribe(
        (state) => state.generatedRecipes,
        (val) => {
          if (profileStore.getState().firestoreReady) {
            writeStoredJson('nutrichef_generated', val.slice(0, 50));
          }
        },
      );

      unsubsRef.current = [unsub1, ...collUnsubs, unsubGen];
      return;
    }

    // ── NO AUTH YET ────────────────────────────────────────────────────
    if (!uid) {
      profileStore.getState().setFirestoreReady(false);
      return;
    }

    // ── FIRESTORE MODE ─────────────────────────────────────────────────
    profileStore.getState().setFirestoreReady(false);

    getDoc(doc(db, 'users', uid)).then(async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.profile) profileStore.getState().setProfile({ ...DEFAULT_PROFILE, ...data.profile });
        if (data.favoriteRecipes) collectionsStore.getState().setFavoriteRecipes(data.favoriteRecipes);
        if (data.interestedRecipes) collectionsStore.getState().setInterestedRecipes(data.interestedRecipes);
        if (data.savedRecipes) collectionsStore.getState().setSavedRecipes(data.savedRecipes);
        if (data.plan) collectionsStore.getState().setPlan(data.plan);
        if (data.savedMeals) collectionsStore.getState().setSavedMeals(data.savedMeals);
      } else {
        // New user: migrate from localStorage
        const lp = readStoredJson('nutrichef_profile', null);
        if (lp) profileStore.getState().setProfile({ ...DEFAULT_PROFILE, ...lp });
        const lf = readStoredJson('nutrichef_favs', []);
        if (lf.length) collectionsStore.getState().setFavoriteRecipes(lf);
        const li = readStoredJson('nutrichef_interested', []);
        if (li.length) collectionsStore.getState().setInterestedRecipes(li);
        const lsr = readStoredJson('nutrichef_saved_recipes', []);
        if (lsr.length) collectionsStore.getState().setSavedRecipes(lsr);
      }

      // Load generated recipes subcollection
      try {
        const q = query(
          collection(db, 'users', uid, 'generatedRecipes'),
          orderBy('generatedAt', 'desc'),
          limit(50),
        );
        const snap2 = await getDocs(q);
        collectionsStore.getState().setGeneratedRecipes(
          snap2.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      } catch (_) { /* empty subcollection */ }

      profileStore.getState().setFirestoreReady(true);

      // ── Subscribe to changes → debounced Firestore writes ──────────
      const syncers = {
        profile: createDebouncedSync(uid, 'profile'),
        favoriteRecipes: createDebouncedSync(uid, 'favoriteRecipes'),
        interestedRecipes: createDebouncedSync(uid, 'interestedRecipes'),
        savedRecipes: createDebouncedSync(uid, 'savedRecipes'),
        plan: createDebouncedSync(uid, 'plan'),
        savedMeals: createDebouncedSync(uid, 'savedMeals'),
      };

      const unsub1 = profileStore.subscribe(
        (state) => state.profile,
        (profile) => {
          if (profileStore.getState().firestoreReady) syncers.profile.sync(profile);
        },
      );

      const firestoreFields = ['favoriteRecipes', 'interestedRecipes', 'savedRecipes', 'plan', 'savedMeals'];
      const collUnsubs = firestoreFields.map((field) =>
        collectionsStore.subscribe(
          (state) => state[field],
          (val) => {
            if (profileStore.getState().firestoreReady) syncers[field].sync(val);
          },
        ),
      );

      unsubsRef.current = [
        unsub1,
        ...collUnsubs,
        () => Object.values(syncers).forEach((s) => s.stop()),
      ];
    });

    // ── Cleanup on auth change ──────────────────────────────────────────
    return () => {
      unsubsRef.current.forEach((fn) => fn());
      unsubsRef.current = [];
    };
  }, [uid, isLocalMode]);
}
