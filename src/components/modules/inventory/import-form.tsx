import React, { useState, useEffect } from 'react';
import { useProductMutations } from '@/lib/queries/use-products';
import { useVendors } from '@/lib/queries/use-vendors';
import { Product } from '@/types/entities';
import { ProductSearch } from '@/components/shared/product-search';
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
import { formatCurrency } from '@/lib/utils/currency';
import { Download, AlertCircle, Loader2, PackageCheck, Building2 } from 'lucide-react';

interface ImportFormProps {
  initialProduct?: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ImportForm: React.FC<ImportFormProps> = ({
  initialProduct,
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct || null);
  const [vendorId, setVendorId] = useState<string>(''); // Vendor selection
  const [importQty, setImportQty] = useState(''); // New quantity to add
  const [totalStock, setTotalStock] = useState(''); // Direct edit mode
  const [useDirectEdit, setUseDirectEdit] = useState(false); // Toggle between modes
  const [unitCost, setUnitCost] = useState('');
  const [supplierInfo, setSupplierInfo] = useState('');
  const [updateMasterCost, setUpdateMasterCost] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { recordImport } = useProductMutations();
  const { data: vendorsResponse } = useVendors({ show_archived: false, limit: 100 });
  const vendors = vendorsResponse?.data || [];

  useEffect(() => {
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setUnitCost(
        initialProduct.purchase_price !== undefined ? String(initialProduct.purchase_price) : ''
      );
      setImportQty('');
      setTotalStock('');
      setVendorId('');
      setUseDirectEdit(false);
    }
  }, [initialProduct, open]);

  // Calculate final stock based on mode
  const currentStock = selectedProduct?.current_stock || 0;
  const calculatedTotal = useDirectEdit 
    ? parseInt(totalStock, 10) || 0
    : currentStock + (parseInt(importQty, 10) || 0);
  
  // Calculate actual import quantity
  const actualImportQty = useDirectEdit
    ? Math.max(0, (parseInt(totalStock, 10) || 0) - currentStock)
    : parseInt(importQty, 10) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }

    if (actualImportQty <= 0) {
      setError('Import quantity must be greater than 0');
      return;
    }

    const cost = parseFloat(unitCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please enter a valid unit import cost');
      return;
    }

    try {
      setError(null);
      await recordImport.mutateAsync({
        product_id: selectedProduct.id,
        quantity: actualImportQty, // Send the calculated import quantity
        unit_cost: cost,
        vendor_id: vendorId ? parseInt(vendorId, 10) : undefined,
        supplier_info: supplierInfo.trim() || undefined,
        update_master_cost: updateMasterCost,
      });

      setImportQty('');
      setTotalStock('');
      setSupplierInfo('');
      setVendorId('');
      setUseDirectEdit(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record stock import');
    }
  };

  const totalBatchCost = actualImportQty * (parseFloat(unitCost) || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent maxWidth="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-emerald-600" />
            <span>Record Inward Stock Import</span>
          </DialogTitle>
          <DialogDescription>
            Receive physical shipments into warehouse and record supplier cost
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Select Product *</label>
            {selectedProduct ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/30">
                <div>
                  <div className="font-bold text-foreground text-xs">{selectedProduct.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-primary">{selectedProduct.sku}</span>
                    <span>• Current Stock: <strong className="text-foreground">{selectedProduct.current_stock}</strong></span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(null);
                    setImportQty('');
                    setTotalStock('');
                  }}
                  className="h-6 text-[10px] text-muted-foreground"
                >
                  Change
                </Button>
              </div>
            ) : (
              <ProductSearch
                onSelect={(p) => {
                  setSelectedProduct(p);
                  if (p.purchase_price) setUnitCost(String(p.purchase_price));
                  setImportQty('');
                  setTotalStock('');
                }}
                placeholder="Search product to receive..."
                autoFocus
              />
            )}
          </div>

          {/* Vendor Selection (Optional) */}
          {selectedProduct && (
            <div className="space-y-1">
              <label className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span>Vendor / Supplier (Optional)</span>
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No vendor selected</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} {v.phone ? `• ${v.phone}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground italic mt-1">
                Link this import to a vendor account to track purchase ledger automatically
              </p>
            </div>
          )}

          {/* Stock Quantity Section - 3 Fields */}
          {selectedProduct && (
            <div className="space-y-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center justify-between mb-2">
                <label className="font-bold text-blue-800 dark:text-blue-300 text-xs">Stock Management</label>
                <button
                  type="button"
                  onClick={() => {
                    setUseDirectEdit(!useDirectEdit);
                    setImportQty('');
                    setTotalStock('');
                  }}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  {useDirectEdit ? 'Switch to Import Mode' : 'Switch to Direct Edit'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Current Stock (Read-only) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase">Current Stock</label>
                  <Input
                    type="number"
                    value={currentStock}
                    disabled
                    className="font-mono text-xs font-bold bg-muted/50 text-muted-foreground"
                  />
                </div>

                {/* New Import Qty OR Total Stock (based on mode) */}
                {useDirectEdit ? (
                  <>
                    {/* Direct Edit Mode - Edit Total */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Import Qty</label>
                      <Input
                        type="number"
                        value={actualImportQty}
                        disabled
                        className="font-mono text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-primary uppercase">✏️ Total Stock *</label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="Final total"
                        value={totalStock}
                        onChange={(e) => setTotalStock(e.target.value)}
                        className="font-mono text-xs font-bold border-primary/50 focus:border-primary"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Import Mode - Edit Import Qty */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-primary uppercase">✏️ Import Qty *</label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Add qty"
                        value={importQty}
                        onChange={(e) => setImportQty(e.target.value)}
                        className="font-mono text-xs font-bold border-primary/50 focus:border-primary"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Total Stock</label>
                      <Input
                        type="number"
                        value={calculatedTotal}
                        disabled
                        className="font-mono text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Visual Helper */}
              <div className="text-[10px] text-center text-blue-700 dark:text-blue-400 font-mono bg-blue-100 dark:bg-blue-900/30 py-1 rounded">
                {currentStock} {useDirectEdit ? '→' : '+'} {actualImportQty} = <strong>{calculatedTotal}</strong>
              </div>
            </div>
          )}

          {/* Unit Cost */}
          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Unit Cost Price (Rs.) *</label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="font-mono text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-muted-foreground">Supplier / Origin / Notes</label>
            <Input
              type="text"
              placeholder="e.g. Container Yiwu #14 / Faisalabad Mill"
              value={supplierInfo}
              onChange={(e) => setSupplierInfo(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="updateMasterCost"
              checked={updateMasterCost}
              onChange={(e) => setUpdateMasterCost(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            <label htmlFor="updateMasterCost" className="text-[11px] text-foreground font-medium cursor-pointer">
              Update catalog standard purchase cost with this batch price
            </label>
          </div>

          {/* Batch total summary */}
          {totalBatchCost > 0 && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                  Total Batch Investment:
                </span>
                <span className="font-mono font-bold text-sm text-emerald-700 dark:text-emerald-200">
                  {formatCurrency(totalBatchCost)}
                </span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                {actualImportQty} units × {formatCurrency(parseFloat(unitCost) || 0)}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={recordImport.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={recordImport.isPending || !selectedProduct}
              className="font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {recordImport.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <PackageCheck className="h-4 w-4" />
                  <span>Receive Stock Batch</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
