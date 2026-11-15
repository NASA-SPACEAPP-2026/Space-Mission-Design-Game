-- Weekly consortium challenge: the closed week's podium, when it was closed, and the trophies won. Repeatable.
ALTER TABLE consortium_challenges ADD COLUMN IF NOT EXISTS results jsonb;
ALTER TABLE consortium_challenges ADD COLUMN IF NOT EXISTS finalized_at timestamptz;
ALTER TABLE consortia ADD COLUMN IF NOT EXISTS trophies jsonb NOT NULL DEFAULT '[]';
CREATE INDEX IF NOT EXISTS challenge_scores_ranking ON challenge_scores (week, points DESC);
CREATE INDEX IF NOT EXISTS consortia_by_science ON consortia (science DESC);
