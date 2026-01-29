CREATE TYPE "public"."purchase_provider" AS ENUM('stripe', 'test');--> statement-breakpoint
CREATE TABLE "coupon_book_price" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'usd' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"stripe_product_id" varchar(255),
	"stripe_price_id" varchar(255),
	"created_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payment_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" varchar(32) NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(255) NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"purchase_id" uuid,
	"processed_at" timestamp,
	"processing_error" text,
	"payload" jsonb,
	CONSTRAINT "payment_event_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ALTER COLUMN "role" SET DEFAULT 'customer'::text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer'::text;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'merchant', 'customer', 'foodie_group_admin');--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ALTER COLUMN "role" SET DEFAULT 'customer'::"public"."role";--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'customer'::"public"."role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "stripe_checkout_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase" ALTER COLUMN "purchased_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_submission" ADD COLUMN "rejection_message" text;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "provider" "purchase_provider" DEFAULT 'stripe' NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "stripe_payment_intent_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "stripe_charge_id" varchar(255);--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "price_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "purchase" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "coupon_book_price" ADD CONSTRAINT "coupon_book_price_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_book_price" ADD CONSTRAINT "coupon_book_price_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_event" ADD CONSTRAINT "payment_event_purchase_id_purchase_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchase"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_coupon_unique" UNIQUE("coupon_id","user_id");