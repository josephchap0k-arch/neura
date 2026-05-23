// Stripe webhooks endpoint
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const raw = req.body;
    if (secret) {
      const ts = sig?.split(',').find(p => p.startsWith('t='))?.split('=')[1];
      const v1 = sig?.split(',').find(p => p.startsWith('v1='))?.split('=')[1];
      const payload = `${ts}.${typeof raw === 'string' ? raw : JSON.stringify(raw)}`;
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (expected !== v1) return res.status(400).json({ error: 'Invalid signature' });
    }
    event = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }

  console.log('[STRIPE WEBHOOK]', event.type, event.id);

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('[STRIPE] Payment succeeded:', event.data.object.amount / 100, event.data.object.currency.toUpperCase());
      // TODO: activate user account, send confirmation, etc.
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      console.log('[STRIPE] Subscription:', event.type, event.data.object.status);
      break;
    case 'customer.subscription.deleted':
      console.log('[STRIPE] Subscription cancelled:', event.data.object.id);
      break;
    case 'invoice.payment_failed':
      console.log('[STRIPE] Payment failed:', event.data.object.customer_email);
      break;
  }

  return res.status(200).json({ received: true });
};
