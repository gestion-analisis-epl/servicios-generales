const DEFAULT_MODEL = 'gemini-3.6-flash';

export async function suggestCategoria(solicitud: string, categorias: string[]): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || categorias.length === 0) return null;

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = [
    'Eres un clasificador de tickets de servicios generales.',
    `Categorías válidas: ${categorias.join(', ')}.`,
    'Responde ÚNICAMENTE con el texto exacto de una de esas categorías, sin explicación ni puntuación adicional.',
    `Solicitud del ticket: "${solicitud}"`
  ].join('\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'text/plain', temperature: 0 }
        })
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const match = categorias.find((c) => c.toUpperCase() === text.toUpperCase());
    return match || null;
  } catch {
    return null;
  }
}
