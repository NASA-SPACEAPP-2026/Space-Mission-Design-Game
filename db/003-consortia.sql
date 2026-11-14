-- Consortia (clans). Every table for the planned branches is created here, so later branches
-- (spectate, joint missions, weekly challenge, moderation) only add API code. Repeatable.
CREATE TABLE IF NOT EXISTS consortia (
  id uuid PRIMARY KEY,
  name text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 24),
  crest jsonb NOT NULL,
  motto text NOT NULL DEFAULT '' CHECK (char_length(motto) <= 60),
  kind text NOT NULL DEFAULT 'open' CHECK (kind IN ('open', 'request', 'invite')),
  invite_code text,
  min_science integer NOT NULL DEFAULT 0 CHECK (min_science >= 0),
  max_members integer NOT NULL DEFAULT 20 CHECK (max_members BETWEEN 2 AND 20),
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  science bigint NOT NULL DEFAULT 0 CHECK (science >= 0),
  school_mode boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS consortia_name_unique ON consortia (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS consortia_invite_unique ON consortia (invite_code) WHERE invite_code IS NOT NULL;

-- user_id is the primary key: one consortium per player.
CREATE TABLE IF NOT EXISTS consortium_members (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  consortium_id uuid NOT NULL REFERENCES consortia(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('director', 'vice', 'chief_engineer', 'member')),
  science bigint NOT NULL DEFAULT 0 CHECK (science >= 0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_read_id bigint NOT NULL DEFAULT 0,
  spectate_allowed boolean NOT NULL DEFAULT true
);
CREATE INDEX IF NOT EXISTS consortium_members_by_consortium ON consortium_members (consortium_id);
CREATE UNIQUE INDEX IF NOT EXISTS consortium_one_director ON consortium_members (consortium_id) WHERE role = 'director';

CREATE TABLE IF NOT EXISTS consortium_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  consortium_id uuid NOT NULL REFERENCES consortia(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '' CHECK (char_length(message) <= 140),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS consortium_requests_pending ON consortium_requests (consortium_id, user_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS consortium_requests_user ON consortium_requests (user_id) WHERE status = 'pending';

-- author_id is NULL for system messages. Deleted messages are kept (deleted_at) for review.
CREATE TABLE IF NOT EXISTS consortium_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  consortium_id uuid NOT NULL REFERENCES consortia(id) ON DELETE CASCADE,
  author_id uuid REFERENCES users(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('text', 'sticker', 'system', 'mission')),
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 300),
  data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS consortium_messages_feed ON consortium_messages (consortium_id, id);
CREATE INDEX IF NOT EXISTS consortium_messages_author ON consortium_messages (author_id, created_at);

CREATE TABLE IF NOT EXISTS message_reports (
  message_id bigint NOT NULL REFERENCES consortium_messages(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '' CHECK (char_length(reason) <= 140),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, reporter_id)
);

-- Science points start from zero on the server. One row per (player, mission): counted once.
CREATE TABLE IF NOT EXISTS science_awards (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_key text NOT NULL CHECK (char_length(mission_key) BETWEEN 1 AND 64),
  points integer NOT NULL CHECK (points >= 0),
  consortium_id uuid REFERENCES consortia(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_key)
);

-- Spectate: the player's compressed game state, published only while someone watches.
CREATE TABLE IF NOT EXISTS live_sessions (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  consortium_id uuid REFERENCES consortia(id) ON DELETE CASCADE,
  state jsonb,
  watched_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Joint mission: shared state with optimistic versioning (an action carries the version it saw).
CREATE TABLE IF NOT EXISTS joint_missions (
  id uuid PRIMARY KEY,
  consortium_id uuid NOT NULL REFERENCES consortia(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'active', 'done', 'abandoned')),
  roles jsonb NOT NULL DEFAULT '{}',
  turn text,
  state jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS joint_missions_by_consortium ON joint_missions (consortium_id, status);

CREATE TABLE IF NOT EXISTS consortium_challenges (
  week date PRIMARY KEY,
  goal jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS challenge_scores (
  week date NOT NULL REFERENCES consortium_challenges(week) ON DELETE CASCADE,
  consortium_id uuid NOT NULL REFERENCES consortia(id) ON DELETE CASCADE,
  points bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (week, consortium_id)
);
