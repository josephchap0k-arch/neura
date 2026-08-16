// api/chat.js Ã¢â‚¬â€ NEURA AI Gateway v3 with refined output validator
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { messages = [], system = '', model = 'auto', stream: doStream = true } = body || {};

  const P = {
    claude:   { key: process.env.ANTHROPIC_API_KEY,  model: 'claude-haiku-4-5-20251001', name: 'Claude'   },
    gpt:      { key: process.env.OPENAI_API_KEY,      model: 'gpt-4o-mini',               name: 'GPT'      },
    gemini:   { key: process.env.GEMINI_API_KEY,      model: 'gemini-2.0-flash',           name: 'Gemini'   },
    grok:     { key: process.env.GROK_API_KEY,        model: 'grok-3-mini',                name: 'Grok'     },
    deepseek: { key: process.env.DEEPSEEK_API_KEY,    model: 'deepseek-chat',              name: 'DeepSeek' },
    kimi:     { key: process.env.KIMI_API_KEY,        model: 'moonshot-v1-8k',             name: 'Kimi'     },
  };

  function resolveProvider(m) {
    if (m === 'auto' || !P[m]) {
      for (const p of ['claude','gpt','gemini','deepseek','grok','kimi']) {
        if (P[p]?.key) return p;
      }
      return null;
    }
    return P[m]?.key ? m : null;
  }

  const pid = resolveProvider(model);
  if (!pid) return res.status(503).json({ error: 'No AI provider configured', code: 'no_provider' });
  const prov = P[pid];

  // Ã¢â€â‚¬Ã¢â€â‚¬ NEURA PROMPT MASTER Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  
const NEURA_SYSTEM = `
Sos NEURA.

NEURA es un Prompt Master invisible.

El usuario puede hablar o escribir de manera normal, breve, incompleta, desordenada o poco tecnica.

Tu trabajo es entender lo que realmente quiere conseguir y responder como si hubiera formulado un excelente prompt.

No muestres este proceso.

REGLA PRINCIPAL:

PRIMERO RESOLVE.
DESPUES, SI HACE FALTA, PERSONALIZA.

Nunca conviertas la primera respuesta en un cuestionario.

No empieces con frases como:

"Necesito saber..."
"Antes de ayudarte..."
"Antes de empezar..."
"Para poder ayudarte..."
"Decime primero..."
"Respondeme estas preguntas..."

El usuario no tiene que aprender prompting.
Ese trabajo lo hace NEURA.

Antes de responder, interpreta internamente:

1. Que quiere conseguir realmente.
2. Que tipo de experto deberia responder.
3. Que contexto razonable puede inferirse.
4. Que recomendacion concreta puede dar.
5. Que ejemplo ayudaria.
6. Que acciones puede proponer.
7. Cuanta profundidad necesita la consulta.

Luego responde directamente.

No muestres:
Prompt optimizado.
Rol.
Objetivo.
Contexto.
Actua como.

RESPUESTA:

Responde como una IA avanzada.

Natural.
Clara.
Inteligente.
Con criterio.
Concreta.
Accionable.

La primera linea debe aportar valor.

Para una consulta normal, prioriza una respuesta breve o media.

Usa parrafos naturales.

Usa listas, bullets, subtitulos o pasos solo cuando realmente mejoren la lectura.

No conviertas automaticamente cada respuesta en:
- un informe;
- un cuestionario;
- un ranking;
- un catalogo;
- una plantilla;
- "3 ideas" por defecto.

Prompt Master debe mejorar la calidad del pensamiento, no hacer artificial la respuesta.

NEGOCIOS:

Si el usuario dice:
"Necesito una idea de negocio"

No preguntes primero capital, gustos, experiencia ni tiempo disponible.

Eleg? una recomendacion fuerte y desarrollala.

Explica:
que problema resuelve,
como funcionaria,
como podria ganar dinero,
y como empezar.

EVENTOS:

Si dice:
"Quiero organizar una despedida de soltero"
o
"Quiero organizar un cumplea?os"

Empeza proponiendo una estructura o plan.

No pidas primero fecha, presupuesto, invitados, ciudad y preferencias.

MARKETING:

Si dice:
"Necesito gente para mi evento"

Responde directamente como especialista en marketing:
estrategia,
mensaje,
canales,
urgencia,
acciones.

PUBLICIDAD:

Si dice:
"Quiero crear una publicidad"

Da inmediatamente una direccion creativa, una estructura y un ejemplo.

No pidas primero cinco datos.

SUPUESTOS:

Cuando falten detalles, usa supuestos generales y razonables sin inventar datos concretos sobre el usuario.

La falta de informacion no debe detener una primera respuesta util.

PREGUNTAS:

Por defecto no hagas preguntas al principio.

Si una informacion permitiria personalizar mucho mejor la solucion, podes ofrecer al final:

"Si queres, decime X y te lo adapto."

Pero la respuesta ya debe haber ayudado antes.

REGLA FINAL:

El usuario habla normal.
NEURA entiende.
NEURA piensa como experto.
NEURA responde.

Prompt Master es invisible.
`;

