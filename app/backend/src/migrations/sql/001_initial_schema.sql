CREATE TABLE IF NOT EXISTS user_accounts (
  id BINARY(16) NOT NULL,
  email_normalized VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status ENUM('active', 'disabled') NOT NULL DEFAULT 'active',
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_accounts_email_normalized (email_normalized),
  CONSTRAINT chk_user_accounts_email_nonempty CHECK (CHAR_LENGTH(email_normalized) > 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS player_profiles (
  user_id BINARY(16) NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  locale ENUM('it', 'en') NOT NULL DEFAULT 'en',
  preferences_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_player_profiles_user FOREIGN KEY (user_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BINARY(16) NOT NULL,
  user_id BINARY(16) NOT NULL,
  token_hash BINARY(32) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY ix_auth_sessions_user_expiry (user_id, expires_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS agencies (
  id BINARY(16) NOT NULL,
  owner_user_id BINARY(16) NOT NULL,
  name VARCHAR(120) NOT NULL,
  credits DECIMAL(14,2) NOT NULL DEFAULT 0,
  xp BIGINT UNSIGNED NOT NULL DEFAULT 0,
  science_total BIGINT UNSIGNED NOT NULL DEFAULT 0,
  staff_count INT UNSIGNED NOT NULL DEFAULT 0,
  difficulty VARCHAR(32) NOT NULL DEFAULT 'normal',
  sandbox BOOLEAN NOT NULL DEFAULT FALSE,
  tutorial_state JSON NOT NULL,
  state_schema_version SMALLINT UNSIGNED NOT NULL,
  state_json JSON NOT NULL,
  current_mission_id BINARY(16) NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_agencies_owner (owner_user_id),
  CONSTRAINT fk_agencies_owner FOREIGN KEY (owner_user_id) REFERENCES user_accounts (id),
  CONSTRAINT chk_agencies_credits_nonnegative CHECK (credits >= 0),
  CONSTRAINT chk_agencies_revision_positive CHECK (revision > 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS missions (
  id BINARY(16) NOT NULL,
  agency_id BINARY(16) NOT NULL,
  legacy_order INT UNSIGNED NULL,
  name VARCHAR(120) NOT NULL,
  phase_code VARCHAR(32) NOT NULL,
  stage_code VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  state_schema_version SMALLINT UNSIGNED NOT NULL,
  state_json JSON NOT NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  closed_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_missions_agency_legacy_order (agency_id, legacy_order),
  UNIQUE KEY uq_missions_agency_id (agency_id, id),
  KEY ix_missions_agency_status_updated (agency_id, status, updated_at),
  CONSTRAINT fk_missions_agency FOREIGN KEY (agency_id) REFERENCES agencies (id),
  CONSTRAINT chk_missions_revision_positive CHECK (revision > 0)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mission_events (
  id BINARY(16) NOT NULL,
  mission_id BINARY(16) NOT NULL,
  sequence BIGINT UNSIGNED NOT NULL,
  actor_user_id BINARY(16) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  event_schema_version SMALLINT UNSIGNED NOT NULL,
  payload_json JSON NOT NULL,
  idempotency_key BINARY(16) NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mission_events_sequence (mission_id, sequence),
  UNIQUE KEY uq_mission_events_idempotency (mission_id, idempotency_key),
  KEY ix_mission_events_created (mission_id, created_at),
  CONSTRAINT fk_mission_events_mission FOREIGN KEY (mission_id) REFERENCES missions (id),
  CONSTRAINT fk_mission_events_actor FOREIGN KEY (actor_user_id) REFERENCES user_accounts (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mission_test_runs (
  id BINARY(16) NOT NULL,
  mission_id BINARY(16) NOT NULL,
  test_type VARCHAR(64) NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  design_revision BIGINT UNSIGNED NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  result_json JSON NOT NULL,
  completed_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mission_test_runs_attempt (mission_id, test_type, attempt_number),
  KEY ix_mission_test_runs_design (mission_id, design_revision, test_type),
  CONSTRAINT fk_mission_test_runs_mission FOREIGN KEY (mission_id) REFERENCES missions (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS mission_reports (
  id BINARY(16) NOT NULL,
  mission_id BINARY(16) NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  report_schema_version SMALLINT UNSIGNED NOT NULL,
  report_json JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mission_reports_mission (mission_id),
  CONSTRAINT fk_mission_reports_mission FOREIGN KEY (mission_id) REFERENCES missions (id)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS legacy_imports (
  user_id BINARY(16) NOT NULL,
  idempotency_key BINARY(16) NOT NULL,
  source_version SMALLINT UNSIGNED NOT NULL,
  source_sha256 BINARY(32) NOT NULL,
  consent_copy_version VARCHAR(80) NOT NULL,
  consented_at DATETIME(3) NOT NULL,
  imported_at DATETIME(3) NOT NULL,
  agency_id BINARY(16) NOT NULL,
  mission_count INT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_legacy_imports_idempotency (idempotency_key),
  KEY ix_legacy_imports_agency (agency_id),
  CONSTRAINT fk_legacy_imports_user FOREIGN KEY (user_id) REFERENCES user_accounts (id),
  CONSTRAINT fk_legacy_imports_agency FOREIGN KEY (agency_id) REFERENCES agencies (id),
  CONSTRAINT chk_legacy_imports_source_version CHECK (source_version = 32)
) ENGINE=InnoDB DEFAULT CHARACTER SET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
