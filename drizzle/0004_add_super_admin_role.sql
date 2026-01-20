ALTER TYPE "role" ADD VALUE IF NOT EXISTS 'super_admin';

--> statement-breakpoint

UPDATE "user"
SET "role" = 'super_admin'
WHERE "role" = 'admin';
