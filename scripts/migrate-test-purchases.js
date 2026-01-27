#!/usr/bin/env node
/**
 * migrate-test-purchases.js
 * 
 * Migrates existing test purchases to use the new provider='test' field
 * and clears out synthetic stripe_checkout_id values.
 * 
 * Usage:
 *   node scripts/migrate-test-purchases.js [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const isDryRun = process.argv.includes('--dry-run');

// Resolve SSL config (same logic as server/src/db.js)
function resolveSsl() {
  // Check for CA file in repo
  const candidates = [
    path.resolve(process.cwd(), 'server/certs/us-east-1-bundle.pem'),
    path.resolve(process.cwd(), 'server/certs/rds-combined-ca-bundle.pem'),
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const caText = fs.readFileSync(p, 'utf8');
      if (/-----BEGIN CERTIFICATE-----/.test(caText)) {
        console.log(`🔒 Using CA file: ${p}`);
        return { 
          rejectUnauthorized: true, 
          minVersion: 'TLSv1.2', 
          servername: process.env.DB_HOST || undefined, 
          ca: caText 
        };
      }
    }
  }

  // Fallback: allow without verification (dev only)
  console.warn('⚠️  No CA found, using rejectUnauthorized: false');
  return { rejectUnauthorized: false };
}

async function main() {
  console.log('🔄 Legacy Purchase Migration');
  console.log('============================');
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`);
  console.log('');

  const ssl = resolveSsl();

  // Create connection pool using discrete env vars
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl,
  });

  try {
    // 1) Find all purchases with synthetic test checkout IDs
    const findQuery = `
      SELECT id, user_id, group_id, stripe_checkout_id, status, provider, created_at
      FROM purchase
      WHERE stripe_checkout_id LIKE 'test-%'
    `;
    
    const { rows: testPurchases } = await pool.query(findQuery);
    
    console.log(`📋 Found ${testPurchases.length} test purchases to migrate`);
    console.log('');

    if (testPurchases.length === 0) {
      console.log('✅ No test purchases found. Nothing to migrate.');
      return;
    }

    // Show what will be updated
    console.log('Purchases to update:');
    console.log('--------------------');
    for (const p of testPurchases) {
      console.log(`  - ID: ${p.id}`);
      console.log(`    User: ${p.user_id}`);
      console.log(`    Group: ${p.group_id}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Current provider: ${p.provider || '(not set)'}`);
      console.log(`    Current stripe_checkout_id: ${p.stripe_checkout_id}`);
      console.log('');
    }

    if (isDryRun) {
      console.log('🔍 DRY RUN: No changes made.');
      console.log('   Run without --dry-run to apply changes.');
      return;
    }

    // 2) Update all test purchases
    const updateQuery = `
      UPDATE purchase 
      SET 
        provider = 'test',
        metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('migrated', true, 'originalCheckoutId', stripe_checkout_id),
        stripe_checkout_id = NULL,
        updated_at = NOW()
      WHERE stripe_checkout_id LIKE 'test-%'
      RETURNING id
    `;

    const { rows: updatedRows, rowCount } = await pool.query(updateQuery);

    console.log(`✅ Successfully migrated ${rowCount} purchases`);
    console.log('');

    // 3) Verify the changes
    const verifyQuery = `
      SELECT id, provider, stripe_checkout_id, metadata
      FROM purchase
      WHERE id = ANY($1::uuid[])
    `;
    
    const ids = updatedRows.map(r => r.id);
    const { rows: verifiedRows } = await pool.query(verifyQuery, [ids]);

    console.log('Verification:');
    console.log('-------------');
    for (const p of verifiedRows) {
      console.log(`  - ID: ${p.id}`);
      console.log(`    provider: ${p.provider}`);
      console.log(`    stripe_checkout_id: ${p.stripe_checkout_id || '(null)'}`);
      console.log('');
    }

    console.log('✅ Migration complete!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
