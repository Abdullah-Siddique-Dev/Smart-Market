# 📖 Smart Market OS - Complete Operations Guide

## 🚀 Real-Time Operational Flow

---

## 🔐 STEP 1: Initial Login & Setup

### Login Credentials (Default)
- **URL**: http://localhost:1420/
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: OWNER (Full Access)

### First Time Setup:
1. Open http://localhost:1420/ in your browser
2. Enter username: `admin`
3. Enter password: `admin123`
4. Click "Login"
5. You'll be taken to the Dashboard

---

## 🔒 STEP 2: Enable Two-Factor Authentication (Optional but Recommended)

### Setup 2FA:
1. Click **Settings** (gear icon) in sidebar
2. Scroll to **Two-Factor Authentication** section
3. Click **"Enable Two-Factor Authentication"**
4. **Step 1**: Scan QR code with Google Authenticator app
   - Or manually enter the secret key shown
5. **Step 2**: Enter 6-digit code from your app to verify
6. **Step 3**: Save your 10 backup codes (print or store securely)
7. Click **"Complete Setup"**

### Next Login with 2FA:
1. Enter username & password
2. Enter 6-digit TOTP code from Google Authenticator
3. Or use backup code if needed

---

## 📦 STEP 3: Add Vendors (Suppliers)

### Create Your First Vendor:
1. Click **"Vendors"** in the sidebar
2. Click **"Add Vendor"** button (top right)
3. Fill in vendor details:
   - **Vendor Name**: e.g., "ABC Wholesale Ltd"
   - **Contact Person**: e.g., "John Smith"
   - **Phone**: e.g., "555-1234"
   - **Email**: john@abcwholesale.com
   - **Address**: Full address
   - **Credit Limit**: e.g., 50000 (optional)
   - **Payment Terms**: e.g., "Net 30 days"
4. Click **"Create Vendor"**

**Example Vendors to Add:**
- ABC Wholesale Ltd (Electronics)
- Fresh Foods Distributors (Food Items)
- Office Supplies Co. (Stationery)

---

## 🏷️ STEP 4: Add Product Categories

### Create Categories:
1. Click **"Categories"** in sidebar
2. Click **"Add Category"** button
3. Enter category details:
   - **Name**: e.g., "Electronics"
   - **Description**: "Electronic items and accessories"
4. Click **"Create"**

**Suggested Categories:**
- Electronics
- Food & Beverages
- Office Supplies
- Household Items
- Clothing

---

## 📦 STEP 5: Add Products to Inventory

### Method A: Add Single Product
1. Click **"Inventory"** in sidebar
2. Click **"Add Product"** button
3. Fill in product details:
   - **Product Name**: e.g., "Samsung Galaxy S21"
   - **SKU**: e.g., "SAM-S21-128"
   - **Category**: Select from dropdown
   - **Unit**: e.g., "piece", "kg", "box"
   - **Cost Price**: e.g., 45000 (what you pay vendor)
   - **Sale Price**: e.g., 55000 (what customer pays)
   - **Stock Quantity**: e.g., 50
   - **Minimum Stock**: e.g., 10 (reorder alert threshold)
   - **Description**: Optional details
4. Click **"Add Product"**

### Method B: Import Multiple Products (Excel/CSV)
1. Click **"Inventory"** → **"Import"** tab
2. Download the sample template
3. Fill Excel with your products:
   ```
   Name, SKU, Category, Unit, Cost, Sale Price, Stock, Min Stock
   Samsung S21, SAM-S21, Electronics, piece, 45000, 55000, 50, 10
   iPhone 13, APL-IP13, Electronics, piece, 65000, 75000, 30, 5
   ```
4. Select vendor (optional)
5. Upload the file
6. Click **"Import"**

---

## 🛒 STEP 6: Process Customer Orders (REAL-TIME FLOW)

### Scenario: Customer Walks In

#### A. Create New Order:
1. Click **"Orders"** in sidebar
2. Click **"New Order"** button
3. **Add Customer Details** (Optional):
   - Name: "Ali Ahmed"
   - Phone: "555-9876"
   - Or select existing customer

#### B. Add Items to Order:
1. Click **"Add Item"** button
2. Search/select product: "Samsung Galaxy S21"
3. Enter quantity: 2
4. System shows:
   - Unit Price: 55,000
   - Subtotal: 110,000
5. Click **"Add to Order"**
6. Repeat for more items:
   - "iPhone 13" x 1 = 75,000
   - "Wireless Mouse" x 3 = 4,500

#### C. Apply Discount (Optional):
- Enter discount percentage: e.g., 5%
- Or enter fixed discount amount: e.g., 5000

#### D. Review Order Summary:
```
Items Total:    189,500
Discount (-5%):  -9,475
Final Total:    180,025
```

#### E. Select Payment Method:
- **Cash** → Customer pays 180,025 in cash
- **Card** → Swipe card payment
- **Credit** → Customer will pay later (if allowed)

#### F. Complete Order:
1. Click **"Place Order"** / **"Complete Sale"**
2. System automatically:
   - ✅ Deducts inventory (Samsung S21: 50→48, iPhone: 30→29)
   - ✅ Records payment
   - ✅ Generates receipt
   - ✅ Updates sales statistics
3. Print receipt (if printer connected)

---

## 📊 STEP 7: Track Low Stock & Reorder

