# 🍽️ Savoria — Complete Restaurant Management System (RMS)

A complete, modern, responsive, and database-connected Restaurant Management System that integrates **Order Management**, **Recipe-Based Inventory Control**, **POS Billing & Payments**, **Kitchen Display Line (KDS)**, and **Sales Financial Analytics** into a single unified platform.

Repository: [https://github.com/ayushsonias20085-art/Complete-Restaurant-Management-Syste.git](https://github.com/ayushsonias20085-art/Complete-Restaurant-Management-Syste.git)

---

## 🚀 Key Modules & System Architecture

### 1. 📋 Order Management System (POS & Dining Room)
- **Point of Sale (POS)**: Visual dish catalog organized by Starters, Mains, Desserts, and Beverages with live search, quantity steppers, and item special notes.
- **Service Types**: Full support for **Dine-In** (with interactive dining table selector), **Takeaway**, and **Delivery** (with address and phone capture).
- **Automated Pricing**: Real-time calculation of item subtotals, configurable sales tax, hospitality service charges, and voucher/percentage discounts.
- **Order Lifecycle**: Robust order status progression:
  $$\text{Pending} \longrightarrow \text{Confirmed} \longrightarrow \text{Preparing} \longrightarrow \text{Ready} \longrightarrow \text{Completed}$$
- **Kitchen Display System (KDS)**: Specialized ticket screen with elapsed minute counters, automatic **DELAYED** badge alerts for tickets $>15\text{m}$, dish checklists, and 1-click status advances (`Start Cooking`, `Mark Ready`, `Served & Clear`).

### 2. 📦 Inventory Management & Recipe Mapping
- **Ingredient Catalog**: Tracks stock across various units (`kg`, `g`, `l`, `ml`, `pcs`), cost per unit, and calculates total inventory valuation.
- **Recipe-Based Auto-Depletion**: Menu dishes are linked to exact ingredient recipes. Advancing an order to `Confirmed`/`Preparing` atomically depletes stock and creates an immutable `stock_movements` log.
- **Idempotency & Restoration**: Prevents duplicate stock deductions. Cancelling an order automatically restores ingredients back to stock.
- **Low-Stock Alerts**: Instant warnings in the top navbar and dashboard when quantities drop below minimum safety stock thresholds.
- **Vendor Procurement**: Supplier directory and purchase order workflow with a **"Receive Delivery"** feature that updates stock levels upon delivery.

### 3. 💳 Billing, Invoices & Sales Analytics
- **Tax Invoices**: Generates unique sequence invoices (`INV-2026-XXXX`) directly from confirmed orders.
- **Flexible Payments**: Supports **Credit Card**, **Cash**, **UPI / QR**, and **Bank Transfer** with support for partial/split payments and overpayment protection.
- **Printable Thermal Receipts**: Clean, printable guest receipts with restaurant branding, tax breakdown, transaction reference, and print formatting (`window.print()`).
- **Profit & Loss (P&L) Reports**: Realized Net Sales, Cost of Goods Sold (COGS calculated from recipe consumption), Operating Expenses (rent, payroll, utilities, marketing), and Net Operating Profit.
- **Data Export**: 1-click **Export to CSV** for custom date ranges.
- **Interactive Analytics**: Daily sales trend area charts, top-selling items bar charts, and payment method distribution charts powered by Recharts.

### 4. 🔐 Role-Based Access Control (RBAC) & Floor Management
- **Pre-Configured Staff Roles**:
  - `Admin / Owner`: Full platform access, user management, restaurant tax policies, audit logs.
  - `Floor Manager`: Order oversight, inventory adjustments, menu catalog, financial reports.
  - `POS Cashier`: Order creation, billing, payment processing, thermal receipts.
  - `Kitchen Staff / Chef`: KDS tickets, preparation status, recipe viewing.
  - `Inventory Lead`: Ingredients, stock movements, vendor purchase orders.
- **Navbar Role Switcher**: 1-click switcher to test and evaluate the system from any role's viewpoint.
- **Dining Floor Plan**: Real-time seating occupancy (`Available`, `Occupied`, `Reserved`) with linked active order tickets.
- **Audit Trail**: Chronological audit logs for all logins, order transitions, and stock changes.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **Icons & Charts** | Lucide React, Recharts |
| **Backend** | Node.js 22, Express.js |
| **Database** | SQLite via `better-sqlite3` with WAL mode & Foreign Keys (easily swappable to PostgreSQL) |
| **Auth & Security** | JWT (`jsonwebtoken`), Bcrypt password hashing (`bcryptjs`), Role authorization middleware |

---

## 📂 Project Directory Structure

```text
├── server/
│   ├── db.ts               # Database schema initialization (WAL mode & tables)
│   ├── seed.ts             # Rich initial seed data (dishes, recipes, stock, orders, staff)
│   └── api.ts              # RESTful API endpoints, auth, transactions, and analytics
├── src/
│   ├── components/layout/
│   │   ├── Navbar.tsx      # Top bar with role switcher, alerts, and theme toggle
│   │   ├── Sidebar.tsx     # Collapsible navigation with permission-aware items
│   │   └── ReceiptModal.tsx # Printable thermal receipt modal
│   ├── context/
│   │   ├── AuthContext.tsx # Authentication, sessions, and quick role switching
│   │   ├── SettingsContext.tsx # Currency, tax rates, and restaurant branding
│   │   └── ThemeContext.tsx # Dark and light mode toggle
│   ├── pages/
│   │   ├── Dashboard.tsx   # Executive overview & Recharts analytics
│   │   ├── PosCreateOrder.tsx # POS menu catalog & cart order placement
│   │   ├── OrdersList.tsx  # Orders table, status workflow, and details modal
│   │   ├── KitchenDisplay.tsx # Real-time high-contrast KDS line
│   │   ├── MenuManagement.tsx # Menu dishes, margins, and availability
│   │   ├── InventoryManagement.tsx # Stock levels, adjustments, and movements
│   │   ├── RecipeManagement.tsx # Recipe builder and portion costing
│   │   ├── SupplierManagement.tsx # Vendors and purchase order deliveries
│   │   ├── BillingInvoices.tsx # Invoices, payments, refunds, and receipts
│   │   ├── FinancialReports.tsx # P&L statements and CSV exports
│   │   ├── ExpenseManagement.tsx # Operating expenses tracking
│   │   ├── TablesManagement.tsx # Interactive floor plan and table status
│   │   ├── UserManagement.tsx # Staff accounts and role assignments
│   │   ├── RestaurantSettings.tsx # Tax rates and receipt customization
│   │   └── AuditLogs.tsx   # System security audit trail
│   ├── services/api.ts     # Frontend typed API client
│   ├── types/index.ts      # TypeScript interfaces and entity types
│   ├── App.tsx             # Root application orchestrator
│   └── main.tsx            # React application entry
├── server.ts               # Express full-stack entry with Vite dev middleware
├── package.json
└── tsconfig.json
```

---

## ⚡ Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/ayushsonias20085-art/Complete-Restaurant-Management-Syste.git
cd Complete-Restaurant-Management-Syste
npm install --legacy-peer-deps
```

### 2. Environment Setup
Copy the sample environment file:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The SQLite database will automatically initialize and populate with rich seed data on first run.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🔑 Pre-Seeded Staff Credentials

Use the **Quick Role Switcher** dropdown in the top navigation bar to test all views instantly, or log in with these credentials:

| Role | Email | Password |
|---|---|---|
| **Admin / Owner** | `admin@savoria.com` | `admin123` |
| **Floor Manager** | `manager@savoria.com` | `manager123` |
| **POS Cashier** | `cashier@savoria.com` | `cashier123` |
| **Head Chef** | `kitchen@savoria.com` | `kitchen123` |
| **Stock Lead** | `inventory@savoria.com` | `inventory123` |

---

## 📡 REST API Reference

### Authentication & Staff
- `POST /api/auth/login` — Sign in with email and password
- `POST /api/auth/quick-switch` — Fast role switcher for development & evaluation
- `GET /api/auth/me` — Retrieve active session profile
- `GET /api/users` — Staff list (Admin only)
- `POST /api/users` — Create staff account (Admin only)
- `PUT /api/users/:id` — Update role or account status

### Orders & Kitchen
- `GET /api/orders` — Filtered orders list (status, type, payment, search)
- `POST /api/orders` — Create new order with itemized lines & auto-generated invoice
- `GET /api/orders/:id` — Full order detail with items and invoice
- `PATCH /api/orders/:id/status` — Advance order status with automatic recipe stock depletion/restoration
- `GET /api/kitchen/orders` — Active KDS tickets with preparation timers and delay flags

### Inventory & Recipes
- `GET /api/inventory/ingredients` — Ingredients with health badges and stock valuation
- `POST /api/inventory/ingredients` — Add new ingredient
- `POST /api/inventory/adjust` — Manual stock addition, kitchen wastage, or count correction
- `GET /api/inventory/movements` — Chronological stock movement audit trail
- `GET /api/recipes` — Recipes with ingredient breakdown and profit margins
- `POST /api/recipes` — Create or update dish recipe formula

### Procurement & Vendors
- `GET /api/suppliers` — Vendor directory
- `POST /api/suppliers` — Register vendor
- `GET /api/purchase-orders` — Purchase order history
- `POST /api/purchase-orders` — Issue purchase order with line items
- `POST /api/purchase-orders/:id/receive` — Receive delivery and atomically increment ingredient stock

### Billing, Payments & Financials
- `GET /api/billing/invoices` — Tax invoices with balance due
- `GET /api/billing/invoices/:id` — Invoice detail with payment breakdown
- `POST /api/billing/payments` — Record payment (Cash, Card, UPI, Wire; split payments supported)
- `POST /api/billing/refunds` — Issue refund and recalculate balance
- `GET /api/reports/financial` — P&L summary, COGS, expenses, and daily sales trend
- `GET /api/expenses` — Logged operating expenses
- `POST /api/expenses` — Record expense
- `GET /api/dashboard/summary` — Central KPI cards and chart analytics

---

## 🚢 Pushing to Your GitHub Repository

To push this complete codebase to your repository:

```bash
git remote set-url origin https://github.com/ayushsonias20085-art/Complete-Restaurant-Management-Syste.git
git add .
git commit -m "feat: complete restaurant management system with POS, inventory, billing, KDS, and analytics"
git push -u origin main
```

---

*Built with ❤️ for culinary operations and hospitality excellence.*
