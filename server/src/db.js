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

// --- helpers ---
function splitCertBlocks(pemText) {
  if (!pemText) return [];
  const txt = pemText.replace(/\r\n/g, '\n');
  const blocks = txt.match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g) || [];
  return blocks.map(b => b.trim() + '\n');
}

function guessServername() {
  try {
    if (process.env.DATABASE_URL) {
      const u = new URL(process.env.DATABASE_URL.replace('postgres://', 'postgresql://'));
      return u.hostname;
    }
  } catch {}
  return process.env.DB_HOST || undefined;
}

function resolveSsl() {
  // 1) Highest priority: inline certs via env (PG_CA_CERT or PG_SSL_CA)
  for (const varName of ['PG_CA_CERT', 'PG_SSL_CA']) {
    const val = process.env[varName]?.trim();
    if (val) {
      const ca = splitCertBlocks(val);
      console.log(`🔒 Using CA from ${varName} (${ca.length} cert${ca.length !== 1 ? 's' : ''})`);
      return { rejectUnauthorized: true, minVersion: 'TLSv1.2', servername: guessServername(), ca };
    }
  }

  // 2) Next: a file path in env (PG_CA_FILE)
  const pathVar = process.env.PG_CA_FILE?.trim();
  if (pathVar && fs.existsSync(pathVar)) {
    const ca = splitCertBlocks(fs.readFileSync(pathVar, 'utf8'));
    console.log(`🔒 Using CA file from PG_CA_FILE=${pathVar} (${ca.length} cert${ca.length !== 1 ? 's' : ''})`);
    return { rejectUnauthorized: true, minVersion: 'TLSv1.2', servername: guessServername(), ca };
  }

  // 3) Fall back to known repo paths (both dev & dist)
  const candidates = [
    // when running from repo root in dev
    path.resolve(process.cwd(), 'server/certs/rds-min-clean.pem'),
    path.resolve(process.cwd(), 'server/certs/rds-combined-ca-bundle.pem'),
    path.resolve(process.cwd(), 'server/certs/us-east-1-bundle.pem'),
    path.resolve(process.cwd(), 'server/certs/us-east-1-root-only.pem'),

    // when running out of server-dist on Vercel
    path.resolve(__dirname, './certs/us-east-1-bundle.pem'),
    path.resolve(__dirname, './certs/us-east-1-root-only.pem'),
  ];

  console.log('🔎 SSL CA candidates:\n - ' + candidates.join('\n - '));
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const caBlocks = splitCertBlocks(fs.readFileSync(p, 'utf8'));
      if (caBlocks.length > 0) {
        console.log(`✅ Using CA file: ${p} (${caBlocks.length} cert${caBlocks.length !== 1 ? 's' : ''})`);
        return { rejectUnauthorized: true, minVersion: 'TLSv1.2', servername: guessServername(), ca: caBlocks };
      }
      console.warn(`⚠️  CA file had 0 cert blocks: ${p}`);
    }
  }

  // 4) Dev‑only escape hatch
  if (process.env.PG_SSL_ALLOW_NO_CA === '1') {
    console.warn('⚠️  PG_SSL_ALLOW_NO_CA=1 → allowing SSL without CA (dev only)');
    return { rejectUnauthorized: false, minVersion: 'TLSv1.2', servername: guessServername() };
  }

  console.warn('⚠️  No CA found. Proceeding without SSL (not recommended).');
  return undefined;
}

const ssl = resolveSsl();

// Build pool config (normalize URL scheme)
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL.replace('postgres://', 'postgresql://'), ssl }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      ssl,
    };

// Short timeouts so lambdas fail fast
export const pool = new Pool({
  ...poolConfig,
  connectionTimeoutMillis: 2000,
  query_timeout: 5000,
});

// Optional: set server-side statement timeout per connection
pool.on('connect', (client) => {
  client.query('SET statement_timeout = 5000').catch(() => {});
});

export const db = drizzle(pool, { schema });

export async function connectDB() {
  const client = await pool.connect();
  client.release();
  console.log('🟢  Drizzle connected');
}
