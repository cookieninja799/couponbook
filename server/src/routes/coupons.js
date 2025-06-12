// server/src/routes/coupons.js
import { Router }  from 'express';
import { db }      from '../db.js';
import { coupons } from '../schema.js';
import { isNull, desc } from 'drizzle-orm';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const rows = await db.select()
                         .from(coupons)
                         .where(isNull(coupons.deletedAt))
                         .orderBy(desc(coupons.validFrom));
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const [created] = await db.insert(coupons)
                              .values(req.body)
                              .returning();
    res.status(201).json(created);
  } catch (e) { next(e); }
});

export default router;
