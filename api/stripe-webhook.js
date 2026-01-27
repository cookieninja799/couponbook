// api/stripe-webhook.js
// Dedicated serverless handler for Stripe webhooks. This path is never passed through
// any body parser, so the raw body is available for signature verification.
// Used in production via vercel.json rewrite: /api/v1/stripe/webhook -> /api/stripe-webhook
import { handleWebhook } from '../server/src/stripeWebhookHandler.js';

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const sig = req.headers['stripe-signature'];
  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (err) {
    console.error('💳  Failed to read webhook body:', err);
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { status, body } = await handleWebhook(rawBody, sig);
  res.status(status).json(body);
}
