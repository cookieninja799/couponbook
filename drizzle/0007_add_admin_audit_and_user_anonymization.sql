-- Migration: Add Admin Audit Log and User Anonymization Support
-- Description: Creates admin_audit_log table for tracking god-mode actions
--              and adds anonymization tracking fields to user table

-- 1. Create admin_audit_log table for tracking super admin actions
CREATE TABLE "admin_audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_user_id" uuid NOT NULL REFERENCES "user"(id),
  "action" varchar(100) NOT NULL,
  "target_type" varchar(50) NOT NULL,
  "target_id" varchar(255) NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Index for querying audit log by actor
CREATE INDEX "admin_audit_log_actor_idx" ON "admin_audit_log" ("actor_user_id");

-- Index for querying audit log by target
CREATE INDEX "admin_audit_log_target_idx" ON "admin_audit_log" ("target_type", "target_id");

-- Index for time-based queries
CREATE INDEX "admin_audit_log_created_at_idx" ON "admin_audit_log" ("created_at" DESC);

-- 2. Add anonymization tracking fields to user table
ALTER TABLE "user" ADD COLUMN "anonymized_at" timestamp;
ALTER TABLE "user" ADD COLUMN "anonymized_by_user_id" uuid REFERENCES "user"(id);
ALTER TABLE "user" ADD COLUMN "anonymized_reason" text;

-- Index for finding anonymized users
CREATE INDEX "user_anonymized_at_idx" ON "user" ("anonymized_at") WHERE "anonymized_at" IS NOT NULL;
