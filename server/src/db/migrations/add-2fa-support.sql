-- Migration: Add Two-Factor Authentication Support
-- Date: 2026-10-06

-- Add 2FA columns to existing system_users table
ALTER TABLE system_users ADD COLUMN two_fa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (two_fa_enabled IN (0, 1));
ALTER TABLE system_users ADD COLUMN two_fa_secret TEXT;

-- Create backup codes table
CREATE TABLE IF NOT EXISTS two_fa_backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON two_fa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_backup_codes_code ON two_fa_backup_codes(code);

-- Create 2FA audit log table
CREATE TABLE IF NOT EXISTS two_fa_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('ENABLED', 'DISABLED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'BACKUP_CODE_USED')),
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX IF NOT EXISTS idx_2fa_audit_user ON two_fa_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_audit_event ON two_fa_audit(event_type);
CREATE INDEX IF NOT EXISTS idx_2fa_audit_date ON two_fa_audit(created_at);
