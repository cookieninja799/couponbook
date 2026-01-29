// server/src/routes/events.js
import express from 'express';
import { db } from '../db.js';
import { event } from '../schema.js';
import { eq } from 'drizzle-orm';
import auth from '../middleware/auth.js';
import { resolveLocalUser, requireSuperAdmin } from '../authz/index.js';

const router = express.Router();

// GET /api/v1/events - public read
router.get('/', async (req, res, next) => {
  try {
    const allEvents = await db.select().from(event);
    res.json(allEvents);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/events/:id - public read
router.get('/:id', async (req, res, next) => {
  try {
    const [foundEvent] = await db
      .select()
      .from(event)
      .where(eq(event.id, req.params.id));
    if (foundEvent) return res.json(foundEvent);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/events - super admin only
router.post('/', auth(), resolveLocalUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location, groupId, merchantId, capacity } = req.body;
    
    if (!groupId || !merchantId) {
      return res.status(400).json({ message: 'groupId and merchantId are required' });
    }

    const [newEvent] = await db
      .insert(event)
      .values({
        name,
        description,
        startDatetime: new Date(startDate),
        endDatetime: endDate ? new Date(endDate) : null,
        location,
        groupId,
        merchantId,
        capacity: capacity || 0,
      })
      .returning();
    res.status(201).json(newEvent);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/events/:id - super admin only
router.put('/:id', auth(), resolveLocalUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, location, capacity } = req.body;
    const updates = {};
    
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (startDate !== undefined) updates.startDatetime = new Date(startDate);
    if (endDate !== undefined) updates.endDatetime = new Date(endDate);
    if (location !== undefined) updates.location = location;
    if (capacity !== undefined) updates.capacity = capacity;
    updates.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(event)
      .set(updates)
      .where(eq(event.id, req.params.id))
      .returning();
    if (updated) return res.json(updated);
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/events/:id - super admin only
router.delete('/:id', auth(), resolveLocalUser, requireSuperAdmin, async (req, res, next) => {
  try {
    const deleteResult = await db.delete(event).where(eq(event.id, req.params.id));
    if (deleteResult.rowCount) return res.json({ message: 'Event deleted' });
    res.status(404).json({ message: 'Event not found' });
  } catch (err) {
    next(err);
  }
});

export default router;
