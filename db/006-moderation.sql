-- Moderation: when a reported message was reviewed by the director or deputy (NULL: still to review). Repeatable.
ALTER TABLE consortium_messages ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
CREATE INDEX IF NOT EXISTS message_reports_by_reporter ON message_reports (reporter_id);
