// server/src/dev.js
import 'dotenv/config';
import { connectDB } from './db.js';
import app from './app.js';

/* ─────────────────────────────────────────
   Kick-off
   ────────────────────────────────────────── */
console.log('🚀 Starting local dev server...');

try {
  await connectDB();
  console.log('✅ DB connected');
} catch (e) {
  console.error('❌ DB connect failed:', e);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀  Server listening on http://localhost:${PORT}`);
  console.log(`📡  Health check: http://localhost:${PORT}/api/health`);
});
