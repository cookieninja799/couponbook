#!/usr/bin/env node
/**
 * wipe-user-purchases.js
 *
 * Hard-deletes a user's purchase history (any status) so you can re-test checkout.
 * Also deletes related Stripe webhook audit rows in `payment_event` to keep replay/idempotency clean.
 * Optionally soft-deletes the user's `foodie_group_membership` rows with role='customer' so access gating resets.
 *
 * Usage:
 *   node scripts/wipe-user-purchases.js --email <email> [options]
 *   node scripts/wipe-user-purchases.js --user-id <uuid> [options]
 *   node scripts/wipe-user-purchases.js <email-or-user-id> [options]
 *
 * Options:
 *   --dry-run            Show what would be deleted without making changes
 *   --group-id <uuid>    Limit to a specific foodie group id
 *   --group-slug <slug>  Limit to a specific foodie group slug
 *   --keep-memberships   Do NOT touch foodie_group_membership rows
 *
 * Examples:
 *   node scripts/wipe-user-purchases.js tiviled369@gxuzi.com --dry-run
 *   node scripts/wipe-user-purchases.js --email tiviled369@gxuzi.com
 *   node scripts/wipe-user-purchases.js --user-id 11111111-2222-3333-4444-555555555555 --group-slug chapel-hill
 */

import 'dotenv/config';
import { pool } from '../server/src/db.js';

function isUuid(s) {
  return typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    dryRun: false,
    email: null,
    userId: null,
    groupId: null,
    groupSlug: null,
    keepMemberships: false,
  };

  // Positional: first token if it doesn't start with --
  const first = args.find((a) => a && !a.startsWith('--'));
  if (first) {
    if (isUuid(first)) opts.userId = first;
    else opts.email = first;
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--keep-memberships') opts.keepMemberships = true;
    else if (a === '--email') opts.email = args[++i] || null;
    else if (a === '--user-id') opts.userId = args[++i] || null;
    else if (a === '--group-id') opts.groupId = args[++i] || null;
    else if (a === '--group-slug') opts.groupSlug = args[++i] || null;
  }

  return opts;
}

function usageAndExit(message) {
  if (message) console.error(`❌ ${message}`);
  console.error('\nUsage:');
  console.error('  node scripts/wipe-user-purchases.js --email <email> [--dry-run] [--group-id <uuid> | --group-slug <slug>] [--keep-memberships]');
  console.error('  node scripts/wipe-user-purchases.js --user-id <uuid> [--dry-run] [--group-id <uuid> | --group-slug <slug>] [--keep-memberships]');
  process.exit(1);
}

