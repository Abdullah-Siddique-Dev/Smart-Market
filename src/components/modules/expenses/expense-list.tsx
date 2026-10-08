import React, { useState } from 'react';
import { useExpenses, useExpenseSummary, useExpenseMutations } from '@/lib/queries/use-expenses';
import { Expense } from '@/types/entities';
import { DataTable, ColumnDef } from '@/components/shared/data-table';
import { ExpenseForm } from './expense-form';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/utils/date';
import { Plus, DollarSign, Trash2, Edit } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

const CATEGORY_LABELS: Record<string, string> = {
  FUEL_TRANSPORT: 'Fuel / Transport',
  ELECTRICITY: 'Electricity',
  RENT: 'Rent',
  SALARIES: 'Salaries',
  RAW_MATERIALS: 'Raw Materials',
  REPAIRS_MAINTENANCE: 'Repairs & Maintenance',
  OFFICE_SUPPLIES: 'Office Supplies',
  PHONE_INTERNET: 'Phone / Internet',
  BANK_CHARGES: 'Bank Charges',
  MISCELLANEOUS: 'Miscellaneous',
};

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All Categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

export const ExpenseList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  const { data: response, isLoading } = useExpenses({
    page,
    limit: 15,
    category: categoryFilter || undefined,
  });

  const { data: summary } = useExpenseSummary();
  const { deleteExpense } = useExpenseMutations();

  const expenses = response?.data || [];
  const pagination = response?.pagination;

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    await deleteExpense.mutateAsync(expenseToDelete.id);
    setExpenseToDelete(null);
  };

  const columns: ColumnDef<Expense>[] = [
    {
      header: 'Date',
      cell: (expense) => (
        <span className="text-xs text-muted-foreground font-mono">
          {new Date(expense.expense_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Category',
      cell: (expense) => (
        <span className="text-xs font-semibold text-foreground px-2 py-0.5 rounded bg-muted">
          {CATEGORY_LABELS[expense.category] || expense.category}
        </span>
      ),
    },
    {
      header: 'Amount',
      className: 'text-right',
      cell: (expense) => (
        <AmountDisplay amount={expense.amount} size="sm" className="font-bold font-mono text-red-600" />
      ),
    },
    {
      header: 'Description',
      cell: (expense) => (
        <span className="text-xs text-muted-foreground max-w-xs truncate block">
          {expense.description}
        </span>
      ),
    },
    {
      header: 'Payment',
      cell: (expense) => (
        <span className="text-[10px] text-muted-foreground">
          {expense.payment_method}
        </span>
      ),
    },
    {
      header: 'Created By',
      cell: (expense) => (
        <span className="text-xs text-muted-foreground">
          {expense.creator_name}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-center w-24',
      cell: (expense) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(expense);
            }}
            title="Edit"
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              setExpenseToDelete(expense);
            }}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Business Expenses</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track operational expenses and receipts with category attribution
          </p>
        </div>

        <Button
          onClick={() => {
            setSelectedExpense(null);
            setIsFormOpen(true);
          }}
          className="gap-2 font-semibold shadow-xs bg-red-600 hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          <span>Log Expense</span>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            This Month's Total
          </div>
          <div className="text-xl font-black font-mono text-red-600 mt-1">
            <AmountDisplay amount={summary?.total_this_month || 0} size="md" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Monthly operating costs</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            This Month
          </div>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            <AmountDisplay amount={summary?.total_this_month || 0} size="md" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">Current month expenses</div>
        </div>

        <div className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            This Year
          </div>
          <div className="text-xl font-black font-mono text-foreground mt-1">
            <AmountDisplay amount={summary?.total_this_year || 0} size="md" />
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{expenses.length} records displayed</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border/80 shadow-xs">
        <div className="w-56">
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="h-8 text-xs"
          >
            {CATEGORY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={expenses}
        isLoading={isLoading}
        pagination={
          pagination
            ? {
                page: pagination.page,
                pageSize: pagination.limit,
                total: pagination.totalRecords,
                totalPages: pagination.totalPages,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />

      {/* Expense Form Modal */}
      <ExpenseForm
        expense={selectedExpense}
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedExpense(null);
        }}
        onSuccess={() => {
          setSelectedExpense(null);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
        title="Delete Expense"
        description={`Are you sure you want to delete this expense of Rs. ${expenseToDelete?.amount}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
};
