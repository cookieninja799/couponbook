#!/usr/bin/env node
/**
 * Run Stripe-related migrations (0005 and 0006) against the database.
 * Uses DATABASE_URL. For production, run with production DATABASE_URL set.
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." node scripts/run-stripe-migrations.js
 *   node scripts/run-stripe-migrations.js   # uses .env if dotenv loads it
 *
 * Options:
 *   --dry-run       Print SQL that would be run without executing
 *   --no-verify-ssl Skip SSL certificate verification (use only on trusted networks)
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { parse as parsePgUrl } from 'pg-connection-string';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const isDryRun = process.argv.includes('--dry-run');
const noVerifySsl = process.argv.includes('--no-verify-ssl');

function getHostnameFromUrl(url) {
  try {
    const u = new URL(url.replace(/^postgres:\/\//, 'postgresql://'));
    return u.hostname;
  } catch {
    return undefined;
  }
}

function resolveSsl(connectionUrl) {
  const servername = getHostnameFromUrl(connectionUrl);
  // Allow skipping CA verification for one-off migrations (e.g. trusted network)
  if (noVerifySsl || process.env.PG_SSL_ALLOW_NO_CA === '1') {
    return { rejectUnauthorized: false, servername };
  }
  if (process.env.PG_CA_CERT?.trim()) {
    return { rejectUnauthorized: true, ca: process.env.PG_CA_CERT.trim(), servername };
  }
  if (process.env.PG_CA_FILE?.trim() && fs.existsSync(process.env.PG_CA_FILE)) {
    return { rejectUnauthorized: true, ca: fs.readFileSync(process.env.PG_CA_FILE, 'utf8'), servername };
  }
  const certDir = path.resolve(__dirname, '..', 'server', 'certs');
  const candidates = [
    path.join(certDir, 'rds-ca.pem'),
    path.join(certDir, 'rds-combined-ca-bundle.pem'),
    path.join(certDir, 'us-east-1-bundle.pem'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const ca = fs.readFileSync(p, 'utf8');
      if (/-----BEGIN CERTIFICATE-----/.test(ca)) {
        return { rejectUnauthorized: true, ca, servername };
      }
    }
  }
  return undefined;
}

function parseStatements(sql) {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      const withoutComments = s
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
      return withoutComments.length > 0;
    });
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is required. Set it in the environment or in .env');
    process.exit(1);
  }

  const url = dbUrl.replace(/^postgres:\/\//, 'postgresql://');
  const ssl = resolveSsl(url);

  const migrationDir = path.resolve(__dirname, '..', 'drizzle');
  const sql5 = fs.readFileSync(path.join(migrationDir, '0005_add_stripe_checkout_support.sql'), 'utf8');
  const sql6 = fs.readFileSync(path.join(migrationDir, '0006_add_membership_unique_constraint.sql'), 'utf8');

  const statements5 = parseStatements(sql5);
  const statements6 = parseStatements(sql6);

  console.log('Stripe migrations (0005 + 0006)');
  console.log('==============================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log(`Migration 0005: ${statements5.length} statement(s)`);
  console.log(`Migration 0006: ${statements6.length} statement(s)`);
  console.log('');

  if (isDryRun) {
    console.log('-- 0005_add_stripe_checkout_support.sql');
    statements5.forEach((s, i) => console.log(`-- statement ${i + 1}\n${s};\n`));
    console.log('-- 0006_add_membership_unique_constraint.sql');
    statements6.forEach((s, i) => console.log(`-- statement ${i + 1}\n${s};\n`));
    console.log('Dry run complete.');
    return;
  }

  let clientConfig;
  if (noVerifySsl || process.env.PG_SSL_ALLOW_NO_CA === '1') {
    // Use discrete options so connectionString ssl params don't override our rejectUnauthorized: false
    const parsed = parsePgUrl(url);
    clientConfig = {
      host: parsed.host,
      port: Number(parsed.port || 5432),
      user: parsed.user,
      password: parsed.password,
      database: (parsed.pathname || '/').replace(/^\//, '') || parsed.database,
      ssl: { rejectUnauthorized: false },
    };
  } else {
    clientConfig = {
      connectionString: url,
      ssl: ssl ?? (url.includes('localhost') ? false : { rejectUnauthorized: false }),
    };
  }
  const client = new Client(clientConfig);

  try {
    await client.connect();
    console.log('Connected to database.\n');

    const runStatement = async (sql, label) => {
      try {
        await client.query(sql + ';');
        return { ok: true };
      } catch (e) {
        const msg = (e.message || '').toLowerCase();
        const code = e.code || '';
        const alreadyExists =
          code === '42P07' || /* duplicate_object (type, table, etc.) */
          code === '42710' || /* duplicate_object (e.g. index) */
          code === '42701' || /* duplicate_column */
          msg.includes('already exists');
        if (alreadyExists) {
          return { ok: true, skipped: true };
        }
        throw e;
      }
    };

    console.log('Running 0005_add_stripe_checkout_support.sql ...');
    for (let i = 0; i < statements5.length; i++) {
      const r = await runStatement(statements5[i], `5.${i + 1}`);
      console.log(
        r.skipped ? `  ⏭ statement ${i + 1}/${statements5.length} (already exists)` : `  ✓ statement ${i + 1}/${statements5.length}`,
      );
    }
    console.log('  Done.\n');

    console.log('Running 0006_add_membership_unique_constraint.sql ...');
    for (let i = 0; i < statements6.length; i++) {
      const r = await runStatement(statements6[i], `6.${i + 1}`);
      console.log(
        r.skipped ? `  ⏭ statement ${i + 1}/${statements6.length} (already exists)` : `  ✓ statement ${i + 1}/${statements6.length}`,
      );
    }
    console.log('  Done.\n');

    console.log('✅ Migrations completed successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
