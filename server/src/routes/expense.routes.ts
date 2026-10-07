import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller.js';
import { ensureAuthenticated } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = Router();

const createExpenseSchema = z.object({
  body: z.object({
    expense_date: z.string().optional(),
    category: z.enum([
      'FUEL_TRANSPORT',
      'ELECTRICITY',
      'RENT',
      'SALARIES',
      'RAW_MATERIALS',
      'REPAIRS_MAINTENANCE',
      'OFFICE_SUPPLIES',
      'PHONE_INTERNET',
      'BANK_CHARGES',
      'MISCELLANEOUS',
    ]),
    amount: z.number().positive('Amount must be greater than 0'),
    description: z.string().min(1, 'Description is required'),
    payment_method: z.enum(['CASH', 'BANK', 'CREDIT']).optional(),
  }),
});

const updateExpenseSchema = z.object({
  body: z.object({
    expense_date: z.string().optional(),
    category: z.enum([
      'FUEL_TRANSPORT',
      'ELECTRICITY',
      'RENT',
      'SALARIES',
      'RAW_MATERIALS',
      'REPAIRS_MAINTENANCE',
      'OFFICE_SUPPLIES',
      'PHONE_INTERNET',
      'BANK_CHARGES',
      'MISCELLANEOUS',
    ]).optional(),
    amount: z.number().positive().optional(),
    description: z.string().min(1).optional(),
    payment_method: z.enum(['CASH', 'BANK', 'CREDIT']).optional(),
  }),
});

router.use(ensureAuthenticated);

router.get('/', ExpenseController.getExpenses);
router.get('/summary', ExpenseController.getSummary);
router.get('/category-breakdown', ExpenseController.getCategoryBreakdown);
router.get('/:id', ExpenseController.getExpenseById);
router.post('/', validate(createExpenseSchema), ExpenseController.createExpense);
router.put('/:id', validate(updateExpenseSchema), ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export const expenseRoutes = router;
