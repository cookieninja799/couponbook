// api/[...slug].js
import app from '../server/src/index.js';

/**
 * Vercel will call this for any /api/* request.
 * We simply delegate to our Express app.
 */
export default function handler(req, res) {
  // express apps are callable as (req, res)
  return app(req, res);
}

// (optional) you can force Node 18 runtime, but Vercel defaults to that:
// export const config = { runtime: 'nodejs18.x' };
