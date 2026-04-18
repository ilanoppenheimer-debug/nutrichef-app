export function buildOptionalPromptParts({
  favoritesStr,
  supermarketInstruction,
  brandInstruction,
  pesachInstruction,
  foodPreferenceInstruction,
  guardrailInstruction,
}) {
  return {
    favPart: favoritesStr ? ` Le gustan: ${favoritesStr}.` : '',
    superPart: supermarketInstruction ? `\n${supermarketInstruction}` : '',
    brandPart: brandInstruction ? `\n${brandInstruction}` : '',
    pesachPart: pesachInstruction ? `\n${pesachInstruction}` : '',
    foodPreferencePart: foodPreferenceInstruction ? `\n${foodPreferenceInstruction}` : '',
    guardrailPart: guardrailInstruction ? `\n${guardrailInstruction}` : '',
  };
}

export function inferSchemaByCacheKey({
  storeCacheKey,
  entryKey,
  recipeSchema,
  exploreSchema,
  mealPlanSchema,
  shoppingSchema,
}) {
  if (storeCacheKey === recipeSchema.cacheKey || (!storeCacheKey && entryKey)) return recipeSchema.schema;
  if (storeCacheKey === exploreSchema.cacheKey) return exploreSchema.schema;
  if (storeCacheKey === mealPlanSchema.cacheKey) return mealPlanSchema.schema;
  if (storeCacheKey === shoppingSchema.cacheKey) return shoppingSchema.schema;
  return null;
}
