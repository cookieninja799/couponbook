// api/[...slug].js
import app from '../server/src/app.js';

/**
 * Vercel will call this for any /api/* request.
 * We delegate to our Express app.
 *
 * Path normalization: on Vercel, req.url can be a full URL or otherwise
 * not match what Express expects, so /api/v1/stripe/webhook might fall
 * through to the auth middleware and return 401. Normalize to pathname + query
 * so Express routes (including the public webhook) match correctly.
 */
export default function handler(req, res) {
  const raw = req.url || req.originalUrl || '/';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const u = new URL(raw);
      req.url = u.pathname + u.search;
    } catch (_) {
      // keep req.url as-is if parsing fails
    }
  } else if (!raw.startsWith('/')) {
    // some serverless envs pass path without leading slash
    req.url = '/' + raw.replace(/^\/+/, '');
  }
  return app(req, res);
}
