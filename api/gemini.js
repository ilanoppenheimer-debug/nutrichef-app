export default async function handler(req, res) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    // El cliente ya envía el body en formato Gemini válido dentro de `payload`.
    // Solo lo re-enviamos tal cual, sin re-envolver.
    const { payload } = req.body || {};

    if (!payload) {
      return res.status(400).json({ error: "Missing payload" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("GEMINI ERROR:", JSON.stringify(data));
      return res.status(response.status).json({
        error: data.error?.message,
        raw: data,
      });
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("SERVER ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}