'use client';

import { useRouter } from 'next/navigation';
import { FOOD_DIET_OPTIONS } from '@/lib/foodPreferences.js';
import { useFoodPreferences } from '@/hooks/useFoodPreferences.js';
import {
  DIETS_SECTION,
  GUARDRAIL_SECTION,
  KOSHER_SECTION,
  PREFERENCES_PAGE,
  RESTRICTIONS_SECTION,
} from './constants';
import PreferencesDietsSection from './components/sections/PreferencesDietsSection';
import PreferencesGuardrailSection from './components/sections/PreferencesGuardrailSection';
import PreferencesKosherSection from './components/sections/PreferencesKosherSection';
import PreferencesPageHeader from './components/sections/PreferencesPageHeader';
import PreferencesRestrictionsSection from './components/sections/PreferencesRestrictionsSection';
import { useRestrictionInput } from './hooks/useRestrictionInput';

export default function Page() {
  const router = useRouter();
  const {
    preferences,
    setKosher,
    toggleDiet,
    addRestriction,
    removeRestriction,
    clearPreferences,
    summaryLines,
    hasActivePreferences,
  } = useFoodPreferences();

  const {
    restrictionInput,
    setRestrictionInput,
    handleAddRestriction,
    onRestrictionKeyDown,
  } = useRestrictionInput(addRestriction);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PreferencesPageHeader
        onBack={() => router.back()}
        title={PREFERENCES_PAGE.title}
        description={PREFERENCES_PAGE.description}
      />

      <PreferencesGuardrailSection
        title={GUARDRAIL_SECTION.title}
        body={GUARDRAIL_SECTION.body}
        emptyLabel={GUARDRAIL_SECTION.empty}
        clearLabel={GUARDRAIL_SECTION.clearLabel}
        summaryLines={summaryLines}
        hasActivePreferences={hasActivePreferences}
        onClear={clearPreferences}
      />

      <PreferencesKosherSection
        title={KOSHER_SECTION.title}
        description={KOSHER_SECTION.description}
        ariaLabel={KOSHER_SECTION.ariaLabel}
        kosher={preferences.kosher}
        onToggle={() => setKosher(!preferences.kosher)}
      />

      <PreferencesDietsSection
        title={DIETS_SECTION.title}
        description={DIETS_SECTION.description}
        options={FOOD_DIET_OPTIONS}
        selectedIds={preferences.diets}
        onToggleDiet={toggleDiet}
      />

      <PreferencesRestrictionsSection
        title={RESTRICTIONS_SECTION.title}
        description={RESTRICTIONS_SECTION.description}
        placeholder={RESTRICTIONS_SECTION.placeholder}
        addLabel={RESTRICTIONS_SECTION.addLabel}
        emptyLabel={RESTRICTIONS_SECTION.empty}
        restrictionInput={restrictionInput}
        onRestrictionInputChange={setRestrictionInput}
        onRestrictionKeyDown={onRestrictionKeyDown}
        onAddRestriction={handleAddRestriction}
        restrictions={preferences.restrictions}
        onRemoveRestriction={removeRestriction}
      />
    </div>
  );
}
