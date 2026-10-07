import { db } from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationPath = path.join(__dirname, 'migrations', 'add-2fa-support.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('🔄 Running 2FA migration...');

try {
  // Add columns to system_users (ignore if already exist)
  try {
    db.exec('ALTER TABLE system_users ADD COLUMN two_fa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (two_fa_enabled IN (0, 1))');
    console.log('✓ Added two_fa_enabled column');
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log('⚠ two_fa_enabled column already exists');
    } else {
      throw e;
    }
  }

  try {
    db.exec('ALTER TABLE system_users ADD COLUMN two_fa_secret TEXT');
    console.log('✓ Added two_fa_secret column');
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log('⚠ two_fa_secret column already exists');
    } else {
      throw e;
    }
  }

  // Create backup codes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS two_fa_backup_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0 CHECK (used IN (0, 1)),
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  console.log('✓ Created two_fa_backup_codes table');

  db.exec('CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON two_fa_backup_codes(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_backup_codes_code ON two_fa_backup_codes(code)');

  // Create 2FA audit table
  db.exec(`
    CREATE TABLE IF NOT EXISTS two_fa_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL CHECK (event_type IN ('ENABLED', 'DISABLED', 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'BACKUP_CODE_USED')),
      ip_address TEXT,
      user_agent TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
  console.log('✓ Created two_fa_audit table');

  db.exec('CREATE INDEX IF NOT EXISTS idx_2fa_audit_user ON two_fa_audit(user_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_2fa_audit_event ON two_fa_audit(event_type)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_2fa_audit_date ON two_fa_audit(created_at)');

  console.log('✅ 2FA migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
