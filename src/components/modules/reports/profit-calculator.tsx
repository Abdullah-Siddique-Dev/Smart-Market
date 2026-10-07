import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils/currency';
import { useProducts } from '@/lib/queries/use-products';
import { Product } from '@/types/entities';
import { Calculator, Sparkles, TrendingUp, DollarSign, Package, Percent } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const ProfitCalculator: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [showAllProducts, setShowAllProducts] = useState<boolean>(false);

  const { data: productsData } = useProducts({ limit: 1000, is_active: 1 });
  const products = productsData?.data || [];

  const handleSelectProduct = (productIdStr: string) => {
    if (productIdStr === 'ALL') {
      setShowAllProducts(true);
      setSelectedProduct(null);
      setCustomName('All Products Combined');
      setQuantity(0);
      setCostPrice(0);
      setSellingPrice(0);
      return;
    }

    if (!productIdStr) {
      // Manual/Custom mode
      setShowAllProducts(false);
      setSelectedProduct(null);
      setCustomName('');
      setQuantity(0);
      setCostPrice(0);
      setSellingPrice(0);
      return;
    }

    setShowAllProducts(false);
    const id = parseInt(productIdStr, 10);
    const prod = products.find((p) => p.id === id);
    if (prod) {
      setSelectedProduct(prod);
      setCustomName(prod.name);
      setQuantity(prod.current_stock || 0); // Auto-fetch actual inventory quantity
      setCostPrice(prod.purchase_price ?? 0); // Auto-fetch purchase price
      setSellingPrice(prod.selling_price ?? 0); // Auto-fetch selling price
    } else {
      setSelectedProduct(null);
      setCustomName('');
      setQuantity(0);
      setCostPrice(0);
      setSellingPrice(0);
    }
  };

  // Calculate totals based on "All Products" or single product
  let totalCost = 0;
  let totalRevenue = 0;
  let grossProfit = 0;
  let unitProfit = 0;
  let profitMarginPercent = 0;
  let markupPercent = 0;

  if (showAllProducts) {
    // Calculate for all products in inventory
    products.forEach((p) => {
      const qty = p.current_stock || 0;
      const cost = p.purchase_price || 0;
      const selling = p.selling_price || 0;
      totalCost += qty * cost;
      totalRevenue += qty * selling;
    });
    grossProfit = totalRevenue - totalCost;
    profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    markupPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  } else {
    // Calculate for single product or custom
    totalCost = (quantity || 0) * (costPrice || 0);
    totalRevenue = (quantity || 0) * (sellingPrice || 0);
    grossProfit = totalRevenue - totalCost;
    unitProfit = (sellingPrice || 0) - (costPrice || 0);
    profitMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    markupPercent = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  }

  return (
    <Card className="border-border/80 shadow-xs bg-card">
      <CardHeader className="py-4 px-5 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              <span>Daily Profit Simulator (By Quantity & Price)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Calculate projected wholesale net profit by entering product quantity, landed cost, and selling price
            </CardDescription>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            On-Demand Margin Simulator
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Input Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Pick from catalog or custom */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
              <Package className="h-3 w-3 text-primary" />
              <span>Select Product (Catalog)</span>
            </label>
            <select
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20"
              value={showAllProducts ? 'ALL' : selectedProduct?.id || ''}
              onChange={(e) => handleSelectProduct(e.target.value)}
            >
              <option value="">-- Custom Manual Product --</option>
              <option value="ALL" className="font-bold text-primary">
                ✨ ALL PRODUCTS (Combined Inventory)
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} • {p.name} (Stock: {p.current_stock || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Product Name / Label */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground">Product Name / Batch</label>
            <Input
              type="text"
              placeholder="e.g. Energy Drink Carton"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          {/* Quantity - disabled when All Products selected */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
              <span>Quantity (Units / Boxes)</span>
              {selectedProduct && (
                <span className="text-[9px] font-normal text-muted-foreground italic">
                  ✓ From inventory
                </span>
              )}
            </label>
            <Input
              type="number"
              min="1"
              step="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              className="h-9 text-xs font-mono font-bold"
              disabled={showAllProducts}
              placeholder={showAllProducts ? 'Auto from inventory' : '0'}
            />
          </div>

          {/* Rates: Cost vs Selling - disabled when All Products selected */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                <span>Cost Rate</span>
                {selectedProduct && (
                  <span className="text-[9px] font-normal text-muted-foreground italic">✓ Auto</span>
                )}
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-9 text-xs font-mono text-muted-foreground"
                disabled={showAllProducts}
                placeholder={showAllProducts ? 'Auto' : '0'}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground flex items-center justify-between">
                <span>Selling Rate</span>
                {selectedProduct && (
                  <span className="text-[9px] font-normal text-muted-foreground italic">✓ Auto</span>
                )}
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={sellingPrice || ''}
                onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="h-9 text-xs font-mono font-bold text-primary"
                disabled={showAllProducts}
                placeholder={showAllProducts ? 'Auto' : '0'}
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Results */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {/* Total Landed Cost */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Inward Cost
            </div>
            <div className="text-lg font-black font-mono text-foreground">
              {formatCurrency(totalCost)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {showAllProducts ? 'All inventory items' : `${quantity} × ${formatCurrency(costPrice)}`}
            </div>
          </div>

          {/* Total Wholesale Revenue */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Gross Wholesale Revenue
            </div>
            <div className="text-lg font-black font-mono text-foreground">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              {showAllProducts ? 'All inventory items' : `${quantity} × ${formatCurrency(sellingPrice)}`}
            </div>
          </div>

          {/* Calculated Net Profit */}
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
              <span>Calculated Net Profit</span>
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(grossProfit)}
            </div>
            <div className="text-[10px] text-emerald-600/80 font-mono">
              {showAllProducts ? `${products.length} products` : `+${formatCurrency(unitProfit)} / unit`}
            </div>
          </div>

          {/* Margin & Markup */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 shadow-xs space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center justify-between">
              <span>Profit Margin</span>
              <Percent className="h-3.5 w-3.5" />
            </div>
            <div className="text-xl font-black font-mono text-primary">
              {profitMarginPercent.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              Markup: {markupPercent.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