async function main() {
  const opts = parseArgs(process.argv);

  if (!opts.email && !opts.userId) {
    usageAndExit('Email or user id is required.');
  }
  if (opts.userId && !isUuid(opts.userId)) {
    usageAndExit('Invalid --user-id (expected UUID).');
  }
  if (opts.groupId && !isUuid(opts.groupId)) {
    usageAndExit('Invalid --group-id (expected UUID).');
  }
  if (opts.groupId && opts.groupSlug) {
    usageAndExit('Use only one of --group-id or --group-slug.');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1) Resolve user
    const userRes = opts.userId
      ? await client.query(`SELECT id, email, name FROM "user" WHERE id = $1`, [opts.userId])
      : await client.query(`SELECT id, email, name FROM "user" WHERE email = $1`, [opts.email]);

    if (userRes.rows.length === 0) {
      usageAndExit(`User not found (${opts.userId ? opts.userId : opts.email}).`);
    }

    const user = userRes.rows[0];
    console.log(`\n👤 User: ${user.name} <${user.email}>`);
    console.log(`   ID: ${user.id}`);

    // 2) Resolve group filter (optional)
    let groupId = opts.groupId;
    let groupLabel = null;
    if (!groupId && opts.groupSlug) {
      const gRes = await client.query(
        `SELECT id, slug, name FROM foodie_group WHERE slug = $1`,
        [opts.groupSlug]
      );
      if (gRes.rows.length === 0) {
        usageAndExit(`Foodie group not found for slug "${opts.groupSlug}".`);
      }
      groupId = gRes.rows[0].id;
      groupLabel = `${gRes.rows[0].name} (${gRes.rows[0].slug})`;
    } else if (groupId) {
      const gRes = await client.query(
        `SELECT id, slug, name FROM foodie_group WHERE id = $1`,
        [groupId]
      );
      if (gRes.rows.length > 0) {
        groupLabel = `${gRes.rows[0].name} (${gRes.rows[0].slug})`;
      }
    }
    if (groupId) {
      console.log(`\n🎯 Scope limited to group: ${groupLabel || groupId}`);
    }

    // 3) Preview purchases
    const purchasesRes = await client.query(
      `SELECT
         p.id,
         p.status,
         p.provider,
         p.stripe_checkout_id,
         p.amount_cents,
         p.currency,
         p.created_at,
         p.purchased_at,
         p.refunded_at,
         fg.name AS group_name,
         fg.slug AS group_slug
       FROM purchase p
       JOIN foodie_group fg ON fg.id = p.group_id
       WHERE p.user_id = $1
         ${groupId ? 'AND p.group_id = $2' : ''}
       ORDER BY p.created_at DESC`,
      groupId ? [user.id, groupId] : [user.id]
    );

    const purchases = purchasesRes.rows;
    console.log(`\n🧾 Purchases found: ${purchases.length}`);
    if (purchases.length) {
      const byStatus = {};
      for (const p of purchases) byStatus[p.status] = (byStatus[p.status] || 0) + 1;
      console.log('   By status:', byStatus);
      console.log('\n   Most recent:');
      purchases.slice(0, 5).forEach((p, idx) => {
        const amount = p.amount_cents != null ? (p.amount_cents / 100).toFixed(2) : '0.00';
        console.log(`   ${idx + 1}. ${p.group_name} (${p.group_slug})`);
        console.log(`      Purchase ID: ${p.id}`);
        console.log(`      Status: ${p.status}`);
        console.log(`      Provider: ${p.provider}`);
        console.log(`      Amount: ${amount} ${String(p.currency || '').toUpperCase()}`);
        console.log(`      Checkout ID: ${p.stripe_checkout_id || '—'}`);
        console.log(`      Created: ${p.created_at}`);
      });
      if (purchases.length > 5) console.log(`   … and ${purchases.length - 5} more`);
    }

    // 4) Preview payment events (by purchase_id + by webhook payload.metadata.userId)
    const paymentEventRes = await client.query(
      `SELECT count(*)::int AS count
       FROM payment_event
       WHERE (payload->'metadata'->>'userId') = $1
         ${groupId ? `AND (payload->'metadata'->>'groupId') = $2` : ''}`,
      groupId ? [user.id, groupId] : [user.id]
    );
    const paymentEventsByMetadata = paymentEventRes.rows[0]?.count ?? 0;

    const purchaseIds = purchases.map((p) => p.id);
    let paymentEventsByPurchaseId = 0;
    if (purchaseIds.length) {
      const peRes2 = await client.query(
        `SELECT count(*)::int AS count
         FROM payment_event
         WHERE purchase_id = ANY($1::uuid[])`,
        [purchaseIds]
      );
      paymentEventsByPurchaseId = peRes2.rows[0]?.count ?? 0;
    }

    console.log(`\n🪝 payment_event rows (by payload.metadata.userId): ${paymentEventsByMetadata}`);
    console.log(`🪝 payment_event rows (by purchase_id): ${paymentEventsByPurchaseId}`);

    // 5) Preview memberships (optional)
    let membershipCount = 0;
    if (!opts.keepMemberships) {
      const memRes = await client.query(
        `SELECT count(*)::int AS count
         FROM foodie_group_membership
         WHERE user_id = $1
           AND role = 'customer'
           AND deleted_at IS NULL
           ${groupId ? 'AND group_id = $2' : ''}`,
        groupId ? [user.id, groupId] : [user.id]
      );
      membershipCount = memRes.rows[0]?.count ?? 0;
      console.log(`\n👥 Active customer memberships to soft-delete: ${membershipCount}`);
    } else {
      console.log('\n👥 Memberships: unchanged (--keep-memberships)');
    }

    if (opts.dryRun) {
      console.log('\n🔍 DRY RUN: no changes made.');
      await client.query('ROLLBACK');
      return;
    }

    // 6) Delete payment_event rows (first: those linked to purchases; then: those linked by metadata)
    if (purchaseIds.length) {
      const delPeByPurchase = await client.query(
        `DELETE FROM payment_event
         WHERE purchase_id = ANY($1::uuid[])
         RETURNING id`,
        [purchaseIds]
      );
      console.log(`\n🗑️  Deleted payment_event (by purchase_id): ${delPeByPurchase.rowCount}`);
    }

    const delPeByMetadata = await client.query(
      `DELETE FROM payment_event
       WHERE (payload->'metadata'->>'userId') = $1
         ${groupId ? `AND (payload->'metadata'->>'groupId') = $2` : ''}
       RETURNING id`,
      groupId ? [user.id, groupId] : [user.id]
    );
    console.log(`🗑️  Deleted payment_event (by payload.metadata.userId): ${delPeByMetadata.rowCount}`);

    // 7) Delete purchases (any status)
    const delPurchases = await client.query(
      `DELETE FROM purchase
       WHERE user_id = $1
         ${groupId ? 'AND group_id = $2' : ''}
       RETURNING id`,
      groupId ? [user.id, groupId] : [user.id]
    );
    console.log(`🗑️  Deleted purchases: ${delPurchases.rowCount}`);

    // 8) Soft-delete memberships (role='customer') so access gating resets
    if (!opts.keepMemberships) {
      const updMem = await client.query(
        `UPDATE foodie_group_membership
         SET deleted_at = NOW()
         WHERE user_id = $1
           AND role = 'customer'
           AND deleted_at IS NULL
           ${groupId ? 'AND group_id = $2' : ''}
         RETURNING id`,
        groupId ? [user.id, groupId] : [user.id]
      );
      console.log(`🧹 Soft-deleted customer memberships: ${updMem.rowCount}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Done. User purchase history has been wiped on our end.');
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {}
    console.error('\n❌ Error wiping purchases:', err?.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    // Important: since we import the server pool, explicitly close it for scripts.
    await pool.end();
  }
}

main().catch(async (err) => {
  console.error('\n❌ Fatal error:', err);
  try { await pool.end(); } catch {}
  process.exit(1);
});

