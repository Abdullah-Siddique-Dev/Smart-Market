import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js';

function resolveDatabasePath(): string {
  if (process.env.DATABASE_PATH) {
    const customPath = path.resolve(process.env.DATABASE_PATH);
    const customDir = path.dirname(customPath);
    if (!fs.existsSync(customDir)) {
      fs.mkdirSync(customDir, { recursive: true });
    }
    return customPath;
  }

  // Check if cwd is writable (portable directory)
  try {
    const localDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return path.join(localDir, 'smart_market.sqlite');
  } catch {
    // If installed in Program Files or read-only directory, use %APPDATA%
    const appData = process.env.APPDATA || process.env.USERPROFILE || process.cwd();
    const userDbDir = path.join(appData, 'SmartMarket', 'data');
    if (!fs.existsSync(userDbDir)) {
      fs.mkdirSync(userDbDir, { recursive: true });
    }
    return path.join(userDbDir, 'smart_market.sqlite');
  }
}

export const resolvedDbPath = resolveDatabasePath();

export const db: Database.Database = new Database(resolvedDbPath, {
  verbose: ENV.NODE_ENV === 'development' ? undefined : undefined,
});

// Configure Pragmas for ACID Safety and Performance in WAL mode
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');

export function getDb(): Database.Database {
  return db;
}
