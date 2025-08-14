// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB, pool } from './db.js';
import * as auth from './middleware/auth.js';
import usersRouter from './routes/users.js';
import couponsRouter from './routes/coupons.js';
import eventsRouter from './routes/events.js';
import groupsRouter from './routes/foodieGroups.js';
import merchantsRouter from './routes/merchants.js';
import couponSubmissionsRouter from './routes/couponSubmissions.js';
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
// health should work even if DB is down
app.get('/api/health', (_req, res) => {
    res.json({
        ok: true,
        node: process.version,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPgCaCert: !!process.env.PG_CA_CERT,
    });
});

app.get('/api/db-ping', async (req, res, next) => {
  try {
    const t = Date.now();
    const r = await pool.query('SELECT 1 AS ok');
    res.json({ ok: r.rows[0].ok === 1, ms: Date.now() - t });
  } catch (e) {
    next(e);
  }
});

// Try a background connect, but don't crash if it fails
connectDB()
    .then(() => console.log('DB connected'))
    .catch((e) => console.error('DB connect failed (continuing to boot):', e));
// public routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/merchants', merchantsRouter);
app.use('/api/v1/coupons', couponsRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/coupon-submissions', couponSubmissionsRouter);
// protect everything else
app.use('/api/v1', auth.required);
app.use('/api/v1/events', eventsRouter);
// global error handler (get JSON instead of opaque 500)
app.use((err, req, res, _next) => {
    console.error('❌ Uncaught error:', err);
    res.status(500).json({ error: err?.message || 'Server error' });
});
export default app;
