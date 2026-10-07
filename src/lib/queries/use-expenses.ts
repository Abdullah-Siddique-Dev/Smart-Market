import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expenses.api';

export function useExpenses(params?: {
  page?: number;
  limit?: number;
  category?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: () => expensesApi.getExpenses(params),
  });
}

export function useExpense(id: number) {
  return useQuery({
    queryKey: ['expense', id],
    queryFn: () => expensesApi.getExpenseById(id),
    enabled: id > 0,
  });
}

export function useExpenseSummary() {
  return useQuery({
    queryKey: ['expense-summary'],
    queryFn: () => expensesApi.getSummary(),
  });
}

export function useExpenseCategoryBreakdown(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ['expense-category-breakdown', params],
    queryFn: () => expensesApi.getCategoryBreakdown(params),
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['profit-report'] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) => expensesApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['profit-report'] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: number) => expensesApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
      queryClient.invalidateQueries({ queryKey: ['expense-category-breakdown'] });
      queryClient.invalidateQueries({ queryKey: ['profit-report'] });
    },
  });

  return { createExpense, updateExpense, deleteExpense };
}
