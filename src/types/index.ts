export type UserRole = 'admin' | 'manager' | 'cashier' | 'kitchen' | 'inventory';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  active?: number;
  created_at?: string;
}

export interface RestaurantSettings {
  id: number;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  currency_symbol: string;
  tax_rate_percent: number;
  service_charge_percent: number;
  receipt_footer: string;
  low_stock_threshold_default: number;
  updated_at?: string;
}

export interface TableItem {
  id: number;
  table_number: string;
  capacity: number;
  floor: string;
  status: 'available' | 'occupied' | 'reserved';
  current_order_id?: number | null;
  order_number?: string;
  final_amount?: number;
  order_status?: string;
  customer_name?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  icon?: string;
  item_count?: number;
}

export interface MenuItem {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  description: string;
  price: number;
  cost_price: number;
  image_url: string;
  is_available: number;
  tax_category: string;
  prep_time_minutes: number;
  has_recipe?: number;
}

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: 'kg' | 'g' | 'l' | 'ml' | 'pcs';
  current_stock: number;
  min_stock_level: number;
  cost_per_unit: number;
  supplier_id?: number | null;
  supplier_name?: string;
  total_valuation?: number;
  stock_status?: 'healthy' | 'low_stock' | 'out_of_stock';
}

export interface RecipeIngredient {
  id?: number;
  recipe_id?: number;
  ingredient_id: number;
  ingredient_name?: string;
  quantity_required: number;
  unit: string;
  cost_per_unit?: number;
  current_stock?: number;
  cost_contribution?: number;
}

export interface Recipe {
  id: number;
  menu_item_id: number;
  menu_item_name?: string;
  menu_item_price?: number;
  image_url?: string;
  category_name?: string;
  instructions: string;
  prep_notes: string;
  total_cost?: number;
  profit_margin_percent?: number;
  ingredients: RecipeIngredient[];
}

export interface StockMovement {
  id: number;
  ingredient_id: number;
  ingredient_name?: string;
  unit?: string;
  movement_type: 'purchase_received' | 'order_consumption' | 'waste' | 'manual_adjustment' | 'order_cancellation_restore';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  ingredients_supplied_count?: number;
  purchase_orders_count?: number;
}

export interface PurchaseOrderItem {
  id?: number;
  purchase_order_id?: number;
  ingredient_id: number;
  ingredient_name?: string;
  unit?: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name?: string;
  supplier_phone?: string;
  supplier_email?: string;
  status: 'draft' | 'ordered' | 'received' | 'cancelled';
  total_cost: number;
  ordered_at?: string;
  received_at?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  items?: PurchaseOrderItem[];
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  special_requests?: string;
  image_url?: string;
  prep_time_minutes?: number;
}

export interface Order {
  id: number;
  order_number: string;
  order_type: 'dine_in' | 'takeaway' | 'delivery';
  table_id?: number | null;
  table_number?: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  final_amount: number;
  special_instructions?: string;
  stock_deducted: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  invoice_number?: string;
  payment_status?: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  paid_amount?: number;
  elapsed_minutes?: number;
  is_delayed?: boolean;
  item_count?: number;
  invoice?: Invoice;
}

export interface Payment {
  id: number;
  invoice_id: number;
  order_id: number;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  transaction_reference?: string;
  status: 'completed' | 'refunded' | 'failed';
  notes?: string;
  processed_by?: string;
  created_at: string;
}

export interface Refund {
  id: number;
  payment_id: number;
  invoice_id: number;
  amount: number;
  reason: string;
  processed_by: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  order_id: number;
  order_number?: string;
  order_type?: 'dine_in' | 'takeaway' | 'delivery';
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  special_instructions?: string;
  table_number?: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'refunded';
  balance_due?: number;
  invoice_date: string;
  created_at: string;
  items?: OrderItem[];
  payments?: Payment[];
  refunds?: Refund[];
  settings?: RestaurantSettings;
}

export interface Expense {
  id: number;
  category: 'rent' | 'salaries' | 'utilities' | 'supplies' | 'maintenance' | 'marketing' | 'other';
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export interface DashboardSummary {
  metrics: {
    today_revenue: number;
    today_orders: number;
    pending_orders: number;
    preparing_orders: number;
    low_stock_count: number;
  };
  top_items: {
    name: string;
    total_sold: number;
    total_revenue: number;
  }[];
  sales_trend: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  payment_methods: {
    payment_method: string;
    count: number;
    total: number;
  }[];
  recent_orders: Order[];
  low_stock_items: {
    id: number;
    name: string;
    category: string;
    current_stock: number;
    min_stock_level: number;
    unit: string;
  }[];
}

export interface FinancialReport {
  gross_sales: number;
  total_discounts: number;
  total_taxes: number;
  total_service_charges: number;
  net_sales: number;
  total_orders: number;
  total_refunds: number;
  actual_revenue: number;
  estimated_cogs: number;
  operating_expenses: number;
  estimated_profit: number;
  daily_trends: {
    date: string;
    revenue: number;
    orders_count: number;
  }[];
}
