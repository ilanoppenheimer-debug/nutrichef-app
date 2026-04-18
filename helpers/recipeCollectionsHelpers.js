export function isRecipeInCollection(collection = [], recipeTitle = '') {
  return collection.some((item) => item.title === recipeTitle);
}

export function removeRecipeFromCollection(collection = [], recipeTitle = '') {
  return collection.filter((item) => item.title !== recipeTitle);
}

export function addRecipeToCollection(collection = [], recipe) {
  return [...collection, recipe];
}
