import React, { useState } from 'react';
import { useVendors, useVendorMutations } from '@/lib/queries/use-vendors';
import { Vendor } from '@/types/entities';
import { VendorForm } from './vendor-form';
import { VendorDetail } from './vendor-detail';
import { AmountDisplay } from '@/components/shared/amount-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Building2, Plus, Search, Eye, Pencil, Archive, Phone, Mail, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const VendorList: React.FC = () => {
  const [search, setSearch]               = useState('');
  const [showArchived, setShowArchived]   = useState(false);
  const [isFormOpen, setIsFormOpen]       = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailVendorId, setDetailVendorId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen]   = useState(false);
  const [toArchive, setToArchive]         = useState<Vendor | null>(null);

  const { data: response, isLoading } = useVendors({
    search: search || undefined,
    show_archived: showArchived,
    limit: 50,
  });

  const { archiveVendor } = useVendorMutations();
  const vendors = response?.data || [];

  const handleEdit = (v: Vendor) => { setSelectedVendor(v); setIsFormOpen(true); };
  const handleView = (v: Vendor) => { setDetailVendorId(v.id); setIsDetailOpen(true); };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">

      {/* ── Top Bar ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Vendors Directory</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage vendor accounts and purchase ledgers
          </p>
        </div>
        <Button
          onClick={() => { setSelectedVendor(null); setIsFormOpen(true); }}
          className="gap-2 font-semibold shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Add Vendor</span>
        </Button>
      </div>

      {/* ── Search + Show Archived ───────────────────────────── */}
      <div className="flex items-center gap-3 bg-card border border-border/80 rounded-xl px-3 py-2.5 shadow-xs">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          type="text"
          placeholder="Search vendor by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-0 bg-transparent text-xs h-auto p-0 focus-visible:ring-0 flex-1"
        />
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-3.5 w-3.5 rounded"
          />
          Show Archived
        </label>
      </div>

      {/* ── Table ────────────────────────────────────────────── */}
      <div className="bg-card border border-border/80 rounded-xl shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[2fr_2fr_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border/60">
          {['VENDOR', 'CONTACT', 'ADDRESS', 'STATUS', 'TOTAL PURCHASES', 'TOTAL PAID', 'PAYABLE BALANCE', 'ACTIONS'].map((h) => (
            <div key={h} className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {h}
            </div>
          ))}
        </div>

        {/* Table Body */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Loading vendors...</div>
        ) : vendors.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            {search ? 'No vendors found matching your search.' : 'No vendors yet. Click "Add Vendor" to get started.'}
          </div>
        ) : (
          vendors.map((vendor) => (
            <div
              key={vendor.id}
              className={cn(
                'grid grid-cols-[2fr_2fr_2fr_1fr_1.5fr_1.5fr_1.5fr_1fr] gap-3 px-4 py-3 border-b border-border/40 hover:bg-muted/20 transition-colors items-center cursor-pointer',
                !vendor.is_active && 'opacity-50'
              )}
              onClick={() => handleView(vendor)}
            >
              {/* Vendor Name */}
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-foreground truncate">{vendor.name}</div>
                  {vendor.notes && (
                    <div className="text-[10px] text-muted-foreground truncate">{vendor.notes}</div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-0.5">
                {vendor.phone && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="font-mono">{vendor.phone}</span>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
                {!vendor.phone && !vendor.email && (
                  <span className="text-[10px] italic text-muted-foreground/60">No contact</span>
                )}
              </div>

              {/* Address */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {vendor.city || vendor.address ? (
                  <>
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{vendor.city || vendor.address}</span>
                  </>
                ) : (
                  <span className="italic text-muted-foreground/60 text-[10px]">—</span>
                )}
              </div>

              {/* Status */}
              <div>
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  vendor.is_active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {vendor.is_active ? 'Active' : 'Archived'}
                </span>
              </div>

              {/* Total Purchases */}
              <div>
                <AmountDisplay amount={vendor.total_purchases} size="sm" className="font-bold font-mono" />
              </div>

              {/* Total Paid */}
              <div>
                <AmountDisplay amount={vendor.total_paid} size="sm" className="font-bold font-mono text-emerald-600" />
              </div>

              {/* Payable Balance */}
              <div>
                <AmountDisplay
                  amount={vendor.payable_balance}
                  size="sm"
                  className={cn('font-bold font-mono', vendor.payable_balance > 0 ? 'text-red-600' : 'text-muted-foreground')}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-primary hover:bg-primary/10 text-xs gap-1"
                  onClick={() => handleView(vendor)}
                  title="View Profile"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => handleEdit(vendor)}
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {vendor.is_active === 1 && (
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => setToArchive(vendor)}
                    title="Archive"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}

        {/* Footer */}
        {vendors.length > 0 && (
          <div className="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-border/40 flex items-center gap-2">
            Showing <strong>{vendors.length}</strong> of <strong>{response?.pagination?.totalRecords || vendors.length}</strong> records
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
              {response?.pagination?.limit || 50}/page
            </span>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      <VendorForm
        vendor={selectedVendor}
        open={isFormOpen}
        onOpenChange={(o) => { setIsFormOpen(o); if (!o) setSelectedVendor(null); }}
      />

      <VendorDetail
        vendorId={detailVendorId}
        open={isDetailOpen}
        onOpenChange={(o) => { setIsDetailOpen(o); if (!o) setDetailVendorId(null); }}
        onEdit={(v) => { setIsDetailOpen(false); handleEdit(v); }}
      />

      <ConfirmDialog
        open={!!toArchive}
        onOpenChange={(o) => !o && setToArchive(null)}
        title="Archive Vendor"
        description={`Archive "${toArchive?.name}"? They won't appear in dropdowns but data is preserved.`}
        onConfirm={async () => { if (toArchive) { await archiveVendor.mutateAsync(toArchive.id); setToArchive(null); } }}
        confirmLabel="Archive"
        variant="destructive"
      />
    </div>
  );
};
