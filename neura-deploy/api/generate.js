'use strict';

// ── NEURA CREA — Generate micro-apps via DeepSeek ────────────────────────────
// Provider adapter: DeepSeek por defecto, swappable

const PROVIDERS = {
  deepseek: {
    key:   process.env.DEEPSEEK_API_KEY,
    url:   'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    name:  'DeepSeek',
  },
  claude: {
    key:   process.env.ANTHROPIC_API_KEY,
    url:   null, // uses Anthropic SDK format
    model: 'claude-sonnet-4-6',
    name:  'Claude',
  },
};

const ACTIVE_PROVIDER = 'deepseek';  // swap here to change provider

// ── SYSTEM PROMPT ─────────────────────────────────────────────────────────────
const SYSTEM = `Sos un generador de micro-apps web.
El usuario describe qué necesita y vos generás una aplicación web completa en un único archivo HTML.

REGLAS ABSOLUTAS:
1. Respondé ÚNICAMENTE con el HTML completo. Cero texto fuera del HTML.
2. El archivo debe empezar con <!DOCTYPE html> y terminar con </html>.
3. Todo el CSS va en <style> dentro del <head>. Todo el JS va en <script> antes de </body>.
4. Sin dependencias externas. Sin CDN. Sin APIs externas. Todo inline.
5. Usá localStorage si la app necesita guardar datos.
6. La app debe funcionar inmediatamente al abrirla — no es un ejemplo ni un template.
7. Diseño responsivo, mobile-first, estética moderna y limpia.
8. Sin markdown, sin bloques de código, sin explicaciones. SOLO el HTML.
9. Si el usuario pide modificar la app, respondé con el HTML completo actualizado.
10. El HTML debe ser funcional, real y completo — no un wireframe.`;

// ── HTML VALIDATOR ─────────────────────────────────────────────────────────────
function validateHTML(html) {
  if (!html || typeof html !== 'string') return false;
  const h = html.trim();
  if (!h.toLowerCase().startsWith('<!doctype html') && !h.toLowerCase().startsWith('<html')) return false;
  if (!h.toLowerCase().includes('</html>')) return false;
  if (h.includes('```')) return false; // markdown leak
  // Block unauthorized external scripts (allow none by default)
  const scriptSrcs = [...h.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  const ALLOWED_ORIGINS = []; // empty = no external scripts allowed
  for (const src of scriptSrcs) {
    if (!ALLOWED_ORIGINS.some(o => src.startsWith(o))) return false;
  }
  return true;
}

function extractHTML(raw) {
  // Strip any markdown fences if model slips up
  let h = raw.trim();
  const fenceMatch = h.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fenceMatch) h = fenceMatch[1].trim();
  // Find the actual HTML start
  const start = h.search(/<!doctype html|<html/i);
  if (start > 0) h = h.slice(start);
  return h;
}

// ── DEEPSEEK / OA CALL ────────────────────────────────────────────────────────
async function callDeepSeek(messages) {
  const prov = PROVIDERS.deepseek;
  if (!prov.key) throw new Error('DEEPSEEK_API_KEY not configured');
  
  const res = await fetch(prov.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${prov.key}` },
    body: JSON.stringify({
      model: prov.model,
      messages,
      max_tokens: 8192,
      temperature: 0.3,  // lower = more deterministic code
      stream: false,
    }),
  });
  
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${err.slice(0, 200)}`);
  }
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── ANTHROPIC FALLBACK ────────────────────────────────────────────────────────
async function callClaude(messages) {
  const prov = PROVIDERS.claude;
  if (!prov.key) throw new Error('ANTHROPIC_API_KEY not configured for Claude fallback');
  
  // Convert to Anthropic format
  const sysMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': prov.key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: prov.model,
      max_tokens: 8192,
      system: sysMsg?.content || SYSTEM,
      messages: userMsgs,
    }),
  });
  
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).end();

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const { conversation = [], prompt = '' } = body || {};

  if (!prompt.trim()) return res.status(400).json({ error: 'prompt required' });

  // Build message history for the model
  const messages = [
    { role: 'system', content: SYSTEM },
    ...conversation.slice(-6), // last 6 turns for context
    { role: 'user', content: prompt },
  ];

  let html = '';
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      let raw = '';
      
      if (ACTIVE_PROVIDER === 'deepseek') {
        raw = await callDeepSeek(messages);
      } else {
        raw = await callClaude(messages);
      }
      
      html = extractHTML(raw);
      
      if (validateHTML(html)) break;
      
      // Retry with correction prompt
      if (attempts < maxAttempts) {
        messages.push({ role: 'assistant', content: raw });
        messages.push({
          role: 'user',
          content: 'El HTML que generaste no es válido. Respondé ÚNICAMENTE con el HTML completo empezando por <!DOCTYPE html> y terminando con </html>. Sin ningún texto adicional.',
        });
      }
    } catch (err) {
      if (attempts >= maxAttempts) {
        return res.status(500).json({ error: err.message, provider: ACTIVE_PROVIDER });
      }
    }
  }

  if (!validateHTML(html)) {
    return res.status(422).json({ error: 'Could not generate valid HTML after retries', provider: ACTIVE_PROVIDER });
  }

  // Extract title for UI
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'App';

  res.json({
    html,
    title,
    provider: PROVIDERS[ACTIVE_PROVIDER].name,
    model: PROVIDERS[ACTIVE_PROVIDER].model,
  });
};
