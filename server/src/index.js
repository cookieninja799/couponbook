// server/src/index.js
import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { connectDB } from './db.js';
import * as auth     from './middleware/auth.js';
import usersRouter   from './routes/users.js';
import couponsRouter from './routes/coupons.js';
import eventsRouter  from './routes/events.js';
import groupsRouter  from './routes/groups.js';
import merchantRouter from './routes/merchants.js'
/* ─────────────────────────────────────────
   Kick-off
────────────────────────────────────────── */
await connectDB();                 // top-level await (Node ≥ 14.8 ESM)

const app = express();
app.use(cors());
app.use(express.json());

/* health check */
app.get('/health', (_req, res) => res.json({ ok: true }));

// right here, before any app.use…

/* public user routes (signup / login) */
app.use('/api/v1/users', usersRouter);
app.use("/api/merchants", merchantsRouter);
app.use('/api/v1/coupons', couponsRouter);
/* protect everything else */
app.use('/api/v1', auth.required);
app.use('/api/v1/events',  eventsRouter);
app.use('/api/v1/groups',  groupsRouter);
/* add more routers here */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀  Server listening on http://localhost:${PORT}`)
);
