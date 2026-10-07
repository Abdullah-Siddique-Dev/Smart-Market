import { db } from '../db/connection.js';
import { AppError } from '../middleware/error.middleware.js';

export interface VendorRecord {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  total_purchases: number;
  total_paid: number;
  payable_balance: number;
  is_active: number;
  created_by: number;
  creator_name?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPaymentRecord {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_by: number;
  creator_name?: string;
  created_at: string;
}

export class VendorService {

  // ─── LIST ────────────────────────────────────────────────────────────────
  static getVendors(query: any): { data: VendorRecord[]; pagination: any } {
    const page   = Math.max(1, parseInt(query.page  as string, 10) || 1);
    const limit  = Math.max(1, Math.min(200, parseInt(query.limit as string, 10) || 50));
    const offset = (page - 1) * limit;

    let where = '1=1';
    const params: any[] = [];

    // Show archived only when explicitly requested
    if (query.show_archived === 'true') {
      // no filter — show all
    } else {
      where += ' AND v.is_active = 1';
    }

    if (query.search) {
      where += ' AND (v.name LIKE ? OR v.phone LIKE ? OR v.contact_person LIKE ?)';
      const q = `%${query.search}%`;
      params.push(q, q, q);
    }

    const total = (db.prepare(`SELECT COUNT(*) as c FROM vendors v WHERE ${where}`).get(...params) as any).c;

    const rows = db.prepare(`
      SELECT
        v.*,
        (v.total_purchases - v.total_paid) AS payable_balance,
        u.full_name AS creator_name
      FROM vendors v
      LEFT JOIN system_users u ON v.created_by = u.id
      WHERE ${where}
      ORDER BY v.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset) as VendorRecord[];

    return {
      data: rows,
      pagination: { page, limit, totalRecords: total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── GET ONE ─────────────────────────────────────────────────────────────
  static getVendorById(id: number): VendorRecord {
    const row = db.prepare(`
      SELECT
        v.*,
        (v.total_purchases - v.total_paid) AS payable_balance,
        u.full_name AS creator_name
      FROM vendors v
      LEFT JOIN system_users u ON v.created_by = u.id
      WHERE v.id = ?
    `).get(id) as VendorRecord | undefined;

    if (!row) throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
    return row;
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────
  static createVendor(data: {
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
    created_by: number;
  }): VendorRecord {
    const existing = db.prepare('SELECT id FROM vendors WHERE name = ? AND is_active = 1').get(data.name);
    if (existing) throw new AppError(`Vendor "${data.name}" already exists`, 409, 'DUPLICATE_VENDOR');

    const result = db.prepare(`
      INSERT INTO vendors (name, contact_person, phone, email, address, city, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name.trim(),
      data.contact_person?.trim() || null,
      data.phone?.trim()          || null,
      data.email?.trim()          || null,
      data.address?.trim()        || null,
      data.city?.trim()           || null,
      data.notes?.trim()          || null,
      data.created_by,
    );

    return this.getVendorById(Number(result.lastInsertRowid));
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────
  static updateVendor(id: number, data: {
    name?: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
    is_active?: number;
  }): VendorRecord {
    const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as VendorRecord | undefined;
    if (!existing) throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');

    // Duplicate name check (excluding self)
    if (data.name && data.name !== existing.name) {
      const dup = db.prepare('SELECT id FROM vendors WHERE name = ? AND id != ?').get(data.name, id);
      if (dup) throw new AppError(`Vendor name "${data.name}" already in use`, 409, 'DUPLICATE_VENDOR');
    }

    db.prepare(`
      UPDATE vendors
      SET name = ?, contact_person = ?, phone = ?, email = ?,
          address = ?, city = ?, notes = ?, is_active = ?,
          updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      data.name            ?? existing.name,
      data.contact_person  !== undefined ? (data.contact_person || null) : existing.contact_person,
      data.phone           !== undefined ? (data.phone          || null) : existing.phone,
      data.email           !== undefined ? (data.email          || null) : existing.email,
      data.address         !== undefined ? (data.address        || null) : existing.address,
      data.city            !== undefined ? (data.city           || null) : existing.city,
      data.notes           !== undefined ? (data.notes          || null) : existing.notes,
      data.is_active       ?? existing.is_active,
      id,
    );

    return this.getVendorById(id);
  }

  // ─── ARCHIVE (soft delete) ───────────────────────────────────────────────
  static archiveVendor(id: number): void {
    const existing = db.prepare('SELECT id FROM vendors WHERE id = ?').get(id);
    if (!existing) throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');
    db.prepare(`UPDATE vendors SET is_active = 0, updated_at = datetime('now','localtime') WHERE id = ?`).run(id);
  }

  // ─── PAYMENTS ────────────────────────────────────────────────────────────
  static getPayments(vendorId: number): VendorPaymentRecord[] {
    return db.prepare(`
      SELECT vp.*, u.full_name AS creator_name
      FROM vendor_payments vp
      LEFT JOIN system_users u ON vp.created_by = u.id
      WHERE vp.vendor_id = ?
      ORDER BY vp.payment_date DESC, vp.created_at DESC
    `).all(vendorId) as VendorPaymentRecord[];
  }

  static recordPayment(data: {
    vendor_id: number;
    amount: number;
    payment_date?: string;
    payment_method?: string;
    reference?: string;
    notes?: string;
    created_by: number;
  }): VendorPaymentRecord {
    const vendor = db.prepare('SELECT id, total_paid FROM vendors WHERE id = ?').get(data.vendor_id) as any;
    if (!vendor) throw new AppError('Vendor not found', 404, 'VENDOR_NOT_FOUND');

    const payment_date   = data.payment_date   || new Date().toISOString().split('T')[0];
    const payment_method = data.payment_method || 'CASH';

    const result = db.prepare(`
      INSERT INTO vendor_payments (vendor_id, amount, payment_date, payment_method, reference, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.vendor_id,
      data.amount,
      payment_date,
      payment_method,
      data.reference?.trim() || null,
      data.notes?.trim()     || null,
      data.created_by,
    );

    // Update vendor's total_paid
    db.prepare(`
      UPDATE vendors SET total_paid = total_paid + ?, updated_at = datetime('now','localtime') WHERE id = ?
    `).run(data.amount, data.vendor_id);

    const payment = db.prepare(`
      SELECT vp.*, u.full_name AS creator_name
      FROM vendor_payments vp
      LEFT JOIN system_users u ON vp.created_by = u.id
      WHERE vp.id = ?
    `).get(Number(result.lastInsertRowid)) as VendorPaymentRecord;

    return payment;
  }

  // ─── PURCHASE HISTORY ────────────────────────────────────────────────────
  static getPurchaseHistory(vendorId: number): any[] {
    return db.prepare(`
      SELECT
        pi.id, pi.import_number, pi.quantity, pi.unit_cost,
        (pi.quantity * pi.unit_cost) AS total_cost,
        pi.import_date, pi.supplier_info,
        p.name AS product_name, p.sku
      FROM product_imports pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.vendor_id = ?
      ORDER BY pi.import_date DESC
    `).all(vendorId) as any[];
  }

  // Called from ImportService when a new import is linked to a vendor
  static incrementPurchases(vendorId: number, amount: number): void {
    db.prepare(`
      UPDATE vendors SET total_purchases = total_purchases + ?, updated_at = datetime('now','localtime') WHERE id = ?
    `).run(amount, vendorId);
  }
}
