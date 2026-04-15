import { useEffect } from 'react';
import { calculateTDEE } from '../lib/gemini.js';

export function useProfileMacrosAutoSync(profile, setProfile) {
  useEffect(() => {
    if (profile.manualCalories && profile.manualProtein && profile.manualFiber && profile.manualCarb) return;
    if (!profile.weight || !profile.height || !profile.age) return;

    const macros = calculateTDEE(profile);
    if (!macros) return;

    setProfile((prev) => ({
      ...prev,
      ...(!prev.manualCalories && { dailyCalories: macros.calories.toString() }),
      ...(!prev.manualProtein && { proteinTarget: macros.protein.toString() }),
      ...(!prev.manualFiber && { fiberTarget: macros.fiber.toString() }),
      ...(!prev.manualCarb && { carbTarget: macros.carbs.toString() }),
    }));
  }, [
    profile.weight,
    profile.height,
    profile.age,
    profile.gender,
    profile.activityLevel,
    profile.goals,
    profile.sportType,
    profile.trainingDuration,
    profile.trainingDaysPerWeek,
    profile.manualCalories,
    profile.manualProtein,
    profile.manualFiber,
    profile.manualCarb,
    setProfile,
  ]);
}
