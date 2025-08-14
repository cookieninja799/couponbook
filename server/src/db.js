// server/src/db.js
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function resolveSsl() {
    if (process.env.PG_CA_CERT?.trim()) {
      console.log('🔒 Using CA from PG_CA_CERT env var');
      return { rejectUnauthorized: true, ca: process.env.PG_CA_CERT };
    }
  
    const candidates = [
      // when running from server-dist, this points to the bundled file
      path.resolve(__dirname, '../server/certs/rds-combined-ca-bundle.pem'),
      // when running from repo root in dev
      path.resolve(process.cwd(), 'server/certs/rds-combined-ca-bundle.pem'),
      // optional alternate
      path.resolve(process.cwd(), 'certs/rds-combined-ca-bundle.pem'),
    ];
  
    console.log('🔎 SSL CA candidates:\n - ' + candidates.join('\n - '));
    for (const p of candidates) {
      if (fs.existsSync(p)) {
        console.log('✅ Using CA file:', p);
        return { rejectUnauthorized: true, ca: fs.readFileSync(p, 'utf8') };
      }
    }
  
    if (process.env.PG_SSL_ALLOW_NO_CA === '1') {
      console.warn('⚠️  PG_SSL_ALLOW_NO_CA=1 → allowing SSL without CA (dev only)');
      return { rejectUnauthorized: false };
    }
  
    console.warn('⚠️  No CA found. Proceeding without SSL.');
    return undefined;
  }
const ssl = resolveSsl();
const poolConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl,
    };
// ✅ Add fast timeouts so the lambda fails fast instead of hanging
export const pool = new Pool({
    ...poolConfig,
    connectionTimeoutMillis: 2000, // 2s to establish TCP/TLS
    query_timeout: 5000,           // 5s per query
});
// Optional: set a server-side statement timeout on each new connection
pool.on('connect', (client) => {
    client.query('SET statement_timeout = 5000').catch(() => {});
  });
  
export const db = drizzle(pool, { schema });
export async function connectDB() {
    const client = await pool.connect(); // throws if unreachable
    client.release();
    console.log('🟢  Drizzle connected');
}
