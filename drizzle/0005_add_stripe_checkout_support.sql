-- Migration: Add Stripe Checkout Support
-- Description: Adds purchase_provider enum, extends purchase table, creates coupon_book_price and payment_event tables

-- 1. Add purchase_provider enum
CREATE TYPE "public"."purchase_provider" AS ENUM('stripe', 'test');

-- 2. Extend purchase table with new columns
ALTER TABLE "purchase" ADD COLUMN "provider" purchase_provider DEFAULT 'stripe' NOT NULL;
ALTER TABLE "purchase" ADD COLUMN "stripe_customer_id" varchar(255);
ALTER TABLE "purchase" ADD COLUMN "stripe_payment_intent_id" varchar(255);
ALTER TABLE "purchase" ADD COLUMN "stripe_charge_id" varchar(255);
ALTER TABLE "purchase" ADD COLUMN "price_snapshot" jsonb;
ALTER TABLE "purchase" ADD COLUMN "metadata" jsonb;

-- 3. Make stripe_checkout_id nullable for legacy/test purchases
ALTER TABLE "purchase" ALTER COLUMN "stripe_checkout_id" DROP NOT NULL;

-- 4. Make purchased_at nullable (set when status becomes 'paid')
ALTER TABLE "purchase" ALTER COLUMN "purchased_at" DROP NOT NULL;

-- 5. Create coupon_book_price table (price history with active flag)
CREATE TABLE "coupon_book_price" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group_id" uuid NOT NULL REFERENCES "foodie_group"(id) ON DELETE CASCADE,
  "amount_cents" integer NOT NULL,
  "currency" varchar(10) NOT NULL DEFAULT 'usd',
  "is_active" boolean NOT NULL DEFAULT true,
  "stripe_product_id" varchar(255),
  "stripe_price_id" varchar(255),
  "created_by_user_id" uuid REFERENCES "user"(id) ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "archived_at" timestamp
);

-- Partial unique index: exactly one active price per group
CREATE UNIQUE INDEX "coupon_book_price_group_active_idx" 
ON "coupon_book_price" ("group_id") WHERE "is_active" = true;

-- 6. Create payment_event table (webhook idempotency + audit)
CREATE TABLE "payment_event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" varchar(32) NOT NULL,
  "event_id" varchar(255) NOT NULL UNIQUE,
  "event_type" varchar(255) NOT NULL,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "purchase_id" uuid REFERENCES "purchase"(id) ON DELETE SET NULL,
  "processed_at" timestamp,
  "processing_error" text,
  "payload" jsonb
);