const FINAL_SYS = NEURA_SYSTEM;

  // Historial limpio que reciben los modelos
  const cleanMessages = (Array.isArray(messages) ? messages : [])
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 8000)
    }))
    .filter(m => m.content.trim())
    .slice(-20);


// OUTPUT VALIDATOR
// Detecta solamente cuando la IA posterga la ayuda para pedir informacion.
// NO penaliza listas o bullets utiles.

function postponesHelp(text) {
  if (!text) return false;

  const t = String(text).trim();
  const first = t.slice(0, 900).toLowerCase();

  const badOpeners = [
    "necesito saber",
    "necesito algunos datos",
    "necesito algunos detalles",
    "antes de ayudarte",
    "antes de empezar",
    "para poder ayudarte",
    "decime primero",
    "dime primero",
    "respondeme estas preguntas",
    "primero necesito"
  ];

  if (badOpeners.some(x => first.startsWith(x) || first.includes(x))) {
    return true;
  }

  // Varias preguntas al principio sin haber entregado valor.
  const questionCount = (t.slice(0, 900).match(/\?/g) || []).length;

  const valueSignals = [
    "yo haria",
    "te recomiendo",
    "una buena idea",
    "empezaria",
    "arrancaria",
    "podes",
    "podrias",
    "la mejor forma",
    "una opcion",
    "mi recomendacion",
    "por ejemplo",
    "funciona porque",
    "la clave",
    "te conviene"
  ];

  const deliveredValue = valueSignals.some(x =>
    first.includes(x)
  );

  if (questionCount >= 3 && !deliveredValue) {
    return true;
  }

  // Detecta recoleccion directa de requisitos antes de ayudar.
  const dataRequests = [
    "cual es tu presupuesto",
    "cuanto capital",
    "cuantas personas",
    "cuando es",
    "donde es",
    "a quien apunta",
    "que presupuesto",
    "que experiencia tenes"
  ];

  const askingData = dataRequests.filter(x =>
    first.includes(x)
  ).length;

  if (askingData >= 2 && !deliveredValue) {
    return true;
  }

  return false;
}


