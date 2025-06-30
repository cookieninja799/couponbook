import 'dotenv/config';
import { Client } from 'pg';
import fs from 'fs';

const ca = fs.readFileSync('./server/certs/us-east-1-root-only.pem');   // ⬅ path you just verified

console.log('CA bytes:', ca.length);  // should print about 3600

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    ca,
    rejectUnauthorized: true,
    servername: 'couponbook-instance-1.ch2ctwanaaas.us-east-1.rds.amazonaws.com',
  },
});

client.connect(err => {
  if (err) {
    console.error('❌  PG connect failed:', err);
  } else {
    console.log('✅  Postgres handshake, TLS + auth OK');
    client.end();
  }
});
