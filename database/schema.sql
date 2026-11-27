-- ConnectX database schema (PostgreSQL)
-- Owner: Member 3 (Database Developer)
-- Safe to run more than once (IF NOT EXISTS everywhere).

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  avatar_url    TEXT,
  last_seen     TIMESTAMPTZ  DEFAULT now(),
  created_at    TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id         SERIAL PRIMARY KEY,
  is_group   BOOLEAN      NOT NULL DEFAULT false,
  name       VARCHAR(100),                       -- only used for groups
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id      INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id              INT NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
  last_read_message_id INT NOT NULL DEFAULT 0,   -- powers unread counters
  joined_at            TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_user ON conversation_members(user_id);

CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       INT NOT NULL REFERENCES users(id),
  body            TEXT,
  edited_at       TIMESTAMPTZ,
  deleted         BOOLEAN NOT NULL DEFAULT false,  -- soft delete
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id         SERIAL PRIMARY KEY,
  message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url   TEXT NOT NULL,
  file_name  TEXT,
  mime_type  TEXT,
  size_bytes INT
);
CREATE INDEX IF NOT EXISTS idx_attachments_msg ON attachments(message_id);

-- One row per (message, recipient). 'delivered' is upgraded to 'read'.
CREATE TABLE IF NOT EXISTS message_status (
  message_id INT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    INT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  status     VARCHAR(10) NOT NULL CHECK (status IN ('delivered', 'read')),
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);
