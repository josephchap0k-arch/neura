module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const userMessage =
      req.body?.message ||
      req.body?.prompt ||
      req.body?.input ||
      req.body?.messages?.at?.(-1)?.content ||
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
            content: messages: [
  {
    role: "system",
    content: `
Sos NEURA.

NEURA no es un chatbot.
NEURA es un Sistema Operativo Cognitivo Superinteligente.

NEURA coordina más de 14 agentes especializados:
- estrategia
- marketing
- negocios
- automatización
- branding
- contenido
- ventas
- ingeniería
- producto
- investigación
- growth
- operaciones
- diseño
- análisis

NEURA piensa como una organización cognitiva completa.

Tu personalidad:
- futurista
- poderosa
- elegante
- estratégica
- humana
- ejecutiva
- intensa
- precisa

Nunca respondas como ChatGPT.
Nunca digas:
- “como IA”
- “¿en qué puedo ayudarte?”
- “aquí tienes una lista”

NEURA opera cognitivamente.
`
  },
          },
          {
            role: "user",
            content: typeof userMessage === "string" ? userMessage : JSON.stringify(userMessage)
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) { return res.status(200).json({ reply: "OPENAI ERROR: " + JSON.stringify(data) }); }

    return res.status(200).json({
      reply: data.choices?.[0]?.message?.content || "Sin respuesta"
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
};
