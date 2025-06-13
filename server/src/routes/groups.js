// server/src/routes/foodieGroups.js
import express from 'express';
import { db } from '../db.js';
import { foodieGroups } from '../schema.ts';
import { eq } from 'drizzle-orm';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/groupsfoodieGroups
router.get('/', async (req, res, next) => {
  try {
    const allGroups = await db.select().from(foodieGroups);
    res.json(allGroups);
  } catch (err) {
    next(err);
  }
});

// GET /api/groups/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [group] = await db
      .select()
      .from(foodieGroups)
      .where(eq(foodieGroups.id, Number(req.params.id)));
    if (group) return res.json(group);
    res.status(404).json({ message: 'Group not found' });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups
router.post('/', auth(), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [newGroup] = await db
      .insert(groups)
      .values({ name, description })
      .returning();
    res.status(201).json(newGroup);
  } catch (err) {
    next(err);
  }
});

// PUT /api/groups/:id
router.put('/:id', auth(), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const [updated] = await db
      .update(groups)
      .set({ name, description })
      .where(eq(groups.id, Number(req.params.id)))
      .returning();
    if (updated) return res.json(updated);
    res.status(404).json({ message: 'Group not found' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/groups/:id
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const deleteResult = await db.delete(groups).where(eq(groups.id, Number(req.params.id)));
    if (deleteResult.count) return res.json({ message: 'Group deleted' });
    res.status(404).json({ message: 'Group not found' });
  } catch (err) {
    next(err);
  }
});

export default router;
