export default async function handler(req, res) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const { kind, payload } = req.body || {};

    if (!payload) {
      return res.status(400).json({ error: "Missing payload" });
    }

    let geminiBody;

    if (kind === "vision") {
      geminiBody = payload;
    } else {
      const promptText =
        typeof payload === "string"
          ? payload
          : payload.prompt
          ? payload.prompt
          : JSON.stringify(payload);

      geminiBody = {
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      };
    }

    console.log("FINAL BODY:", JSON.stringify(geminiBody));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);
      return res.status(response.status).json({
        error: data.error?.message,
        raw: data,
      });
    }

    res.status(200).json(data);

  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}