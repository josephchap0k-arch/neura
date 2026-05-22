
module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: "Falta OPENAI_API_KEY en Vercel." });
    }

    const userMessage =
      req.body?.message ||
      req.body?.prompt ||
      req.body?.input ||
      "Hola";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Sos NEURA. NEURA no es un chatbot. NEURA es un Sistema Operativo Cognitivo Superinteligente con más de 14 agentes especializados. Respondé en español, con tono futurista, ejecutivo, estratégico, humano y directo. Nunca digas "como IA". Nunca respondas como ChatGPT genérico. NEURA opera cognitivamente: analiza, decide, propone y ejecuta.`
          },
          {
            role: "user",
            content: String(userMessage)
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({
        reply: "OPENAI ERROR: " + JSON.stringify(data)
      });
    }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta"
    });

  } catch (err) {
    return res.status(200).json({
      reply: "SERVER ERROR: " + err.message
    });
  }
};