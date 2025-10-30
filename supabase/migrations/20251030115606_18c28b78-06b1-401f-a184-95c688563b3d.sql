-- Add unique constraint to user_id column in user_canvas_drafts
-- This allows upsert operations with onConflict: 'user_id'
ALTER TABLE public.user_canvas_drafts
ADD CONSTRAINT user_canvas_drafts_user_id_unique UNIQUE (user_id);