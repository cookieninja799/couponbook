// server/src/routes/events.js
import express from 'express';
import { db } from '../db.js';
import { event } from '../schema.js';
import { eq } from 'drizzle-orm';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/v1/events
router.get('/', async (req, res, next) => {
  try {
    const allEvent = await db.select().from(event);
    res.json(allEvent);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [event] = await db
      .select()
      .from(event)
      .where(eq(event.id, req.params.id));
    if (event) return res.json(event);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/events
router.post('/', auth(), async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    const [newEvent] = await db
      .insert(event)
      .values({
        name,
        description,
        startDatetime: new Date(startDate),
        endDatetime: new Date(endDate),
        location,
      })
      .returning();
    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/events/:id
router.put('/:id', auth(), async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    const [updated] = await db
      .update(event)
      .set({
        name,
        description,
        startDatetime: new Date(startDate),
        endDatetime: new Date(endDate),
        location,
      })
      .where(eq(event.id, req.params.id))
      .returning();
    if (updated) return res.json(updated);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/events/:id
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const deleteResult = await db.delete(event).where(eq(event.id, req.params.id));
    if (deleteResult.rowCount) return res.json({ message: 'Event deleted' });
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

export default router;
