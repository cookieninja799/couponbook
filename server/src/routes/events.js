// server/src/routes/events.js
import express from 'express';
import { db } from '../db.js';
import { events } from '../schema.ts';
import { eq } from 'drizzle-orm';
import auth from '../middleware/auth.js';

const router = express.Router();

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const allEvents = await db.select().from(events);
    res.json(allEvents);
  } catch (err) {
    next(err);
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, Number(req.params.id)));
    if (event) return res.json(event);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// POST /api/events
router.post('/', auth(), async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    const [newEvent] = await db
      .insert(events)
      .values({
        name,
        description,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        location,
      })
      .returning();
    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id
router.put('/:id', auth(), async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location } = req.body;
    const [updated] = await db
      .update(events)
      .set({
        name,
        description,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        location,
      })
      .where(eq(events.id, Number(req.params.id)))
      .returning();
    if (updated) return res.json(updated);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const deleteResult = await db.delete(events).where(eq(events.id, Number(req.params.id)));
    if (deleteResult.count) return res.json({ message: 'Event deleted' });
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

export default router;
