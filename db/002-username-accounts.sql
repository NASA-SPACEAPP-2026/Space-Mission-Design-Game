-- Preserve existing email accounts; new registrations only need a username.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