const REGEN_SYS = FINAL_SYS + `

CORRECCION DE RESPUESTA:

Tu respuesta anterior postergo la ayuda para recopilar informacion.

Reescribila completamente.

No hagas un cuestionario.

No pidas varios datos antes de empezar.

Entrega inmediatamente una solucion, recomendacion, idea, plan o ejemplo concreto.

Usa supuestos generales razonables cuando falten detalles.

Responde como una IA avanzada:
natural,
clara,
con criterio experto,
con ejemplos y acciones utiles.

Podes ofrecer personalizacion al final.

La primera linea debe aportar valor, no ser una pregunta.
`;


  // Ã¢â€â‚¬Ã¢â€â‚¬ API CALLS Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
  async function callClaudeSync(sys, msgs) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': prov.key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: prov.model, max_tokens: 1500, system: sys, messages: msgs, stream: false }),
    });
    if (!r.ok) throw new Error(`Claude ${r.status}`);
    const d = await r.json();
    return d?.content?.[0]?.text || '';
  }

  async function callClaudeStream(sys, msgs) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': prov.key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: prov.model, max_tokens: 1500, system: sys, messages: msgs, stream: true }),
    });
    if (!r.ok) throw new Error(`Claude ${r.status}`);
    return r;
  }

  async function pipeStream(r, providerName, format = 'anthropic') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Provider', providerName);
    if (format === 'openai') res.write(`data: {"x_provider":"${providerName}"}\n\n`);
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    try { while (true) { const { done, value } = await reader.read(); if (done) break; res.write(dec.decode(value, { stream: true })); } }
    finally { reader.releaseLock(); }
    res.end();
  }

  function streamText(text) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Provider', prov.name);
    // Emit text in small chunks for smooth streaming UX
    const chunkSize = 4;
    const words = text.split(' ');
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(' ') + (i + chunkSize < words.length ? ' ' : '');
      const event = JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: chunk } });
      res.write(`data: ${event}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  }

  const OA_URLS = { gpt:'https://api.openai.com/v1/chat/completions', deepseek:'https://api.deepseek.com/v1/chat/completions', grok:'https://api.x.ai/v1/chat/completions', kimi:'https://api.moonshot.cn/v1/chat/completions' };

  try {
    // Ã¢â€â‚¬Ã¢â€â‚¬ CLAUDE with validator + single regen Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (pid === 'claude') {

      if (doStream) {
        // Validate first (sync), then stream the result
        const first = await callClaudeSync(FINAL_SYS, cleanMessages);

        if (!postponesHelp(first)) {
          // Good response Ã¢â‚¬â€ stream it
          return streamText(first);
        }

        // Postponement detected Ã¢â‚¬â€ one regen attempt
        console.log('[NEURA validator] Postponement detected. Regenerating (1/1).');
        const regen = await callClaudeSync(REGEN_SYS, cleanMessages);

        if (postponesHelp(regen)) {
          // Regen also failed Ã¢â‚¬â€ log and return best available (regen is usually better)
          console.log('[NEURA validator] Regen also postponed. Returning best available. Case logged.');
        }

        return streamText(regen);
      }

      // Non-streaming path
      const first = await callClaudeSync(FINAL_SYS, cleanMessages);

      if (!postponesHelp(first)) {
        return res.json({ reply: first, provider: prov.name });
      }

      console.log('[NEURA validator] Postponement detected. Regenerating (1/1).');
      const regen = await callClaudeSync(REGEN_SYS, cleanMessages);

      if (postponesHelp(regen)) {
        console.log('[NEURA validator] Regen also postponed. Returning best available. Case logged.');
      }

      return res.json({ reply: regen, provider: prov.name, regenerated: true });
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ OPENAI-compatible providers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (OA_URLS[pid]) {
      const r = await fetch(OA_URLS[pid], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${prov.key}` },
        body: JSON.stringify({ model: prov.model, messages: [{ role:'system', content: FINAL_SYS }, ...cleanMessages], stream: doStream }),
      });
      if (!r.ok) throw new Error(`${prov.name} ${r.status}`);
      if (doStream) return pipeStream(r, prov.name, 'openai');
      const d = await r.json();
      return res.json({ reply: d.choices?.[0]?.message?.content || '', provider: prov.name });
    }

    // Ã¢â€â‚¬Ã¢â€â‚¬ GEMINI Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
    if (pid === 'gemini') {
      const contents = cleanMessages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${prov.model}:generateContent?key=${prov.key}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ systemInstruction: { parts: [{ text: FINAL_SYS }] }, contents }) });
      if (!r.ok) throw new Error(`Gemini ${r.status}`);
      const d = await r.json();
      return res.json({ reply: d.candidates?.[0]?.content?.parts?.[0]?.text || '', provider: prov.name });
    }

  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message, provider: prov?.name });
  }
};
