// server/src/routes/merchant.js
import express from 'express';
import { db } from '../db.js';
import { merchant } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

console.log('📦  merchant router loaded');

// ─── GET all merchant ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/merchant hit');
  try {
    const allMerchant = await db.select().from(merchant);
    console.log(`📦  returning ${allMerchant.length} merchant`);
    res.json(allMerchant);
  } catch (err) {
    console.error('📦  error in GET /merchant', err);
    next(err);
  }
});

// ─── GET a single merchant by ID ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/merchant/' + req.params.id);
  try {
    const [row] = await db
      .select()
      .from(merchant)
      .where(eq(merchant.id, req.params.id));

    if (!row) {
      console.log('📦  merchant not found');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    res.json(row);
  } catch (err) {
    console.error('📦  error in GET /merchant/:id', err);
    next(err);
  }
});

// ─── POST create a new merchant ───────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/merchant', req.body);
  try {
    const { name, logo_url, owner_id } = req.body;

    const [newMerchant] = await db
      .insert(merchant)
      .values({
        name,
        logoUrl: logo_url,    // maps incoming snake_case to Drizzle field
        ownerId: owner_id
      })
      .returning();

    res.status(201).json(newMerchant);
  } catch (err) {
    console.error('📦  error in POST /merchant', err);
    next(err);
  }
});

// ─── PUT update an existing merchant ──────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/merchant/' + req.params.id, req.body);
  try {
    const updates = {};
    if (req.body.name       !== undefined) updates.name    = req.body.name;
    if (req.body.logo_url   !== undefined) updates.logoUrl = req.body.logo_url;
    if (req.body.owner_id   !== undefined) updates.ownerId = req.body.owner_id;

    const [updated] = await db
      .update(merchant)
      .set(updates)
      .where(eq(merchant.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  merchant not found for update');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  updated merchant id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /merchant/:id', err);
    next(err);
  }
});

// ─── DELETE a merchant ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/merchant/' + req.params.id);
  try {
    const result = await db
      .delete(merchant)
      .where(eq(merchant.id, req.params.id));

    if (!result.count) {
      console.log('📦  merchant not found for delete');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  deleted merchant count:', result.count);
    res.json({ message: 'Merchant deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /merchant/:id', err);
    next(err);
  }
});

export default router;
