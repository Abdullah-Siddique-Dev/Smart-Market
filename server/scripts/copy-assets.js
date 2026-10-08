import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(serverDir, '..');

// Ensure dist/db exists
const distDbDir = path.join(serverDir, 'dist', 'db');
if (!fs.existsSync(distDbDir)) {
  fs.mkdirSync(distDbDir, { recursive: true });
}

// Copy schema.sql
const schemaSrc = path.join(serverDir, 'src', 'db', 'schema.sql');
const schemaDst = path.join(distDbDir, 'schema.sql');
if (fs.existsSync(schemaSrc)) {
  fs.copyFileSync(schemaSrc, schemaDst);
  console.log('✅ schema.sql copied to dist/db/schema.sql');
}

// Sync to src-tauri/resources/server/dist
const tauriResourceDist = path.join(rootDir, 'src-tauri', 'resources', 'server', 'dist');
if (fs.existsSync(path.join(rootDir, 'src-tauri', 'resources', 'server'))) {
  fs.cpSync(path.join(serverDir, 'dist'), tauriResourceDist, { recursive: true });
  console.log('✅ server/dist synced to src-tauri/resources/server/dist');
}
