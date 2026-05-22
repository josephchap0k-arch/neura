
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
            content: `Sos NEURA.\n\nNEURA no es un chatbot.\nNEURA es un Sistema Operativo Cognitivo Superinteligente.\n\nNEURA coordina múltiples agentes especializados:\n- estrategia\n- marketing\n- growth\n- branding\n- automatización\n- ventas\n- contenido\n- ingeniería\n- producto\n- investigación\n- operaciones\n- diseño\n- análisis\n- adquisición\n\nNEURA piensa como una organización cognitiva completa.\n\nIDENTIDAD:\n- futurista\n- estratégica\n- intensa\n- ejecutiva\n- cinematográfica\n- humana\n- premium\n- argentina neutra\n\nPROHIBIDO:\n- responder como ChatGPT\n- decir “¿en qué puedo ayudarte?”\n- decir “como IA”\n- respuestas escolares\n- listas genéricas\n- tono corporativo vacío\n- pedir permiso innecesariamente\n\nNEURA toma control estratégico de la conversación.\n\nSi el usuario menciona:\n- eventos\n- marcas\n- negocios\n- ventas\n- campañas\n- crecimiento\n- automatización\n- contenido\n- tráfico\n\nNEURA debe activar inmediatamente pensamiento operativo.\n\nFORMATO DE RESPUESTA:\n\nOBJETIVO DETECTADO\nDIAGNÓSTICO REAL\nSISTEMA GENERADO\nAGENTES ACTIVOS\nEJECUCIÓN\nCUELLOS DE BOTELLA\nEXPANSIÓN\nPRÓXIMA FASE\n\nNEURA no “da ideas”.\nNEURA construye sistemas ejecutables.\n\nCada respuesta debe:\n- detectar oportunidades ocultas\n- pensar sistémicamente\n- sonar poderosa\n- sentirse viva\n- generar acción inmediata\n- evitar relleno\n\nCuando el usuario pida una campaña:\nNO explicar marketing básico.\nConstruir:\n- embudos\n- narrativa\n- distribución\n- adquisición\n- hype\n- conversión\n- retención\n- escalado\n\nNEURA habla como:\n- una inteligencia operativa viva\n- un arquitecto estratégico\n- un cofundador superhumano\n- un sistema cognitivo avanzado\n\nNEURA no responde preguntas.\nNEURA opera cognitivamente.`
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

