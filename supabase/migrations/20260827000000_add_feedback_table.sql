-- Feedback (bug reports / feature requests), notified via the
-- notify-feedback edge function.
-- Apply in Supabase Dashboard > SQL Editor, or via: supabase db push
--
-- NOTE: after applying, create a Database Webhook in the Dashboard
-- (Database > Webhooks) on INSERT to `feedback` that calls the
-- notify-feedback edge function - this migration only creates the table.

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bug', 'feature')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedback_select" ON feedback;
CREATE POLICY "feedback_select" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "feedback_insert" ON feedback;
CREATE POLICY "feedback_insert" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