### Monitor Stock Levels:
1. Go to **"Inventory"**
2. Filter by **"Low Stock"** to see items below minimum
3. View alerts on dashboard showing:
   ```
   ⚠️ Low Stock Alert:
   - Samsung Galaxy S21: 8 units (Min: 10)
   - Wireless Mouse: 5 units (Min: 15)
   ```

### Create Purchase Order to Vendor:
1. Click **"Purchases"** in sidebar
2. Click **"New Purchase"**
3. Select **Vendor**: "ABC Wholesale Ltd"
4. Add items to purchase:
   - Samsung Galaxy S21 x 50 units
   - Unit cost: 45,000
5. Total: 2,250,000
6. Click **"Create Purchase Order"**
7. Status: "Pending" → "Received" when stock arrives

---

## 💰 STEP 8: Record Expenses

### Track Business Expenses:
1. Click **"Expenses"** in sidebar
2. Click **"Add Expense"**
3. Fill details:
   - **Category**: "Utilities" / "Rent" / "Salaries" / "Transport"
   - **Amount**: 15000
   - **Description**: "Electricity bill - January"
   - **Date**: Select date
   - **Payment Method**: Cash/Card
4. Click **"Save Expense"**

---

## 📈 STEP 9: View Reports & Analytics

### Dashboard Overview:
- **Today's Sales**: Total revenue today
- **Total Orders**: Number of orders
- **Low Stock Items**: Products needing reorder
- **Recent Transactions**: Latest sales

### Detailed Reports:
1. **Sales Report**:
   - Click "Reports" → "Sales"
   - Filter by date range
   - View daily/weekly/monthly sales
   - Export to Excel

2. **Inventory Report**:
   - Current stock levels
   - Stock value
   - Product movement

3. **Profit/Loss Report**:
   - Total revenue
   - Cost of goods sold
   - Expenses
   - Net profit

---

## 👥 STEP 10: Manage Staff (Multi-User)

### Add New Staff Member:
1. Click **"Settings"** → **"Users"**
2. Click **"Add User"**
3. Fill details:
   - **Username**: "cashier1"
   - **Password**: "Pass123!"
   - **Full Name**: "Ahmed Khan"
   - **Role**: CASHIER / MANAGER / OWNER
   - **Permissions**:
     - CASHIER: Can process orders, view inventory
     - MANAGER: + Can add products, view reports
     - OWNER: Full system access
4. Click **"Create User"**

---

## 🔄 DAILY OPERATIONS FLOW

### Morning Routine:
1. ✅ Login to system
2. ✅ Check dashboard for overnight orders (if any)
3. ✅ Review low stock alerts
4. ✅ Set daily sales target

### During Business Hours:
1. 🛒 Process customer orders as they come
2. 📦 Receive vendor deliveries → Update purchases to "Received"
3. 💵 Record any expenses immediately
4. 📊 Monitor real-time sales on dashboard

### Evening Routine:
1. ✅ Review total sales for the day
2. ✅ Check cash/card payment totals
3. ✅ Verify inventory changes
4. ✅ Note any issues or shortages
5. ✅ Plan tomorrow's restocking

---

## 🎯 COMPLETE EXAMPLE WORKFLOW

### Real Business Scenario:

**9:00 AM** - Login & Check Dashboard
- Total stock value: 5,000,000
- Low stock: 3 items need reordering

**9:30 AM** - Vendor Delivery Arrives
- Create Purchase Order for ABC Wholesale
- Mark as "Received"
- Inventory auto-updates

**10:00 AM** - First Customer Order
- Customer: Walk-in
- Items: Samsung S21 (2 units), Mouse (1 unit)
- Total: 114,500
- Payment: Cash
- ✅ Sale completed, receipt printed

**12:00 PM** - Record Lunch Expense
- Category: Staff Meals
- Amount: 2,000
- Payment: Cash

**3:00 PM** - Bulk Customer Order
- Customer: "Tech Store XYZ" (Regular)
- Items: 20 phones, 30 accessories
- Total: 1,500,000
- Payment: Credit (Net 30 days)
- ✅ Order completed, invoice generated

**6:00 PM** - Day End Review
- Total sales: 2,850,000
- Total expenses: 25,000
- Net profit: 340,000
- Orders completed: 47
- Low stock alerts: Create PO for tomorrow

---

## 🆘 COMMON OPERATIONS

### Change Product Price:
1. Go to Inventory
2. Click product name
3. Edit "Sale Price"
4. Save changes

### Issue Refund:
1. Go to Orders
2. Find original order
3. Click "Refund" / "Return"
4. Select items to return
5. Inventory auto-restocked

### Generate Invoice:
- Every order automatically generates invoice
- Click "Print" or "Download PDF"

### Export Data:
- Most tables have "Export" button
- Downloads Excel/CSV file

---

## 📱 OFFLINE MODE (Tauri Desktop App)

The Smart Market OS works 100% offline:
- ✅ All data stored locally in SQLite
- ✅ No internet required for operations
- ✅ 2FA works offline (TOTP app syncs)
- ✅ Can export data for backup

---

## 🔧 TROUBLESHOOTING

### "Product out of stock" error:
- Check inventory, restock from vendor

### "Low stock" alerts not showing:
- Set minimum stock level for each product

### Forgot 2FA device:
- Use one of the 10 backup codes saved during setup

### Need to reset admin password:
- Access database directly and run password reset

---

## 📞 SUPPORT

For questions or issues:
- Check this guide first
- Review error messages
- Contact system administrator

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Smart Market OS** - Complete Wholesale ERP Solution with 2FA Security
