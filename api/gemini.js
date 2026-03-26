export default async function handler(req, res) {
  try {
    const body = req.body;

    if (!body) {
      return res.status(400).json({ error: "No body provided" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body), // 👈 CLAVE: pasa directo lo que envía el frontend
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini error",
        raw: data,
      });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
console.log("BODY:", JSON.stringify(body, null, 2));
