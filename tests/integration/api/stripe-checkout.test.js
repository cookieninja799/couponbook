// Stripe Checkout Integration Tests
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { getTestDb, closeTestDb, seedHelpers, withTransaction } from '../../helpers/db.js';
import { eq, and } from 'drizzle-orm';
import * as schema from '../../../drizzle/schema';

// Mock Stripe
vi.mock('../../../server/src/config/stripe.js', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({
          id: 'cs_test_mock_session_id',
          url: 'https://checkout.stripe.com/test',
          payment_intent: 'pi_test_123',
          customer: 'cus_test_123',
        }),
      },
    },
    webhooks: {
      constructEvent: vi.fn().mockImplementation((body, sig, secret) => {
        // Return mock event based on body
        const parsed = JSON.parse(body);
        return parsed;
      }),
    },
    products: {
      create: vi.fn().mockResolvedValue({
        id: 'prod_test_123',
      }),
    },
    prices: {
      create: vi.fn().mockResolvedValue({
        id: 'price_test_123',
      }),
    },
  },
}));

describe('Stripe Checkout Integration', () => {
  let db;

  beforeAll(async () => {
    db = await getTestDb();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  describe('Purchase with provider field', () => {
    it('should create Stripe purchase with provider=stripe', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        // Create a Stripe purchase
        const [purchase] = await db
          .insert(schema.purchase)
          .values({
            userId: user.id,
            groupId: group.id,
            provider: 'stripe',
            stripeCheckoutId: 'cs_test_checkout_123',
            amountCents: 999,
            currency: 'usd',
            status: 'pending',
          })
          .returning();

        expect(purchase).toBeDefined();
        expect(purchase.provider).toBe('stripe');
        expect(purchase.status).toBe('pending');
        expect(purchase.stripeCheckoutId).toBe('cs_test_checkout_123');
      });
    });

    it('should create test purchase with provider=test', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        // Create a test purchase (like the legacy test-code flow)
        const [purchase] = await db
          .insert(schema.purchase)
          .values({
            userId: user.id,
            groupId: group.id,
            provider: 'test',
            stripeCheckoutId: null,
            amountCents: 0,
            currency: 'usd',
            status: 'paid',
            purchasedAt: new Date().toISOString(),
          })
          .returning();

        expect(purchase).toBeDefined();
        expect(purchase.provider).toBe('test');
        expect(purchase.stripeCheckoutId).toBeNull();
        expect(purchase.status).toBe('paid');
      });
    });
  });

  describe('Access check with provider field', () => {
    it('should grant access for paid Stripe purchase', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        await db.insert(schema.purchase).values({
          userId: user.id,
          groupId: group.id,
          provider: 'stripe',
          stripeCheckoutId: 'cs_test_paid_123',
          amountCents: 999,
          currency: 'usd',
          status: 'paid',
          purchasedAt: new Date().toISOString(),
        });

        // Check access
        const purchases = await db
          .select()
          .from(schema.purchase)
          .where(
            and(
              eq(schema.purchase.userId, user.id),
              eq(schema.purchase.groupId, group.id),
              eq(schema.purchase.status, 'paid')
            )
          );

        expect(purchases.length).toBe(1);
        const hasAccess = purchases.length > 0;
        expect(hasAccess).toBe(true);
      });
    });

    it('should grant access for paid test purchase (legacy)', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        // Create legacy test purchase
        await db.insert(schema.purchase).values({
          userId: user.id,
          groupId: group.id,
          provider: 'test',
          stripeCheckoutId: null,
          amountCents: 0,
          currency: 'usd',
          status: 'paid',
          purchasedAt: new Date().toISOString(),
        });

        // Access check ignores provider - only checks status
        const purchases = await db
          .select()
          .from(schema.purchase)
          .where(
            and(
              eq(schema.purchase.userId, user.id),
              eq(schema.purchase.groupId, group.id),
              eq(schema.purchase.status, 'paid')
            )
          );

        expect(purchases.length).toBe(1);
        expect(purchases[0].provider).toBe('test');
        const hasAccess = purchases.length > 0;
        expect(hasAccess).toBe(true);
      });
    });

    it('should deny access for pending purchase', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        await db.insert(schema.purchase).values({
          userId: user.id,
          groupId: group.id,
          provider: 'stripe',
          stripeCheckoutId: 'cs_test_pending_123',
          amountCents: 999,
          currency: 'usd',
          status: 'pending',
        });

        // Check access - should not find paid purchase
        const purchases = await db
          .select()
          .from(schema.purchase)
          .where(
            and(
              eq(schema.purchase.userId, user.id),
              eq(schema.purchase.groupId, group.id),
              eq(schema.purchase.status, 'paid')
            )
          );

        expect(purchases.length).toBe(0);
        const hasAccess = purchases.length > 0;
        expect(hasAccess).toBe(false);
      });
    });

    it('should deny access for refunded purchase', async () => {
      await withTransaction(async (db) => {
        const user = await seedHelpers.createUser(db);
        const group = await seedHelpers.createFoodieGroup(db);

        await db.insert(schema.purchase).values({
          userId: user.id,
          groupId: group.id,
          provider: 'stripe',
          stripeCheckoutId: 'cs_test_refunded_123',
          amountCents: 999,
          currency: 'usd',
          status: 'refunded',
          purchasedAt: new Date().toISOString(),
          refundedAt: new Date().toISOString(),
        });

        // Check access - should not find paid purchase
        const purchases = await db
          .select()
          .from(schema.purchase)
          .where(
            and(
              eq(schema.purchase.userId, user.id),
              eq(schema.purchase.groupId, group.id),
              eq(schema.purchase.status, 'paid')
            )
          );

        expect(purchases.length).toBe(0);
        const hasAccess = purchases.length > 0;
        expect(hasAccess).toBe(false);
      });
    });
  });

  describe('Payment Event Idempotency', () => {
    it('should create payment event record', async () => {
      await withTransaction(async (db) => {
        const eventId = 'evt_test_unique_123';

        const [event] = await db
          .insert(schema.paymentEvent)
          .values({
            provider: 'stripe',
            eventId: eventId,
            eventType: 'checkout.session.completed',
            receivedAt: new Date().toISOString(),
          })
          .returning();

        expect(event).toBeDefined();
        expect(event.eventId).toBe(eventId);
        expect(event.provider).toBe('stripe');
      });
    });

    it('should enforce unique event_id constraint', async () => {
      await withTransaction(async (db) => {
        const eventId = 'evt_test_duplicate_456';

        // First insert should succeed
        await db.insert(schema.paymentEvent).values({
          provider: 'stripe',
          eventId: eventId,
          eventType: 'checkout.session.completed',
          receivedAt: new Date().toISOString(),
        });

        // Second insert should fail due to unique constraint
        await expect(
          db.insert(schema.paymentEvent).values({
            provider: 'stripe',
            eventId: eventId,
            eventType: 'checkout.session.completed',
            receivedAt: new Date().toISOString(),
          })
        ).rejects.toThrow();
      });
    });
  });

  describe('Coupon Book Price', () => {
    it('should create coupon book price record', async () => {
      await withTransaction(async (db) => {
        const group = await seedHelpers.createFoodieGroup(db);
        const user = await seedHelpers.createUser(db);

        const [price] = await db
          .insert(schema.couponBookPrice)
          .values({
            groupId: group.id,
            amountCents: 999,
            currency: 'usd',
            isActive: true,
            stripeProductId: 'prod_test_123',
            stripePriceId: 'price_test_123',
            createdByUserId: user.id,
          })
          .returning();

        expect(price).toBeDefined();
        expect(price.amountCents).toBe(999);
        expect(price.isActive).toBe(true);
        expect(price.stripePriceId).toBe('price_test_123');
      });
    });

    it('should find active price for group', async () => {
      await withTransaction(async (db) => {
        const group = await seedHelpers.createFoodieGroup(db);
        const user = await seedHelpers.createUser(db);

        // Create inactive price
        await db.insert(schema.couponBookPrice).values({
          groupId: group.id,
          amountCents: 799,
          currency: 'usd',
          isActive: false,
          createdByUserId: user.id,
        });

        // Create active price
        await db.insert(schema.couponBookPrice).values({
          groupId: group.id,
          amountCents: 999,
          currency: 'usd',
          isActive: true,
          stripeProductId: 'prod_test_123',
          stripePriceId: 'price_test_456',
          createdByUserId: user.id,
        });

        // Query for active price
        const [activePrice] = await db
          .select()
          .from(schema.couponBookPrice)
          .where(
            and(
              eq(schema.couponBookPrice.groupId, group.id),
              eq(schema.couponBookPrice.isActive, true)
            )
          );

        expect(activePrice).toBeDefined();
        expect(activePrice.amountCents).toBe(999);
        expect(activePrice.stripePriceId).toBe('price_test_456');
      });
    });
  });
});
