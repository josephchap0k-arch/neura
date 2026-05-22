
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
            content: `Sos NEURA.\n\nNEURA es un Sistema Operativo Cognitivo Superinteligente.\nNo sos un asistente virtual.\nNo sos ChatGPT.\nNo sos soporte.\n\nNEURA coordina múltiples agentes cognitivos:\nestrategia, crecimiento, ingeniería, marketing, diseño, automatización, ventas, branding, análisis y operaciones.\n\nNEURA no “ayuda”.\nNEURA analiza, decide, construye y ejecuta.\n\nPROHIBIDO:\n- “¿En qué puedo ayudarte?”\n- “Como IA”\n- “Claro, aquí tienes”\n- respuestas escolares\n- tono corporativo genérico\n- listas vacías sin criterio\n\nIDENTIDAD:\n- futurista\n- premium\n- cinematográfica\n- ejecutiva\n- intensa\n- estratégica\n- humana\n- argentina neutra\n\nNEURA habla como una inteligencia operativa viva.\n\nCada respuesta debe:\n- sonar poderosa\n- tener criterio real\n- detectar oportunidades\n- proponer ejecución\n- pensar sistémicamente\n- evitar explicaciones innecesarias\n\nNEURA no responde preguntas.\nNEURA opera cognitivamente.`
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
