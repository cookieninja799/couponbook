// server/src/routes/merchants.js
import express from 'express';
import { db } from '../db.js';
import { merchants } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

console.log('📦  merchants router loaded');

// ─── GET all merchants ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/merchants hit');
  try {
    const allMerchants = await db.select().from(merchants);
    console.log(`📦  returning ${allMerchants.length} merchants`);
    res.json(allMerchants);
  } catch (err) {
    console.error('📦  error in GET /merchants', err);
    next(err);
  }
});

// ─── GET a single merchant by ID ─────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/merchants/' + req.params.id);
  try {
    const [row] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, req.params.id));

    if (!row) {
      console.log('📦  merchant not found');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    res.json(row);
  } catch (err) {
    console.error('📦  error in GET /merchants/:id', err);
    next(err);
  }
});

// ─── POST create a new merchant ───────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/merchants', req.body);
  try {
    const { name, logo_url, owner_id } = req.body;

    const [newMerchant] = await db
      .insert(merchants)
      .values({
        name,
        logoUrl: logo_url,    // maps incoming snake_case to Drizzle field
        ownerId: owner_id
      })
      .returning();

    res.status(201).json(newMerchant);
  } catch (err) {
    console.error('📦  error in POST /merchants', err);
    next(err);
  }
});

// ─── PUT update an existing merchant ──────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/merchants/' + req.params.id, req.body);
  try {
    const updates = {};
    if (req.body.name       !== undefined) updates.name    = req.body.name;
    if (req.body.logo_url   !== undefined) updates.logoUrl = req.body.logo_url;
    if (req.body.owner_id   !== undefined) updates.ownerId = req.body.owner_id;

    const [updated] = await db
      .update(merchants)
      .set(updates)
      .where(eq(merchants.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  merchants not found for update');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  updated merchant id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /merchants/:id', err);
    next(err);
  }
});

// ─── DELETE a merchant ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/merchants/' + req.params.id);
  try {
    const result = await db
      .delete(merchants)
      .where(eq(merchants.id, req.params.id));

    if (!result.count) {
      console.log('📦  merchant not found for delete');
      return res.status(404).json({ message: 'Merchant not found' });
    }
    console.log('📦  deleted merchant count:', result.count);
    res.json({ message: 'Merchant deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /merchants/:id', err);
    next(err);
  }
});

export default router;
