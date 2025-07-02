// server/src/routes/foodieGroups.js
import express from 'express';
import { db } from '../db.js';
import { foodieGroups } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

console.log('📦  foodieGroups router loaded');

// ─── GET /api/v1/groups ───────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  console.log('📦  GET /api/v1/groups hit');
  try {
    const allGroups = await db.select().from(foodieGroups);
    console.log(`📦  returning ${allGroups.length} groups`);
    res.json(allGroups);
  } catch (err) {
    console.error('📦  error in GET /groups', err);
    next(err);
  }
});

// ─── GET /api/v1/groups/:id ───────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  console.log('📦  GET /api/v1/groups/' + req.params.id);
  try {
    const [group] = await db
      .select()
      .from(foodieGroups)
      .where(eq(foodieGroups.id, req.params.id));

    if (!group) {
      console.log('📦  group not found');
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    console.error('📦  error in GET /groups/:id', err);
    next(err);
  }
});

// ─── POST /api/v1/groups ──────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  console.log('📦  POST /api/v1/groups', req.body);
  try {
    const { name, description } = req.body;

    const [newGroup] = await db
      .insert(foodieGroups)
      .values({
        name,           // incoming snake_case = field name
        description
      })
      .returning();

    res.status(201).json(newGroup);
  } catch (err) {
    console.error('📦  error in POST /groups', err);
    next(err);
  }
});

// ─── PUT /api/v1/groups/:id ───────────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  console.log('📦  PUT /api/v1/groups/' + req.params.id, req.body);
  try {
    const updates = {};
    if (req.body.name        !== undefined) updates.name        = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;

    const [updated] = await db
      .update(foodieGroups)
      .set(updates)
      .where(eq(foodieGroups.id, req.params.id))
      .returning();

    if (!updated) {
      console.log('📦  group not found for update');
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log('📦  updated group id:', updated.id);
    res.json(updated);
  } catch (err) {
    console.error('📦  error in PUT /groups/:id', err);
    next(err);
  }
});

// ─── DELETE /api/v1/groups/:id ────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  console.log('📦  DELETE /api/v1/groups/' + req.params.id);
  try {
    const result = await db
      .delete(foodieGroups)
      .where(eq(foodieGroups.id, req.params.id));

    if (!result.count) {
      console.log('📦  group not found for delete');
      return res.status(404).json({ message: 'Group not found' });
    }
    console.log('📦  deleted group count:', result.count);
    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('📦  error in DELETE /groups/:id', err);
    next(err);
  }
});

export default router;
