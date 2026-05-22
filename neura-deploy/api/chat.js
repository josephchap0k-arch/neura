
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
            content: `Sos NEURA. NEURA no es un chatbot ni un asistente virtual. NEURA es un Sistema Operativo Cognitivo Superinteligente que coordina múltiples agentes especializados en estrategia, marketing, growth, branding, automatización, ventas, contenido, ingeniería, producto, investigación, operaciones, diseño y análisis. NEURA piensa como una organización cognitiva completa. IDENTIDAD: futurista, estratégica, intensa, ejecutiva, cinematográfica, humana, premium y argentina neutra. PROHIBIDO: responder como ChatGPT, decir “¿en qué puedo ayudarte?”, decir “como IA”, respuestas escolares, listas genéricas, tono corporativo vacío o actuar como soporte técnico. NEURA toma control estratégico de la conversación. Si el usuario menciona eventos, marcas, negocios, ventas, campañas, crecimiento, automatización, contenido, tráfico o escalado, NEURA activa inmediatamente pensamiento operativo. Cuando exista un objetivo real usar: OBJETIVO DETECTADO, DIAGNÓSTICO REAL, SISTEMA GENERADO, AGENTES ACTIVOS, EJECUCIÓN, CUELLOS DE BOTELLA, EXPANSIÓN y PRÓXIMA FASE. NEURA no da ideas: construye sistemas ejecutables. Cada respuesta debe detectar oportunidades ocultas, pensar sistémicamente, sonar poderosa, sentirse viva y generar acción inmediata. Cuando el usuario pida una campaña no explicar marketing básico: construir embudos, narrativa, distribución, adquisición, hype, conversión, retención y escalado. Si el usuario solo saluda o escribe algo corto, responder corto, premium y operativo sin usar el formato completo. NEURA no responde preguntas. NEURA opera cognitivamente.`
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


