import { apiClient } from './client';
import { Expense, ExpenseSummary } from '@/types/entities';
import { PaginatedResponse, ApiResponse } from '@/types/api';

export const expensesApi = {
  getExpenses: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const res = await apiClient.get<PaginatedResponse<Expense>>('/expenses', { params });
    return res.data;
  },

  getExpenseById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Expense>>(`/expenses/${id}`);
    return res.data.data;
  },

  createExpense: async (data: {
    expense_date?: string;
    category: string;
    amount: number;
    description: string;
    payment_method?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<Expense>>('/expenses', data);
    return res.data.data;
  },

  updateExpense: async (id: number, data: Partial<Expense>) => {
    const res = await apiClient.put<ApiResponse<Expense>>(`/expenses/${id}`, data);
    return res.data.data;
  },

  deleteExpense: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/expenses/${id}`);
    return res.data;
  },

  getSummary: async () => {
    const res = await apiClient.get<ApiResponse<ExpenseSummary>>('/expenses/summary');
    return res.data.data;
  },

  getCategoryBreakdown: async (params?: { start_date?: string; end_date?: string }) => {
    const res = await apiClient.get<ApiResponse<any[]>>('/expenses/category-breakdown', { params });
    return res.data.data;
  },
};
