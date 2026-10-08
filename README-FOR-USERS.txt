================================================================
            SMART MARKET OS v1.0.0
        Wholesale Distribution ERP System
================================================================

SYSTEM REQUIREMENTS:
-------------------
✅ Windows 7/8/10/11 (64-bit)
✅ Node.js 18.x or higher (MUST BE INSTALLED)
✅ 500 MB free disk space
✅ Internet connection (only for Node.js installation)

================================================================
                  INSTALLATION STEPS
================================================================

STEP 1: Install Node.js (If Not Already Installed)
--------------------------------------------------
1. Go to: https://nodejs.org/en/download/
2. Download "LTS" version (recommended)
3. Run the installer
4. Click "Next" through all steps (keep default settings)
5. Restart your computer

To verify Node.js is installed:
- Open Command Prompt (CMD)
- Type: node --version
- You should see: v18.x.x or higher

STEP 2: Extract This Package
----------------------------
1. Right-click "SmartMarket-Complete.zip"
2. Select "Extract All..."
3. Choose a location (e.g., C:\SmartMarket)
4. Click "Extract"

STEP 3: Run the Application
---------------------------
1. Open the extracted folder
2. Double-click: RUN-SMARTMARKET.bat
3. Wait 5-10 seconds for server to start
4. Application will open automatically!

================================================================
                   DEFAULT LOGIN
================================================================

Username: admin
Password: admin123

⚠️ IMPORTANT: Change the password after first login!

================================================================
                   TROUBLESHOOTING
================================================================

Problem: "Node.js is NOT installed" error
Solution: Install Node.js from nodejs.org and restart

Problem: "Failed to login" or connection error
Solution: 
  - Ensure port 4000 is not being used by another program
  - Check Windows Firewall settings
  - Try running as Administrator

Problem: Application doesn't start
Solution:
  - Verify all files are extracted (especially "server" folder)
  - Make sure you have extracted everything, not running from ZIP
  - Check antivirus isn't blocking the .exe

Problem: "Server might not be running" warning
Solution:
  - Wait a bit longer (sometimes takes 10-15 seconds)
  - Close other applications using network
  - Restart computer and try again

================================================================
                      FILE STRUCTURE
================================================================

SmartMarket-Complete/
├── smartmarket.exe          Main application (4.2 MB)
├── RUN-SMARTMARKET.bat      Launch script (USE THIS!)
├── server/                  Backend server files
│   ├── dist/                Compiled server code
│   ├── node_modules/        Dependencies (~200 MB)
│   └── package.json         Server configuration
└── README-FOR-USERS.txt     This file

DO NOT delete any files or folders!

================================================================
                     WHAT THIS APP DOES
================================================================

Smart Market OS is a complete wholesale/distribution ERP:

✅ Inventory Management      - Track products & stock levels
✅ Order Management          - Process customer orders
✅ Vendor Management         - Manage suppliers
✅ Purchase Orders           - Create & track purchases
✅ Billing & Invoicing       - Generate invoices & bills
✅ Expense Tracking          - Record business expenses
✅ Sales Reports             - View analytics & reports
✅ Two-Factor Auth (2FA)     - Secure login with Google Authenticator
✅ Multi-User Support        - Multiple staff accounts
✅ 100% Offline             - Works without internet

================================================================
                      DATA STORAGE
================================================================

Your data is stored locally in:
C:\Users\[YourName]\AppData\Local\SmartMarket\data\

This includes:
- Database (smart_market.sqlite)
- Product images
- Reports & exports

⚠️ BACKUP RECOMMENDATION:
Make regular backups of this folder to prevent data loss!

================================================================
                        SUPPORT
================================================================

For complete usage instructions, see:
OPERATIONS_GUIDE.md (in the project folder)

For technical issues:
- Check this README's troubleshooting section
- Verify Node.js is properly installed
- Ensure all files were extracted correctly

================================================================
                   UNINSTALLATION
================================================================

To remove Smart Market OS:
1. Close the application
2. Delete the SmartMarket-Complete folder
3. Delete data folder (see "Data Storage" section above)
4. Done! No registry entries or system changes

================================================================

Thank you for using Smart Market OS!

Last Updated: January 2025
Version: 1.0.0
================================================================
