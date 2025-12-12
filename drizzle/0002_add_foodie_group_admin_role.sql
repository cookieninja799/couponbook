DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'role'
      AND n.nspname = 'public'
      AND e.enumlabel = 'foodie_group_admin'
  ) THEN
    ALTER TYPE "public"."role" ADD VALUE 'foodie_group_admin';
  END IF;
END $$;
--> statement-breakpoint

