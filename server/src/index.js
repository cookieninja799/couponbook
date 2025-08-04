// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { connectDB } from './db.js';
import * as auth     from './middleware/auth.js';
import usersRouter   from './routes/users.js';
import couponsRouter from './routes/coupons.js';
import eventsRouter  from './routes/events.js';
import groupsRouter  from './routes/foodieGroups.js';
import merchantsRouter from './routes/merchants.js'
import couponSubmissionsRouter from './routes/couponSubmissions.js';

/* ─────────────────────────────────────────
   Kick-off
────────────────────────────────────────── */
await connectDB();                 // top-level await (Node ≥ 14.8 ESM)

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

/* health check */
app.get('/health', (_req, res) => res.json({ ok: true }));

// right here, before any app.use…

/* public user routes (signup / login) */
app.use('/api/v1/users', usersRouter);
app.use("/api/v1/merchants", merchantsRouter);
app.use('/api/v1/coupons', couponsRouter);
app.use('/api/v1/groups',  groupsRouter);
app.use('/api/v1/coupon-submissions', couponSubmissionsRouter);
/* protect everything else */
app.use('/api/v1', auth.required);
app.use('/api/v1/events',  eventsRouter);
/* add more routers here */

/*const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀  Server listening on ${PORT}`)
);*/

export default app;

//module.exports = app;