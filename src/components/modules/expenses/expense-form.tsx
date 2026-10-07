import React, { useState, useEffect } from 'react';
import { useExpenseMutations } from '@/lib/queries/use-expenses';
import { Expense } from '@/types/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AlertCircle, Loader2, DollarSign } from 'lucide-react';

interface ExpenseFormProps {
  expense?: Expense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES = [
  { value: 'FUEL_TRANSPORT', label: 'Fuel / Transport' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'RENT', label: 'Rent' },
  { value: 'SALARIES', label: 'Salaries' },
  { value: 'RAW_MATERIALS', label: 'Raw Materials' },
  { value: 'REPAIRS_MAINTENANCE', label: 'Repairs & Maintenance' },
  { value: 'OFFICE_SUPPLIES', label: 'Office Supplies' },
  { value: 'PHONE_INTERNET', label: 'Phone / Internet' },
  { value: 'BANK_CHARGES', label: 'Bank Charges' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK', label: 'Bank Transfer' },
  { value: 'CREDIT', label: 'Credit' },
];

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  expense,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('MISCELLANEOUS');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [error, setError] = useState<string | null>(null);

  const { createExpense, updateExpense } = useExpenseMutations();
  const isEditing = !!expense;

  useEffect(() => {
    if (expense) {
      setExpenseDate(expense.expense_date);
      setCategory(expense.category);
      setAmount(String(expense.amount));
      setDescription(expense.description);
      setPaymentMethod(expense.payment_method);
      setError(null);
    } else {
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setCategory('MISCELLANEOUS');
      setAmount('');
      setDescription('');
      setPaymentMethod('CASH');
      setError(null);
    }
  }, [expense, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    try {
      setError(null);
      if (isEditing && expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          data: {
            expense_date: expenseDate,
            category,
            amount: amt,
            description: description.trim(),
            payment_method: paymentMethod,
          },
        });
      } else {
        await createExpense.mutateAsync({
          expense_date: expenseDate,
          category,
          amount: amt,
          description: description.trim(),
          payment_method: paymentMethod,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save expense');
    }
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            <span>{isEditing ? 'Edit Expense' : 'Log New Expense'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update expense details' : 'Record daily business operational expense'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            {/* Category */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Category *</label>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="text-xs"
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground">Amount (Rs.) *</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono text-xs"
                required
              />
            </div>
          </div>

          {/* Expense Date */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Expense Date *</label>
            <Input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Description / Remarks *</label>
            <Input
              type="text"
              placeholder="e.g. 50L Diesel for Delivery Van"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Payment Method</label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="text-xs"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="font-semibold gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Expense' : 'Log Expense'}</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
