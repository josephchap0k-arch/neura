// Slack + Stripe + WhatsApp placeholder
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
  const { connector, action, ...params } = body || {};

  try {
    if (connector === 'slack') {
      const t = process.env.SLACK_BOT_TOKEN;
      if (!t) return res.status(503).json({ error: 'Slack not configured. Add SLACK_BOT_TOKEN in Vercel env vars.' });
      if (action === 'send') {
        const r = await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST', headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: params.channel || '#general', text: params.text }),
        });
        const d = await r.json();
        return res.json({ sent: d.ok, ts: d.ts, error: d.error });
      }
      if (action === 'channels') {
        const r = await fetch('https://slack.com/api/conversations.list?limit=20', { headers: { Authorization: `Bearer ${t}` } });
        const d = await r.json();
        return res.json({ channels: (d.channels || []).map(c => ({ id: c.id, name: c.name })) });
      }
    }

    if (connector === 'stripe') {
      const k = process.env.STRIPE_SECRET_KEY;
      if (!k) return res.status(503).json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY in Vercel env vars.' });
      const sF = async path => { const r = await fetch(`https://api.stripe.com/v1${path}`, { headers: { Authorization: `Bearer ${k}` } }); return r.json(); };
      if (action === 'revenue') { const c = await sF('/charges?limit=10'); return res.json({ charges: c.data || [], total: c.data?.reduce((s, x) => s + x.amount_captured / 100, 0) || 0 }); }
      if (action === 'subscriptions') { const s = await sF('/subscriptions?limit=20&status=active'); return res.json({ subscriptions: s.data || [] }); }
      if (action === 'customers') { const c = await sF('/customers?limit=10'); return res.json({ customers: c.data || [] }); }
    }

    if (connector === 'whatsapp') {
      return res.status(503).json({ status: 'pending', error: 'WhatsApp Business API requires Meta approval. Contact Meta Business to apply.', docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api' });
    }

    return res.status(400).json({ error: `Unknown connector: ${connector}` });
  } catch (e) {
    console.error('[CONNECTORS]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
