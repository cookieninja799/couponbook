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
    if (process.env.PG_CA_CERT && process.env.PG_CA_CERT.trim()) {
        console.log('🔒 Using CA from PG_CA_CERT env var');
        return { rejectUnauthorized: true, ca: process.env.PG_CA_CERT };
    }
    const candidates = [
        path.resolve(__dirname, '../server/certs/rds-combined-ca-bundle.pem'),
        path.resolve(process.cwd(), 'server/certs/rds-combined-ca-bundle.pem'),
        path.resolve(process.cwd(), 'certs/rds-combined-ca-bundle.pem'),
    ];
    for (const p of candidates) {
        if (fs.existsSync(p)) {
            console.log('🔒 Loaded RDS CA from', p);
            return { rejectUnauthorized: true, ca: fs.readFileSync(p, 'utf8') };
        }
    }
    if (process.env.PG_SSL_ALLOW_NO_CA === '1') {
        console.warn('⚠️  PG_SSL_ALLOW_NO_CA=1 — SSL without CA (LOCAL ONLY)');
        return { rejectUnauthorized: false };
    }
    console.warn('⚠️  No CA provided. Proceeding without SSL.');
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
export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
export async function connectDB() {
    const client = await pool.connect(); // throws if unreachable
    client.release();
    console.log('🟢  Drizzle connected');
}
