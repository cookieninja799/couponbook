// server/src/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./db');
const auth    = require('./middleware/auth');

const couponsRouter = require('./routes/coupons');
const eventsRouter  = require('./routes/events');
const groupsRouter  = require('./routes/groups');
const usersRouter   = require('./routes/users');

;(async () => {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  // health check
  app.get('/health', (req, res) => res.json({ ok: true }));

  // Public user routes (register/login)
  app.use('/api/v1/users', usersRouter);

  // Protect everything else
  app.use('/api/v1', auth.required);

  app.use('/api/v1/coupons', couponsRouter);
  app.use('/api/v1/events',  eventsRouter);
  app.use('/api/v1/groups',  groupsRouter);
  // (you can mount other routers here)

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () =>
    console.log(`🚀  Server listening on http://localhost:${PORT}`)
  );
})();
