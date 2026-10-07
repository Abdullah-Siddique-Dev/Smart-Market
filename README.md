# Smart Market OS — Windows Desktop Enterprise ERP

A local-first, high-performance Desktop ERP application engineered specifically for wholesale FMCG and distribution operations, featuring an embedded SQLite database engine running in WAL mode, enterprise transactional safety, and an enterprise layered canvas UI.

---

## 🚀 Quick Start (Running the Desktop Application)

### 1. Launch via Pre-compiled Native Executable
Double-click:
```
Smart Market OS.exe
```
This native executable:
- Initializes the local SQLite backend service silently in the background (no console window flicker).
- Connects directly to the embedded database at `data/smart_market.sqlite`.
- Opens a dedicated, borderless desktop application window with native hardware acceleration.

### Default Login Credentials
- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `OWNER` (Full administrative privilege across all 10 ERP modules)

---

## 🛠️ Developer Scripts

Run all scripts from the `d:\Projects\Smart Market` root:

| Command | Description |
| :--- | :--- |
| `pnpm dev:all` | Launches both Vite React frontend and SQLite Express backend concurrently with hot reload |
| `pnpm lint` | Strict TypeScript typecheck across all modules (`tsc --noEmit`) |
| `pnpm build` | Compiles and bundles production frontend into `dist/` |
| `pnpm build:server` | Compiles TypeScript backend engine into `server/dist/` |
| `pnpm build:launcher` | Compiles `Smart Market OS.exe` native Windows launcher using GCC |
| `pnpm server:test` | Executes automated smoke test suite across all 10 domain services |
| `pnpm tauri dev` | Launches application in Tauri native desktop development mode |
| `pnpm tauri:build` | Generates native Tauri MSI/NSIS release packages |

---

## 🏛️ Architecture & Database Safety

- **Engine:** SQLite 3 with `better-sqlite3` native C++ bindings.
- **Journal Mode:** Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) for high-concurrency read/write operations.
- **Integrity Invariants:**
  - Foreign keys strictly enforced (`PRAGMA foreign_keys = ON;`).
  - Strict atomic billing transactions (`BEGIN TRANSACTION ... COMMIT`).
  - Landed purchase cost is snapshotted directly onto `bill_items` at sale time to preserve historical gross margins against vendor price changes.
  - Append-only audit trail in `inventory_ledger` for every stock movement.
- **Design Tokens:**
  - Enterprise layered canvas (`slate-50` background, elevated cards).
  - Typography: `Plus Jakarta Sans` for UI copy, `JetBrains Mono` for financials, SKUs, and invoices.
  - Full support for dark and light enterprise themes.
