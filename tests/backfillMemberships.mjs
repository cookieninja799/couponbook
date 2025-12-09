//npx tsx tests/backfillMemberships.mjs
import 'dotenv/config';
import { db } from '../server/src/db.js';
import { purchase, foodieGroupMembership } from '../server/src/schema.js';
import { and, eq } from 'drizzle-orm';

async function ensureFoodieGroupMembership(userId, groupId) {
  const [existing] = await db
    .select()
    .from(foodieGroupMembership)
    .where(
      and(
        eq(foodieGroupMembership.userId, userId),
        eq(foodieGroupMembership.groupId, groupId)
      )
    );

  if (!existing) {
    await db.insert(foodieGroupMembership).values({
      userId,
      groupId,
      role: 'customer',
      joinedAt: new Date().toISOString(),
    });
  }
}

async function run() {
  const purchasesRows = await db
    .select()
    .from(purchase)
    .where(eq(purchase.status, 'paid'));

  for (const p of purchasesRows) {
    await ensureFoodieGroupMembership(p.userId, p.groupId);
  }

  console.log('Backfill complete.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});