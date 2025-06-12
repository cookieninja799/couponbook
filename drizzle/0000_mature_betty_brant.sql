CREATE TYPE "public"."attendance_status" AS ENUM('going', 'waitlist', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."coupon_type" AS ENUM('percent', 'amount', 'bogo', 'free_item');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('created', 'pending', 'paid', 'expired', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'merchant', 'customer');--> statement-breakpoint
CREATE TYPE "public"."submission_state" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "coupon_redemption" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"redeemed_at" timestamp DEFAULT now() NOT NULL,
	"location_meta" jsonb,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coupon_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"merchant_id" uuid,
	"state" "submission_state" NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submission_data" jsonb NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"coupon_type" "coupon_type" NOT NULL,
	"discount_value" double precision NOT NULL,
	"valid_from" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"qr_code_url" varchar(500),
	"locked" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_rsvp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"attendees" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"merchant_id" uuid,
	"state" "submission_state" NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"submission_data" jsonb NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"start_datetime" timestamp NOT NULL,
	"end_datetime" timestamp,
	"location" varchar(255),
	"capacity" integer NOT NULL,
	"cover_image_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "foodie_group_membership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "foodie_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"location" varchar(255),
	"banner_image_url" varchar(500),
	"map" jsonb,
	"social_links" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "foodie_group_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "merchant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"owner_id" uuid NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"stripe_checkout_id" varchar(255) NOT NULL,
	"stripe_subscription_id" varchar(255),
	"amount_cents" integer NOT NULL,
	"currency" varchar(10) NOT NULL,
	"status" "purchase_status" NOT NULL,
	"purchased_at" timestamp NOT NULL,
	"expires_at" timestamp,
	"refunded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_stripe_checkout_id_unique" UNIQUE("stripe_checkout_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cognito_sub" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "user_cognito_sub_unique" UNIQUE("cognito_sub"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_submission" ADD CONSTRAINT "coupon_submission_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_submission" ADD CONSTRAINT "coupon_submission_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvp" ADD CONSTRAINT "event_rsvp_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submission" ADD CONSTRAINT "event_submission_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_submission" ADD CONSTRAINT "event_submission_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_merchant_id_merchant_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchant"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ADD CONSTRAINT "foodie_group_membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foodie_group_membership" ADD CONSTRAINT "foodie_group_membership_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant" ADD CONSTRAINT "merchant_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase" ADD CONSTRAINT "purchase_group_id_foodie_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."foodie_group"("id") ON DELETE no action ON UPDATE no action;