import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(): void {
  const candidateSchemaPaths = [
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, 'db/schema.sql'),
    path.resolve(__dirname, '../db/schema.sql'),
    path.resolve(__dirname, '../../src/db/schema.sql'),
    path.resolve(process.cwd(), 'server/dist/db/schema.sql'),
    path.resolve(process.cwd(), 'server/src/db/schema.sql'),
    path.resolve(process.cwd(), 'dist/db/schema.sql'),
    path.resolve(process.cwd(), 'src/db/schema.sql'),
    path.resolve(process.cwd(), 'resources/server/dist/db/schema.sql'),
  ];
  const schemaPath = candidateSchemaPaths.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(`Schema file not found in candidates: ${candidateSchemaPaths.join(', ')}`);
  }


  // Incremental schema migrations for existing local database before running full schema
  try {
    const tableInfo = db.pragma('table_info(orders)') as Array<{ name: string; notnull: number }>;
    const hasOrderSource = tableInfo.some((col) => col.name === 'order_source');
    if (!hasOrderSource && tableInfo.length > 0) {
      db.exec(`ALTER TABLE orders ADD COLUMN order_source TEXT NOT NULL DEFAULT 'MANUAL_WHATSAPP'`);
      console.log('✅ [Database] Added order_source column to orders table.');
    }

    const ordersBookerCol = tableInfo.find((col) => col.name === 'order_booker_id');
    if (ordersBookerCol && ordersBookerCol.notnull === 1) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE orders_migration_tmp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_number TEXT NOT NULL UNIQUE,
          shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
          order_booker_id INTEGER REFERENCES order_bookers(id),
          order_source TEXT NOT NULL DEFAULT 'MANUAL_WHATSAPP' CHECK (order_source IN ('MANUAL_WHATSAPP', 'MANUAL_IN_PERSON', 'DIRECT_PHONE', 'DIRECT_WALKIN')),
          order_date TEXT NOT NULL DEFAULT (date('now', 'localtime')),
          status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'DISPATCHED', 'BILLED', 'CANCELLED')),
          total_amount REAL NOT NULL DEFAULT 0.0 CHECK (total_amount >= 0),
          notes TEXT,
          created_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );
        INSERT INTO orders_migration_tmp (id, order_number, shop_id, order_booker_id, order_source, order_date, status, total_amount, notes, created_by, created_at)
        SELECT id, order_number, shop_id, order_booker_id, COALESCE(order_source, 'MANUAL_WHATSAPP'), order_date, status, total_amount, notes, created_by, created_at FROM orders;
        DROP TABLE orders;
        ALTER TABLE orders_migration_tmp RENAME TO orders;
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_booker ON orders(order_booker_id);
        CREATE INDEX IF NOT EXISTS idx_orders_shop ON orders(shop_id);
        CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(order_date);
        CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(order_source);
      `);
      db.pragma('foreign_keys = ON');
      console.log('✅ [Database] Migrated orders table: order_booker_id is now nullable.');
    }

    const billsCols = db.pragma('table_info(bills)') as Array<{ name: string; notnull: number }>;
    const billsBookerCol = billsCols.find((col) => col.name === 'order_booker_id');
    if (billsBookerCol && billsBookerCol.notnull === 1) {
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE bills_migration_tmp (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          bill_number TEXT NOT NULL UNIQUE,
          order_id INTEGER REFERENCES orders(id),
          shop_id INTEGER NOT NULL REFERENCES retail_shops(id),
          order_booker_id INTEGER REFERENCES order_bookers(id),
          bill_date TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          subtotal REAL NOT NULL CHECK (subtotal >= 0),
          discount_amount REAL NOT NULL DEFAULT 0.0 CHECK (discount_amount >= 0),
          net_amount REAL NOT NULL CHECK (net_amount >= 0),
          paid_amount REAL NOT NULL DEFAULT 0.0 CHECK (paid_amount >= 0),
          payment_status TEXT NOT NULL CHECK (payment_status IN ('PAID', 'PARTIAL', 'CREDIT')),
          created_by INTEGER NOT NULL REFERENCES system_users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
        );
        INSERT INTO bills_migration_tmp (id, bill_number, order_id, shop_id, order_booker_id, bill_date, subtotal, discount_amount, net_amount, paid_amount, payment_status, created_by, created_at)
        SELECT id, bill_number, order_id, shop_id, order_booker_id, bill_date, subtotal, discount_amount, net_amount, paid_amount, payment_status, created_by, created_at FROM bills;
        DROP TABLE bills;
        ALTER TABLE bills_migration_tmp RENAME TO bills;
        CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);
        CREATE INDEX IF NOT EXISTS idx_bills_shop ON bills(shop_id);
        CREATE INDEX IF NOT EXISTS idx_bills_booker ON bills(order_booker_id);
      `);
      db.pragma('foreign_keys = ON');
      console.log('✅ [Database] Migrated bills table: order_booker_id is now nullable.');
    }

    // Ensure product_imports has vendor_id column
    const importCols = db.pragma('table_info(product_imports)') as Array<{ name: string }>;
    if (importCols.length > 0 && !importCols.some((col) => col.name === 'vendor_id')) {
      db.exec(`ALTER TABLE product_imports ADD COLUMN vendor_id INTEGER REFERENCES vendors(id)`);
      console.log('✅ [Database] Added vendor_id column to product_imports table.');
    }

    // Ensure system_users has 2FA columns and OWNER role
    const userCols = db.pragma('table_info(system_users)') as Array<{ name: string }>;
    if (userCols.length > 0) {
      if (!userCols.some((col) => col.name === 'two_fa_enabled')) {
        db.exec(`ALTER TABLE system_users ADD COLUMN two_fa_enabled INTEGER NOT NULL DEFAULT 0 CHECK (two_fa_enabled IN (0, 1))`);
      }
      if (!userCols.some((col) => col.name === 'two_fa_secret')) {
        db.exec(`ALTER TABLE system_users ADD COLUMN two_fa_secret TEXT`);
      }
      db.exec("UPDATE system_users SET role = 'OWNER' WHERE role != 'OWNER';");
    }

    // Backfill opening ledger entries for any products with stock but no ledger records
    const unreconciled = db.prepare(`
      SELECT p.id, p.current_stock, (p.current_stock - COALESCE(SUM(il.change_qty), 0)) as variance
      FROM products p
      LEFT JOIN inventory_ledger il ON p.id = il.product_id
      GROUP BY p.id
      HAVING variance > 0
    `).all() as Array<{ id: number; current_stock: number; variance: number }>;

    for (const item of unreconciled) {
      db.prepare(`
        INSERT INTO inventory_ledger (product_id, change_qty, balance_after, transaction_type, reference_id, reference_type, performed_by, notes)
        VALUES (?, ?, ?, 'IMPORT', ?, 'INITIAL_STOCK', 1, 'Opening stock reconciliation backfill')
      `).run(item.id, item.variance, item.current_stock, item.id);
      console.log(`✅ [Database] Reconciled initial stock for product ID ${item.id} (${item.variance} units).`);
    }
  } catch (err) {
    console.warn('Migration check warning:', err);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(sql);

  console.log('✅ [Database] SQLite schema migrations executed successfully.');
}

// Allow direct execution via CLI
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && (process.argv[1].endsWith('migrate.ts') || process.argv[1].endsWith('migrate.js')) && process.argv[1] === currentFile) {
  runMigrations();
  process.exit(0);
}
