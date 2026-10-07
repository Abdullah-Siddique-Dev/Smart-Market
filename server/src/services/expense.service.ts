import { db } from '../db/connection.js';
import { AppError } from '../middleware/error.middleware.js';

interface ExpenseRecord {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  created_by: number;
  creator_name?: string;
  created_at: string;
}

interface ExpenseSummary {
  total_today: number;
  total_this_month: number;
  total_this_year: number;
}

export class ExpenseService {
  static getExpenses(query: any): { data: ExpenseRecord[]; pagination: any } {
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(query.limit as string, 10) || 15));
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    const params: any[] = [];

    if (query.category) {
      whereClause += ' AND e.category = ?';
      params.push(query.category);
    }

    if (query.start_date) {
      whereClause += ' AND e.expense_date >= ?';
      params.push(query.start_date);
    }

    if (query.end_date) {
      whereClause += ' AND e.expense_date <= ?';
      params.push(query.end_date);
    }

    const countSql = `SELECT COUNT(*) as total FROM expenses e WHERE ${whereClause}`;
    const totalRecords = (db.prepare(countSql).get(...params) as { total: number }).total;

    const sql = `
      SELECT 
        e.*,
        u.full_name as creator_name
      FROM expenses e
      LEFT JOIN system_users u ON e.created_by = u.id
      WHERE ${whereClause}
      ORDER BY e.expense_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const data = db.prepare(sql).all(...params, limit, offset) as ExpenseRecord[];

    return {
      data,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
      },
    };
  }

  static getExpenseById(id: number): ExpenseRecord {
    const sql = `
      SELECT 
        e.*,
        u.full_name as creator_name
      FROM expenses e
      LEFT JOIN system_users u ON e.created_by = u.id
      WHERE e.id = ?
    `;
    const expense = db.prepare(sql).get(id) as ExpenseRecord | undefined;
    
    if (!expense) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }
    
    return expense;
  }

  static createExpense(data: {
    expense_date?: string;
    category: string;
    amount: number;
    description: string;
    payment_method?: string;
    created_by: number;
  }): ExpenseRecord {
    const expense_date = data.expense_date || new Date().toISOString().split('T')[0];
    const payment_method = data.payment_method || 'CASH';

    const result = db
      .prepare(`
        INSERT INTO expenses (expense_date, category, amount, description, payment_method, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        expense_date,
        data.category,
        data.amount,
        data.description,
        payment_method,
        data.created_by
      );

    return this.getExpenseById(Number(result.lastInsertRowid));
  }

  static updateExpense(
    id: number,
    data: {
      expense_date?: string;
      category?: string;
      amount?: number;
      description?: string;
      payment_method?: string;
    }
  ): ExpenseRecord {
    const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as ExpenseRecord | undefined;
    if (!existing) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    db.prepare(`
      UPDATE expenses
      SET expense_date = ?, category = ?, amount = ?, description = ?, payment_method = ?
      WHERE id = ?
    `).run(
      data.expense_date ?? existing.expense_date,
      data.category ?? existing.category,
      data.amount ?? existing.amount,
      data.description ?? existing.description,
      data.payment_method ?? existing.payment_method,
      id
    );

    return this.getExpenseById(id);
  }

  static deleteExpense(id: number): void {
    const existing = db.prepare('SELECT id FROM expenses WHERE id = ?').get(id);
    if (!existing) {
      throw new AppError('Expense not found', 404, 'EXPENSE_NOT_FOUND');
    }

    db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  }

  static getExpenseSummary(params?: { start_date?: string; end_date?: string }): ExpenseSummary {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7); // YYYY-MM
    const thisYear = today.substring(0, 4); // YYYY

    const total_today = (
      db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date = ?').get(today) as { total: number }
    ).total;

    const total_this_month = (
      db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime(\'%Y-%m\', expense_date) = ?').get(thisMonth) as { total: number }
    ).total;

    const total_this_year = (
      db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE strftime(\'%Y\', expense_date) = ?').get(thisYear) as { total: number }
    ).total;

    return {
      total_today,
      total_this_month,
      total_this_year,
    };
  }

  static getCategoryBreakdown(params?: { start_date?: string; end_date?: string }): any[] {
    let whereClause = '1=1';
    const queryParams: any[] = [];

    if (params?.start_date) {
      whereClause += ' AND expense_date >= ?';
      queryParams.push(params.start_date);
    }

    if (params?.end_date) {
      whereClause += ' AND expense_date <= ?';
      queryParams.push(params.end_date);
    }

    const sql = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average
      FROM expenses
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total DESC
    `;

    return db.prepare(sql).all(...queryParams) as any[];
  }
}
