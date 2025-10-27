// server/src/pg-direct-test.js
import fs from 'node:fs';
import { Client } from 'pg';
const ca = fs.readFileSync('server/certs/us-east-1-rds-ca-rsa2048-g1.bundle.pem','utf8');
const client = new Client({
  host: process.env.DB_HOST,
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { ca, rejectUnauthorized: true, servername: process.env.DB_HOST },
});
await client.connect();
console.log('✅ direct pg connected with raw CA');
await client.end();
