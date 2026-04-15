export async function askChefAboutRecipe({ recipeTitle, ingredientNames, question }) {
  const prompt = `Cocinando: "${recipeTitle}". Ingredientes: ${ingredientNames || 'N/A'}. Pregunta: "${question}". Responde en un párrafo corto como chef experto. Solo texto.`;

  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kind: 'text',
      payload: {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 },
      },
    }),
  });

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
}
