// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { readFileSync } from 'node:fs';
import { parse } from 'pg-connection-string';

const { host, port, database, user, password } = parse(process.env.DATABASE_URL!);

export default defineConfig({
  dialect: 'postgresql',

  // ← This is the TS file you write by hand (or pull)
  schema: './server/src/schema.ts',

  // ← This is where Drizzle will emit your migrations
  out:    './drizzle',

  dbCredentials: {
    host,
    port:     Number(port) || 5432,
    user,
    password,
    database,
    ssl: {
      ca:               readFileSync('./server/certs/rds-ca.pem', 'utf8'),
      rejectUnauthorized: true
    }
  },

});
