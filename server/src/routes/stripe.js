// server/src/routes/stripe.js
import express from 'express';
import { handleWebhook } from '../stripeWebhookHandler.js';

const router = express.Router();

console.log('💳  Stripe router loaded');

// POST /api/v1/stripe/webhook — receives raw body via express.raw() in app.js
router.post('/webhook', async (req, res) => {
  console.log('💳  Webhook received');
  const sig = req.headers['stripe-signature'];
  const { status, body } = await handleWebhook(req.body, sig);
  res.status(status).json(body);
});

export default router;
