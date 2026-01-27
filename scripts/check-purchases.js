#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const userEmail = process.argv[2] || 'tiviled369@gxuzi.com';
const action = process.argv[3]; // 'fix' to update pending to paid

function resolveSsl() {
  const p = path.resolve(process.cwd(), 'server/certs/us-east-1-bundle.pem');
  if (fs.existsSync(p)) {
    const caText = fs.readFileSync(p, 'utf8');
    return { rejectUnauthorized: true, minVersion: 'TLSv1.2', ca: caText };
  }
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

async function main() {
  const client = await pool.connect();
  try {
    console.log(`\n🔍 Checking purchases for: ${userEmail}\n`);
    
    const result = await client.query(
      `SELECT p.id, p.status, p.provider, p.stripe_checkout_id, p.created_at, u.email, fg.slug, fg.name as group_name
       FROM purchase p
       JOIN "user" u ON p.user_id = u.id
       JOIN foodie_group fg ON p.group_id = fg.id
       WHERE u.email = $1
       ORDER BY p.created_at DESC
       LIMIT 5`,
      [userEmail]
    );
    
    if (result.rows.length === 0) {
      console.log('No purchases found for this user.');
      return;
    }
    
    console.log('Recent purchases:');
    result.rows.forEach((row, idx) => {
      console.log(`\n  ${idx + 1}. ${row.group_name} (${row.slug})`);
      console.log(`     Status: ${row.status}`);
      console.log(`     Provider: ${row.provider}`);
      console.log(`     Checkout ID: ${row.stripe_checkout_id || 'N/A'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log(`     Purchase ID: ${row.id}`);
    });
    
    // Check for pending purchases
    const pendingPurchases = result.rows.filter(r => r.status === 'pending');
    
    if (pendingPurchases.length > 0 && action === 'fix') {
      console.log('\n🔧 Fixing pending purchases...');
      
      for (const purchase of pendingPurchases) {
        await client.query(
          `UPDATE purchase 
           SET status = 'paid', purchased_at = NOW(), updated_at = NOW()
           WHERE id = $1`,
          [purchase.id]
        );
        console.log(`   ✅ Updated purchase ${purchase.id} to 'paid'`);
      }
      
      console.log('\n✅ Done! User should now have access.');
    } else if (pendingPurchases.length > 0) {
      console.log('\n⚠️  Found pending purchases. Run with "fix" argument to update them:');
      console.log(`   node scripts/check-purchases.js ${userEmail} fix`);
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
