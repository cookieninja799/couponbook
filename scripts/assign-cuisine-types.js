// scripts/assign-cuisine-types.js
// One-time script to assign cuisine types to existing coupons based on merchant names

import { db } from '../server/src/db.js';
import { coupon } from '../server/src/schema.js';
import { eq } from 'drizzle-orm';

// Map merchant names to cuisine types
// Note: some merchant names use curly apostrophe (U+2019) instead of straight (U+0027)
const MERCHANT_CUISINE_MAP = {
  'The Heel and Horn': 'Bar & Grill',
  "Bella's Bistro": 'Italian',
  'Gourmet Delight': 'Contemporary',
  'Lime and Lemon Indian Grill': 'Indian',
  'Coco Bistro': 'Fusion',
  'Even Dough': 'Cafe',
  'Lucha Tigre': 'Fusion',
  'The Root Cellar': 'Farm-to-Table',
  "Brandwein's Bagels": 'Breakfast',        // straight apostrophe
  "Brandwein\u2019s Bagels": 'Breakfast',   // curly apostrophe U+2019
  "Bru's Public House": 'Bar & Grill',      // straight apostrophe
  "Bru\u2019s Public House": 'Bar & Grill', // curly apostrophe U+2019
  "Ram's Corner": 'Bar & Grill',            // straight apostrophe
  "Ram\u2019s Corner": 'Bar & Grill',       // curly apostrophe U+2019
  'Acme Widgets': 'Contemporary',
  'Coffee Corner': 'Cafe',
};

async function assignCuisineTypes() {
  console.log('🍽️  Fetching all coupons...');
  
  const allCoupons = await db
    .select({
      id: coupon.id,
      title: coupon.title,
      merchantId: coupon.merchantId,
      cuisineType: coupon.cuisineType,
    })
    .from(coupon);

  console.log(`📦  Found ${allCoupons.length} coupons`);

  // Get merchants to map IDs to names
  const { merchant } = await import('../server/src/schema.js');
  const merchants = await db.select().from(merchant);
  const merchantMap = Object.fromEntries(merchants.map(m => [m.id, m.name]));

  let updated = 0;
  let skipped = 0;

  for (const c of allCoupons) {
    const merchantName = merchantMap[c.merchantId];
    const cuisineType = MERCHANT_CUISINE_MAP[merchantName];

    if (!cuisineType) {
      console.log(`⚠️  No cuisine mapping for merchant: ${merchantName} (coupon: ${c.title})`);
      skipped++;
      continue;
    }

    if (c.cuisineType === cuisineType) {
      console.log(`✓  Already set: ${c.title} -> ${cuisineType}`);
      skipped++;
      continue;
    }

    console.log(`🔄  Updating: ${c.title} -> ${cuisineType}`);
    
    await db
      .update(coupon)
      .set({ cuisineType })
      .where(eq(coupon.id, c.id));

    updated++;
  }

  console.log('\n✅ Done!');
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);

  process.exit(0);
}

assignCuisineTypes().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
