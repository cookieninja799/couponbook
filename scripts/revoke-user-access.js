#!/usr/bin/env node
/**
 * revoke-user-access.js
 * 
 * Revokes access for a user by changing their purchase status from 'paid' to 'refunded'.
 * This allows testing the purchase flow again.
 * 
 * Usage:
 *   node scripts/revoke-user-access.js <email> [--dry-run]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 * 
 * Example:
 *   node scripts/revoke-user-access.js tiviled369@gxuzi.com
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const userEmail = process.argv[2];
const isDryRun = process.argv.includes('--dry-run');

if (!userEmail) {
  console.error('❌ Error: Email address required');
  console.error('Usage: node scripts/revoke-user-access.js <email> [--dry-run]');
  process.exit(1);
}

// Resolve SSL config (same logic as server/src/db.js)
function resolveSsl() {
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

  console.warn('⚠️  No CA found, using rejectUnauthorized: false');
  return { rejectUnauthorized: false };
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: resolveSsl(),
});

async function revokeAccess() {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 Looking up user: ${userEmail}`);
    
    // Find user by email
    const userResult = await client.query(
      `SELECT id, email, name FROM "user" WHERE email = $1`,
      [userEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.error(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user.id}\n`);
    
    // Find all paid purchases for this user
    const purchasesResult = await client.query(
      `SELECT 
        p.id,
        p.group_id,
        p.status,
        p.provider,
        p.amount_cents,
        p.currency,
        p.purchased_at,
        fg.name as group_name,
        fg.slug as group_slug
      FROM purchase p
      JOIN foodie_group fg ON p.group_id = fg.id
      WHERE p.user_id = $1 AND p.status = 'paid'
      ORDER BY p.purchased_at DESC`,
      [user.id]
    );
    
    if (purchasesResult.rows.length === 0) {
      console.log('ℹ️  No paid purchases found for this user.');
      console.log('   Access is already revoked (or user never purchased).\n');
      return;
    }
    
    console.log(`📦 Found ${purchasesResult.rows.length} paid purchase(s):\n`);
    purchasesResult.rows.forEach((purchase, idx) => {
      const amount = (purchase.amount_cents / 100).toFixed(2);
      console.log(`   ${idx + 1}. ${purchase.group_name} (${purchase.group_slug})`);
      console.log(`      Purchase ID: ${purchase.id}`);
      console.log(`      Amount: $${amount} ${purchase.currency.toUpperCase()}`);
      console.log(`      Provider: ${purchase.provider}`);
      console.log(`      Purchased: ${purchase.purchased_at || 'N/A'}\n`);
    });
    
    if (isDryRun) {
      console.log('🔍 DRY RUN - No changes will be made\n');
      return;
    }
    
    // Update all paid purchases to 'refunded'
    const updateResult = await client.query(
      `UPDATE purchase 
       SET status = 'refunded',
           refunded_at = NOW(),
           updated_at = NOW()
       WHERE user_id = $1 AND status = 'paid'
       RETURNING id, group_id`,
      [user.id]
    );
    
    console.log(`✅ Revoked access for ${updateResult.rows.length} purchase(s)`);
    console.log('   Status changed from "paid" to "refunded"\n');
    console.log('🎯 User can now test the purchase flow again!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

revokeAccess().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
