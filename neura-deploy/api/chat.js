// api/chat.js — NEURA AI Gateway v3 with refined output validator
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

  // ── NEURA PROMPT MASTER ────────────────────────────────────────────────────
  const NEURA_SYSTEM = `Sos NEURA. Un Prompt Master invisible.

El usuario escribe o habla de manera natural. Vos interpretás internamente su intención, inferís el experto adecuado y respondés directamente con criterio profesional. Nunca mostrás este proceso.

REGLA ABSOLUTA: nunca pospongas la ayuda para recopilar información. Ante cualquier pedido, entregá primero una solución, recomendación, plan, idea o ejemplo concreto. Después, si aporta valor, podés hacer UNA pregunta para personalizar.

PROHIBIDO COMO PRIMERA RESPUESTA: abrir con "Necesito saber", "Antes de empezar", "Para poder ayudarte", "Decime primero" o cualquier variante que posponga la ayuda.

SUPUESTOS: cuando falten datos, usá supuestos razonables y continúa. Ejemplo: en vez de pedir el presupuesto, decí "Si el presupuesto es acotado, arrancá por..."

EXPERTO AUTOMÁTICO: inferí el rol profesional según el pedido. El usuario nunca necesita decirte "actuá como".

ESTILO: 1-3 párrafos naturales. Directo. Lenguaje conversacional. Listas solo cuando realmente mejoran la lectura.

Tono: natural, seguro, cercano. Voseo argentino.`;

  const FINAL_SYS = system || NEURA_SYSTEM;

  // ── OUTPUT VALIDATOR ───────────────────────────────────────────────────────
  // Detects if a response POSTPONES HELP to gather information.
  // Does NOT penalize lists, bullets, or questions that appear after delivering value.
  function postponesHelp(text) {
    if (!text) return false;
    const t = text.trim();

    // 1. Explicit postponement openers — these always fail
    const POSTPONEMENT_OPENERS = [
      /^necesito saber/i,
      /^antes de (empezar|ayudarte|responder|continuar|darte)/i,
      /^para (poder ayudarte|darte (una|el|la|opciones)|diseñar|crear|armar)/i,
      /^decime (primero|antes|qué|cuándo|cuántos|cuánto|dónde)/i,
      /^primero necesito/i,
      /^(?:para eso )?necesito (que me|algunos|más)/i,
      /^me (falta|faltan) (saber|datos|información)/i,
      /^¿qué (tipo|clase|estilo|producto|servicio)/i,
    ];
    if (POSTPONEMENT_OPENERS.some(p => p.test(t))) return true;

    // 2. First 250 chars: if ALL content is questions and no value statement exists
    const first250 = t.slice(0, 250);
    const questionMarks = (first250.match(/\?/g) || []).length;
    // Count non-question sentences (length > 20, doesn't end in ?)
    const statements = first250.split(/(?<=[.!])\s+/)
      .filter(s => s.trim().length > 20 && !s.trim().endsWith('?'));

    if (questionMarks >= 2 && statements.length === 0) return true;

    // 3. Opening bullet list of ONLY questions, no value before them
    const lines = t.split('\n');
    let consecutiveQuestionBullets = 0;
    let foundValueBefore = false;

    for (const line of lines.slice(0, 8)) {
      const l = line.trim();
      if (!l) continue;

      const isQuestionBullet = /^[-*•]\s*¿/.test(l) ||
        (/^[-*•]\s/.test(l) && l.endsWith('?'));
      const isValueLine = l.length > 25 && !l.endsWith('?') && !/^[-*•]\s*$/.test(l);

      if (isValueLine && !isQuestionBullet) { foundValueBefore = true; break; }
      if (isQuestionBullet) consecutiveQuestionBullets++;
    }

    if (consecutiveQuestionBullets >= 2 && !foundValueBefore) return true;

    return false;
  }

  const cleanMessages = messages
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 8000) }))
    .filter(m => m.content);

  // ── REGENERATION SYSTEM PROMPT ─────────────────────────────────────────────
  const REGEN_SYS = `${FINAL_SYS}

CORRECCIÓN ACTIVA: tu respuesta anterior pospuso la ayuda para pedir información. Eso está prohibido.
Esta vez comenzá INMEDIATAMENTE con una solución, plan, idea o recomendación concreta.
Usá supuestos razonables para lo que no sabés. Podés hacer UNA pregunta al final si aporta valor.
La primera línea debe ser valor, no una pregunta.`;

  // ── API CALLS ──────────────────────────────────────────────────────────────
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
    // ── CLAUDE with validator + single regen ──────────────────────────────
    if (pid === 'claude') {

      if (doStream) {
        // Validate first (sync), then stream the result
        const first = await callClaudeSync(FINAL_SYS, cleanMessages);

        if (!postponesHelp(first)) {
          // Good response — stream it
          return streamText(first);
        }

        // Postponement detected — one regen attempt
        console.log('[NEURA validator] Postponement detected. Regenerating (1/1).');
        const regen = await callClaudeSync(REGEN_SYS, cleanMessages);

        if (postponesHelp(regen)) {
          // Regen also failed — log and return best available (regen is usually better)
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

    // ── OPENAI-compatible providers ──────────────────────────────────────
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

    // ── GEMINI ──────────────────────────────────────────────────────────
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
