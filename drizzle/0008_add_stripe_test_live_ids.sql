-- Migration: Add separate test and live Stripe ID columns
-- This allows the same database to work across test and production environments
-- by storing both test and live Stripe IDs and selecting based on STRIPE_MODE

-- Add new columns for test and live Stripe IDs
ALTER TABLE "coupon_book_price" 
  ADD COLUMN "stripe_product_id_test" varchar(255),
  ADD COLUMN "stripe_price_id_test" varchar(255),
  ADD COLUMN "stripe_product_id_live" varchar(255),
  ADD COLUMN "stripe_price_id_live" varchar(255);

-- Migrate existing data: if current IDs are test IDs, move to test columns
-- Note: This assumes your current data uses test IDs (based on sk_test_ in .env)
UPDATE "coupon_book_price"
SET 
  "stripe_product_id_test" = "stripe_product_id",
  "stripe_price_id_test" = "stripe_price_id"
WHERE "stripe_product_id" LIKE '%_test_%' OR "stripe_price_id" LIKE '%_test_%';

-- If any existing IDs are live IDs, move to live columns
UPDATE "coupon_book_price"
SET 
  "stripe_product_id_live" = "stripe_product_id",
  "stripe_price_id_live" = "stripe_price_id"
WHERE 
  ("stripe_product_id" NOT LIKE '%_test_%' AND "stripe_product_id" IS NOT NULL)
  OR ("stripe_price_id" NOT LIKE '%_test_%' AND "stripe_price_id" IS NOT NULL);

-- Keep the old columns for backward compatibility (can be dropped in a future migration)
-- This allows gradual rollout without breaking existing code
