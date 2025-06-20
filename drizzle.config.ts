import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'node:fs';
import { parse } from 'pg-connection-string';

// pull pieces out of DATABASE_URL
const { host, port, database, user, password } = parse(process.env.DATABASE_URL!);

export default defineConfig({
  dialect: 'postgresql',
  schema: './server/src/schema.ts',
  out:    './drizzle',
  dbCredentials: {
    host,
    port: Number(port) || 5432,
    user,
    password,
    database,
    ssl: {
      ca: readFileSync('./server/certs/rds-ca.pem', 'utf8'),   // 👈 RDS CA bundle
      rejectUnauthorized: true
    }
  }
});
