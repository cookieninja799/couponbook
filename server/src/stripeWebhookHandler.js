// server/src/stripeWebhookHandler.js
// Shared webhook logic for Stripe. Use from Express (with express.raw) or from a
// dedicated serverless handler that reads the raw body without any body parser.
import { db } from './db.js';
import { purchase, paymentEvent, foodieGroupMembership } from './schema.js';
import { eq, and } from 'drizzle-orm';
import { stripe } from './config/stripe.js';

/**
 * Process a Stripe webhook payload. Call this with the raw body (Buffer or string)
 * and Stripe-Signature header so the body is never parsed before verification.
 *
 * @param {Buffer|string|Uint8Array} rawBody - Raw request body (must not be parsed)
 * @param {string} [signature] - req.headers['stripe-signature']
 * @returns {{ status: number, body: object }}
 */
export async function handleWebhook(rawBody, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('💳  STRIPE_WEBHOOK_SECRET not configured');
    return { status: 500, body: { error: 'Webhook secret not configured' } };
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('💳  Webhook signature verification failed:', err.message);
    return { status: 400, body: { error: `Webhook Error: ${err.message}` } };
  }

  console.log('💳  Webhook verified:', event.type, event.id);

  try {
    const [existingEvent] = await db
      .select()
      .from(paymentEvent)
      .where(eq(paymentEvent.eventId, event.id));

    if (existingEvent) {
      console.log('💳  Event already processed, skipping:', event.id);
      return { status: 200, body: { received: true, duplicate: true } };
    }

    await db.insert(paymentEvent).values({
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      receivedAt: new Date().toISOString(),
      payload: event.data.object,
    });
  } catch (err) {
    if (err.code === '23505') {
      console.log('💳  Event already exists (race condition), skipping:', event.id);
      return { status: 200, body: { received: true, duplicate: true } };
    }
    throw err;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event);
        break;
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event);
        break;
      default:
        console.log('💳  Unhandled event type:', event.type);
    }

    await db
      .update(paymentEvent)
      .set({ processedAt: new Date().toISOString() })
      .where(eq(paymentEvent.eventId, event.id));
  } catch (err) {
    console.error('💳  Error processing webhook event:', err);
    await db
      .update(paymentEvent)
      .set({
        processingError: err.message,
        processedAt: new Date().toISOString(),
      })
      .where(eq(paymentEvent.eventId, event.id));
  }

  return { status: 200, body: { received: true } };
}

async function handleCheckoutSessionCompleted(event) {
  const session = event.data.object;
  console.log('💳  Processing checkout.session.completed:', session.id);

  const [purchaseRow] = await db
    .select()
    .from(purchase)
    .where(eq(purchase.stripeCheckoutId, session.id));

  if (!purchaseRow) {
    console.warn('💳  No purchase found for checkout session:', session.id);
    const userId = session.metadata?.userId;
    const groupId = session.metadata?.groupId;

    if (userId && groupId) {
      console.log('💳  Creating purchase from webhook metadata:', { userId, groupId });
      try {
        await db.insert(purchase).values({
          userId,
          groupId,
          provider: 'stripe',
          stripeCheckoutId: session.id,
          stripeCustomerId: session.customer,
          stripePaymentIntentId: session.payment_intent,
          amountCents: session.amount_total,
          currency: session.currency,
          status: 'paid',
          purchasedAt: new Date().toISOString(),
          metadata: { createdVia: 'webhook' },
        });
        await ensureFoodieGroupMembership(userId, groupId);
      } catch (insertErr) {
        if (insertErr.code === '23505') {
          console.log('💳  Purchase already exists for checkout session (duplicate webhook), skipping:', session.id);
          await ensureFoodieGroupMembership(userId, groupId);
        } else {
          throw insertErr;
        }
      }
    }
    return;
  }

  await db
    .update(purchase)
    .set({
      status: 'paid',
      purchasedAt: new Date().toISOString(),
      stripeCustomerId: session.customer,
      stripePaymentIntentId: session.payment_intent,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(purchase.id, purchaseRow.id));

  console.log('💳  Purchase marked as paid:', purchaseRow.id);

  await db
    .update(paymentEvent)
    .set({ purchaseId: purchaseRow.id })
    .where(eq(paymentEvent.eventId, event.id));

  await ensureFoodieGroupMembership(purchaseRow.userId, purchaseRow.groupId);

  console.log('💳  Checkout session completed successfully:', {
    purchaseId: purchaseRow.id,
    sessionId: session.id,
  });
}

async function handleCheckoutSessionExpired(event) {
  const session = event.data.object;
  console.log('💳  Processing checkout.session.expired:', session.id);

  const [purchaseRow] = await db
    .select()
    .from(purchase)
    .where(eq(purchase.stripeCheckoutId, session.id));

  if (!purchaseRow) {
    console.warn('💳  No purchase found for expired session:', session.id);
    return;
  }

  if (purchaseRow.status === 'pending') {
    await db
      .update(purchase)
      .set({
        status: 'expired',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(purchase.id, purchaseRow.id));
    console.log('💳  Purchase marked as expired:', purchaseRow.id);
  }
}

async function handleChargeRefunded(event) {
  const charge = event.data.object;
  console.log('💳  Processing charge.refunded:', charge.id);

  let purchaseRow;
  [purchaseRow] = await db
    .select()
    .from(purchase)
    .where(eq(purchase.stripeChargeId, charge.id));

  if (!purchaseRow && charge.payment_intent) {
    [purchaseRow] = await db
      .select()
      .from(purchase)
      .where(eq(purchase.stripePaymentIntentId, charge.payment_intent));
  }

  if (!purchaseRow) {
    console.warn('💳  No purchase found for refunded charge:', charge.id);
    return;
  }

  await db
    .update(purchase)
    .set({
      status: 'refunded',
      refundedAt: new Date().toISOString(),
      stripeChargeId: charge.id,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(purchase.id, purchaseRow.id));

  console.log('💳  Purchase marked as refunded:', purchaseRow.id);

  await db
    .update(paymentEvent)
    .set({ purchaseId: purchaseRow.id })
    .where(eq(paymentEvent.eventId, event.id));
}

async function ensureFoodieGroupMembership(userId, groupId) {
  const [existing] = await db
    .select()
    .from(foodieGroupMembership)
    .where(
      and(
        eq(foodieGroupMembership.userId, userId),
        eq(foodieGroupMembership.groupId, groupId)
      )
    );

  if (existing) {
    if (existing.deletedAt) {
      await db
        .update(foodieGroupMembership)
        .set({ deletedAt: null })
        .where(eq(foodieGroupMembership.id, existing.id));
    }
    return;
  }

  await db.insert(foodieGroupMembership).values({
    userId,
    groupId,
    role: 'customer',
    joinedAt: new Date().toISOString(),
  });
  console.log('💳  Created foodie group membership:', { userId, groupId });
}
