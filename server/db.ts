import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../restaurant.db');
export const db = new Database(dbPath);

// Enable WAL mode for high concurrency and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- Users and Roles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier', 'kitchen', 'inventory')),
      phone TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Restaurant Settings
    CREATE TABLE IF NOT EXISTS restaurant_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Savoria Bistro & Lounge',
      tagline TEXT DEFAULT 'Artisanal Culinary & Fine Dining',
      address TEXT DEFAULT '452 Grand Avenue, Suite 100, Metro City',
      phone TEXT DEFAULT '+1 (555) 789-2345',
      email TEXT DEFAULT 'contact@savoria-bistro.com',
      currency_symbol TEXT DEFAULT '$',
      tax_rate_percent REAL DEFAULT 8.5,
      service_charge_percent REAL DEFAULT 5.0,
      receipt_footer TEXT DEFAULT 'Thank you for dining with us! Please visit again.',
      low_stock_threshold_default INTEGER DEFAULT 10,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Restaurant Dining Tables
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL DEFAULT 4,
      floor TEXT DEFAULT 'Main Dining Room',
      status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'reserved')),
      current_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Menu Categories
    CREATE TABLE IF NOT EXISTS menu_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      icon TEXT DEFAULT 'Utensils',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Menu Items
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES menu_categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      image_url TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      tax_category TEXT DEFAULT 'standard',
      prep_time_minutes INTEGER DEFAULT 15,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Ingredients
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      unit TEXT NOT NULL CHECK(unit IN ('kg', 'g', 'l', 'ml', 'pcs')),
      current_stock REAL NOT NULL DEFAULT 0,
      min_stock_level REAL NOT NULL DEFAULT 5,
      cost_per_unit REAL NOT NULL DEFAULT 0,
      supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Recipes (1 per menu item)
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL UNIQUE REFERENCES menu_items(id) ON DELETE CASCADE,
      instructions TEXT,
      prep_notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Recipe Ingredients
    CREATE TABLE IF NOT EXISTS recipe_ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
      quantity_required REAL NOT NULL,
      unit TEXT NOT NULL
    );

    -- Purchase Orders
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_number TEXT NOT NULL UNIQUE,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'ordered', 'received', 'cancelled')),
      total_cost REAL NOT NULL DEFAULT 0,
      ordered_at DATETIME,
      received_at DATETIME,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchase Order Items
    CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      total_cost REAL NOT NULL
    );

    -- Stock Movements History
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('purchase_received', 'order_consumption', 'waste', 'manual_adjustment', 'order_cancellation_restore')),
      quantity_change REAL NOT NULL,
      quantity_before REAL NOT NULL,
      quantity_after REAL NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Customer Orders
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL CHECK(order_type IN ('dine_in', 'takeaway', 'delivery')),
      table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL,
      customer_name TEXT DEFAULT 'Walk-in Guest',
      customer_phone TEXT,
      delivery_address TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
      subtotal REAL NOT NULL DEFAULT 0,
      discount_type TEXT DEFAULT 'percentage' CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      service_charge REAL DEFAULT 0,
      final_amount REAL NOT NULL DEFAULT 0,
      special_instructions TEXT,
      stock_deducted INTEGER NOT NULL DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
      item_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      subtotal REAL NOT NULL,
      special_requests TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      tax_amount REAL NOT NULL,
      service_charge REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK(payment_status IN ('unpaid', 'partially_paid', 'paid', 'refunded')),
      invoice_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'upi', 'bank_transfer', 'other')),
      transaction_reference TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'refunded', 'failed')),
      notes TEXT,
      processed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Refunds
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      processed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Operating Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL CHECK(category IN ('rent', 'salaries', 'utilities', 'supplies', 'maintenance', 'marketing', 'other')),
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      payment_method TEXT DEFAULT 'bank_transfer',
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
