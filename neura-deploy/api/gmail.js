module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing Google access token. Sign in with Google first.' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
  const { action, messageId, to, subject, content, query = 'is:inbox', maxResults = 10 } = body || {};

  const gFetch = async (path, opts = {}) => {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || `Gmail ${r.status}`); }
    return r.json();
  };

  try {
    if (action === 'list') {
      const list = await gFetch(`/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`);
      if (!list.messages?.length) return res.json({ emails: [] });
      const details = await Promise.all(list.messages.slice(0, 8).map(m =>
        gFetch(`/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
      ));
      const emails = details.map(m => {
        const h = m.payload.headers.reduce((a, x) => ({ ...a, [x.name]: x.value }), {});
        return { id: m.id, from: h.From || '', subject: h.Subject || '(sin asunto)', date: h.Date || '', snippet: m.snippet || '', labelIds: m.labelIds || [] };
      });
      return res.json({ emails });
    }
    if (action === 'read') {
      const msg = await gFetch(`/messages/${messageId}?format=full`);
      const h = msg.payload.headers.reduce((a, x) => ({ ...a, [x.name]: x.value }), {});
      const extract = p => { if (p.mimeType === 'text/plain' && p.body?.data) return Buffer.from(p.body.data, 'base64').toString(); if (p.parts) { for (const c of p.parts) { const t = extract(c); if (t) return t; } } return ''; };
      return res.json({ id: msg.id, from: h.From, subject: h.Subject, date: h.Date, body: extract(msg.payload), snippet: msg.snippet });
    }
    if (action === 'send') {
      if (!to || !subject || !content) return res.status(400).json({ error: 'to, subject, content required' });
      const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${content}`).toString('base64url');
      const sent = await gFetch('/messages/send', { method: 'POST', body: JSON.stringify({ raw }) });
      return res.json({ sent: true, id: sent.id });
    }
    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error('[GMAIL]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
