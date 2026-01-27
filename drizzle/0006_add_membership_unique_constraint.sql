-- Migration: Add unique constraint on foodie_group_membership (user_id, group_id)
-- Description: Prevents duplicate memberships and enables safe concurrent inserts

-- Add unique constraint on (user_id, group_id) to prevent duplicate memberships
-- This allows the ensureFoodieGroupMembership helper to safely handle concurrent requests
CREATE UNIQUE INDEX IF NOT EXISTS "foodie_group_membership_user_group_unique" 
ON "foodie_group_membership" ("user_id", "group_id");
