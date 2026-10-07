import React, { useState } from 'react';
import { useVendor, useVendorPayments, useVendorPurchases, useVendorMutations } from '@/lib/queries/use-vendors';
import { Vendor } from '@/types/entities';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AmountDisplay } from '@/components/shared/amount-display';
import {
  Building2, Phone, Mail, MapPin, Pencil, Loader2,
  CreditCard, ShoppingBag, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VendorDetailProps {
  vendorId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (vendor: Vendor) => void;
}

export const VendorDetail: React.FC<VendorDetailProps> = ({
  vendorId, open, onOpenChange, onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'purchases'>('overview');
  const [payAmount, setPayAmount]   = useState('');
  const [payMethod, setPayMethod]   = useState('CASH');
  const [payRef, setPayRef]         = useState('');
  const [payErr, setPayErr]         = useState<string | null>(null);

  const { data: vendor, isLoading } = useVendor(vendorId || 0);
  const { data: payments = [] }     = useVendorPayments(vendorId || 0);
  const { data: purchases = [] }    = useVendorPurchases(vendorId || 0);
  const { recordPayment }           = useVendorMutations();

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) { setPayErr('Enter a valid amount'); return; }
    try {
      setPayErr(null);
      await recordPayment.mutateAsync({ vendorId: vendorId!, data: { amount: amt, payment_method: payMethod, reference: payRef || undefined } });
      setPayAmount(''); setPayRef('');
    } catch (err: any) {
      setPayErr(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const tabs = [
    { key: 'overview',  label: 'Overview' },
    { key: 'payments',  label: `Payments (${payments.length})` },
    { key: 'purchases', label: `Purchases (${purchases.length})` },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span>Vendor Profile</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading || !vendor ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 text-xs">

            {/* ── Vendor Header Card ── */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/80">
              <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">{vendor.name}</h2>
                  <span className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                    vendor.is_active
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    {vendor.is_active ? 'Active' : 'Archived'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {vendor.contact_person && <span className="text-muted-foreground">{vendor.contact_person}</span>}
                  {vendor.phone    && <span className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{vendor.phone}</span>}
                  {vendor.email    && <span className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{vendor.email}</span>}
                  {(vendor.city || vendor.address) && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />{[vendor.city, vendor.address].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Purchases', value: vendor.total_purchases, color: 'text-foreground' },
                { label: 'Total Paid',      value: vendor.total_paid,      color: 'text-emerald-600' },
                { label: 'Payable Balance', value: vendor.payable_balance, color: vendor.payable_balance > 0 ? 'text-red-600' : 'text-muted-foreground' },
              ].map((kpi) => (
                <div key={kpi.label} className="p-3 rounded-xl bg-card border border-border/80 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{kpi.label}</div>
                  <AmountDisplay amount={kpi.value} size="sm" className={cn('font-black font-mono mt-1', kpi.color)} />
                </div>
              ))}
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-0 border-b border-border/60">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'px-4 py-2 text-xs font-semibold border-b-2 transition-colors',
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Tab: Overview ── */}
            {activeTab === 'overview' && (
              <div className="space-y-2 text-xs text-muted-foreground">
                {vendor.notes
                  ? <p className="p-3 bg-muted/30 rounded-lg">{vendor.notes}</p>
                  : <p className="italic">No additional notes.</p>
                }
              </div>
            )}

            {/* ── Tab: Payments ── */}
            {activeTab === 'payments' && (
              <div className="space-y-3">
                {/* Record Payment Form */}
                <form onSubmit={handleRecordPayment} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl space-y-2">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">Record New Payment</p>
                  {payErr && (
                    <div className="flex items-center gap-1.5 text-destructive text-xs">
                      <AlertCircle className="h-3.5 w-3.5" />{payErr}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" min="0" step="0.5" placeholder="Amount (Rs.)" value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)} className="font-mono text-xs" required />
                    <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="text-xs">
                      <option value="CASH">Cash</option>
                      <option value="BANK">Bank Transfer</option>
                      <option value="CREDIT">Credit</option>
                    </Select>
                    <Input type="text" placeholder="Reference (optional)" value={payRef}
                      onChange={(e) => setPayRef(e.target.value)} className="text-xs" />
                  </div>
                  <Button type="submit" size="sm" disabled={recordPayment.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-semibold">
                    {recordPayment.isPending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
                      : <><CreditCard className="h-3.5 w-3.5" />Record Payment</>
                    }
                  </Button>
                </form>

                {/* Payments List */}
                {payments.length === 0
                  ? <p className="text-xs text-muted-foreground italic py-4 text-center">No payments recorded yet.</p>
                  : payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div>
                        <div className="font-semibold text-foreground">{new Date(p.payment_date).toLocaleDateString()}</div>
                        <div className="text-[10px] text-muted-foreground">{p.payment_method}{p.reference ? ` • ${p.reference}` : ''} • {p.creator_name}</div>
                      </div>
                      <AmountDisplay amount={p.amount} size="sm" className="font-bold text-emerald-600 font-mono" />
                    </div>
                  ))
                }
              </div>
            )}

            {/* ── Tab: Purchases ── */}
            {activeTab === 'purchases' && (
              <div className="space-y-1">
                {purchases.length === 0
                  ? <p className="text-xs text-muted-foreground italic py-4 text-center">No purchase imports linked to this vendor yet.</p>
                  : purchases.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-foreground">{p.product_name} <span className="font-mono text-muted-foreground text-[10px]">({p.sku})</span></div>
                          <div className="text-[10px] text-muted-foreground">{p.import_number} • {new Date(p.import_date).toLocaleDateString()} • {p.quantity} units @ Rs.{p.unit_cost}</div>
                        </div>
                      </div>
                      <AmountDisplay amount={p.total_cost} size="sm" className="font-bold font-mono" />
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {vendor && onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(vendor)} className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
