import { Request, Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service.js';
import { successResponse } from '../utils/response.js';

export class ExpenseController {
  static getExpenses(req: Request, res: Response, next: NextFunction): void {
    try {
      const result = ExpenseService.getExpenses(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static getExpenseById(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const expense = ExpenseService.getExpenseById(id);
      res.json(successResponse(expense));
    } catch (error) {
      next(error);
    }
  }

  static createExpense(req: Request, res: Response, next: NextFunction): void {
    try {
      const userId = req.user!.id;
      const expense = ExpenseService.createExpense({
        ...req.body,
        created_by: userId,
      });
      res.status(201).json(successResponse(expense, 'Expense recorded successfully'));
    } catch (error) {
      next(error);
    }
  }

  static updateExpense(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = ExpenseService.updateExpense(id, req.body);
      res.json(successResponse(updated, 'Expense updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  static deleteExpense(req: Request, res: Response, next: NextFunction): void {
    try {
      const id = parseInt(req.params.id, 10);
      ExpenseService.deleteExpense(id);
      res.json(successResponse(null, 'Expense deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static getSummary(req: Request, res: Response, next: NextFunction): void {
    try {
      const summary = ExpenseService.getExpenseSummary(req.query);
      res.json(successResponse(summary));
    } catch (error) {
      next(error);
    }
  }

  static getCategoryBreakdown(req: Request, res: Response, next: NextFunction): void {
    try {
      const breakdown = ExpenseService.getCategoryBreakdown(req.query);
      res.json(successResponse(breakdown));
    } catch (error) {
      next(error);
    }
  }
}
