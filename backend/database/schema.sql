-- database/schema.sql
-- AI-Based Smart Learning Assistant — Database Schema
-- Engine: SQLite (local dev) — fully portable to PostgreSQL for production
-- (see docs/DatabaseDesign.md for the production migration note)

PRAGMA foreign_keys = ON;

-- ── USERS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  avatar          TEXT,
  password        TEXT,
  google_id       TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'STUDENT' CHECK(role IN ('STUDENT','ADMIN')),
  bio             TEXT,
  timezone        TEXT NOT NULL DEFAULT 'UTC',
  study_goal_hrs  REAL NOT NULL DEFAULT 4,
  streak          INTEGER NOT NULL DEFAULT 0,
  last_active_at  TEXT,
  email_verified  INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── REFRESH TOKENS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          TEXT PRIMARY KEY,
  token       TEXT UNIQUE NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ── SUBJECTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id          TEXT PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  icon        TEXT,
  color       TEXT NOT NULL DEFAULT '#3B82F6',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── USER_SUBJECTS (many-to-many) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subjects (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id    TEXT NOT NULL REFERENCES subjects(id),
  proficiency   INTEGER NOT NULL DEFAULT 50,
  target_score  REAL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, subject_id)
);

-- ── TASKS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO','IN_PROGRESS','DONE','CANCELLED')),
  priority       TEXT NOT NULL DEFAULT 'MEDIUM' CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')),
  due_date       TEXT,
  estimated_min  INTEGER,
  actual_min     INTEGER,
  tags           TEXT NOT NULL DEFAULT '[]',
  user_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id     TEXT REFERENCES subjects(id),
  completed_at   TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- ── STUDY PLANS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','COMPLETED','ARCHIVED')),
  start_date  TEXT NOT NULL,
  end_date    TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── CHAT SESSIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT 'New Chat',
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);

-- ── CHAT MESSAGES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK(role IN ('USER','ASSISTANT','SYSTEM')),
  content     TEXT NOT NULL,
  tokens      INTEGER,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);

-- ── RECOMMENDATIONS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT,
  type        TEXT NOT NULL CHECK(type IN ('VIDEO','ARTICLE','EXERCISE','BOOK','PODCAST','COURSE')),
  subject_id  TEXT REFERENCES subjects(id),
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tags        TEXT NOT NULL DEFAULT '[]',
  rating      REAL,
  saved       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── STUDY LOGS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_logs (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id    TEXT REFERENCES subjects(id),
  duration_min  INTEGER NOT NULL,
  notes         TEXT,
  date          TEXT NOT NULL DEFAULT (datetime('now')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_study_logs_user ON study_logs(user_id);

-- ── NOTIFICATIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  read        INTEGER NOT NULL DEFAULT 0,
  link        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
