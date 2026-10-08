import { UserRole, OrderStatus, PaymentStatus, InventoryTransactionType, OrderSource } from './enums';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: number;
  created_at?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  unit: string;
  purchase_price?: number; // Only returned if OWNER
  selling_price: number;
  current_stock: number;
  min_stock_alert: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ProductImport {
  id: number;
  import_number: string;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  supplier_info: string | null;
  import_date: string;
  received_by: number;
  receiver_name: string;
  created_at: string;
}

export interface RetailShop {
  id: number;
  shop_name: string;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  outstanding_balance: number;
  credit_limit: number;
  created_at: string;
}

export interface OrderBooker {
  id: number;
  name: string;
  phone: string;
  territory: string | null;
  commission_rate: number;
  is_active: number;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
}

export interface Order {
  id: number;
  order_number: string;
  shop_id: number;
  shop_name: string;
  order_booker_id?: number | null;
  booker_name?: string | null;
  order_source?: OrderSource;
  order_date: string;
  status: OrderStatus;
  total_amount: number;
  notes: string | null;
  created_by: number;
  creator_name: string;
  created_at: string;
  items?: OrderItem[];
}

export interface DispatchSlipItem {
  id?: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  dispatched_qty: number;
  returned_qty: number;
  billed_qty: number;
}

export interface DispatchSlip {
  id: number;
  slip_number: string;
  order_booker_id: number;
  booker_name: string;
  dispatch_date: string;
  status: 'DISPATCHED' | 'RECONCILED';
  notes: string | null;
  created_by: number;
  creator_name: string;
  items?: DispatchSlipItem[];
}

export interface BillItem {
  id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_selling_price: number;
  unit_purchase_price?: number;
  line_total: number;
  line_profit?: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  order_id: number | null;
  shop_id: number;
  shop_name: string;
  shop_phone: string | null;
  shop_address: string | null;
  order_booker_id?: number | null;
  booker_name?: string | null;
  bill_date: string;
  subtotal: number;
  discount_amount: number;
  net_amount: number;
  paid_amount: number;
  payment_status: PaymentStatus;
  created_by: number;
  creator_name: string;
  created_at: string;
  items?: BillItem[];
}

export interface InventoryLedgerEntry {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  unit: string;
  change_qty: number;
  balance_after: number;
  transaction_type: InventoryTransactionType;
  reference_id: number;
  reference_type: string;
  performed_by: number;
  performer_name: string;
  notes: string | null;
  created_at: string;
}

export interface ProfitReport {
  period: string;
  total_sales: number;
  total_profit: number;
  total_discounts: number;
  net_profit: number;
  profit_margin_percent: number;
  orders_completed: number;
  orders_pending: number;
}

export interface BookerPerformance {
  booker: OrderBooker;
  orders_assigned: number;
  orders_collected: number;
  orders_pending: number;
  total_sales_amount: number;
  cash_collected_amount: number;
  credit_issued_amount: number;
  estimated_commission: number;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string;
  created_by: number;
  creator_name: string;
  created_at: string;
}

export interface ExpenseSummary {
  total_today: number;
  total_this_month: number;
  total_this_year: number;
}

export interface Vendor {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  total_purchases: number;
  total_paid: number;
  payable_balance: number;
  is_active: number;
  created_by: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPayment {
  id: number;
  vendor_id: number;
  vendor_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_by: number;
  creator_name: string;
  created_at: string;
}

export interface VendorPurchase {
  id: number;
  import_number: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  import_date: string;
  supplier_info: string | null;
}

// Two-Factor Authentication Types
export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface BackupCodeInfo {
  id: number;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface TwoFactorBackupCodes {
  codes: BackupCodeInfo[];
  total: number;
}

export interface TwoFactorAuditLog {
  id: number;
  user_id: number;
  event_type: 'ENABLED' | 'DISABLED' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'BACKUP_CODE_USED';
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  created_at: string;
}

export interface LoginResponse {
  success: boolean;
  requiresTwoFactor?: boolean;
  user?: User;
  message: string;
}
