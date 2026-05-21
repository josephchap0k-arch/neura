// NEURA — Vercel Serverless Function (CommonJS)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const { system, messages, model, max_tokens } = body || {};

  if (!messages || !Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'messages[] required' });
  }

  // Ensure messages have role + content (Anthropic requirement)
  const cleanMessages = messages.map(m => ({
    role:    m.role    || 'user',
    content: m.content || m.text || m.message || '...',
  }));

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      model      || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 1024,
        messages:   cleanMessages,
        ...(system ? { system } : {}),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data?.error?.message || 'Anthropic error' });
    }

    const reply = data?.content?.[0]?.text;
    if (!reply) return res.status(500).json({ error: 'Empty response' });

    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: 'Network error: ' + err.message });
  }
};
