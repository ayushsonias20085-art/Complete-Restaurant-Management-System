import {
  User,
  RestaurantSettings,
  TableItem,
  MenuCategory,
  MenuItem,
  Ingredient,
  Recipe,
  StockMovement,
  Supplier,
  PurchaseOrder,
  Order,
  Invoice,
  Payment,
  Expense,
  DashboardSummary,
  FinancialReport,
} from '../types';

const BASE_URL = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('savoria_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      errorMsg = response.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Auth
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  quickSwitch: (role: string) =>
    request<{ token: string; user: User }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () => request<{ user: User }>('/auth/me'),

  // Users (Admin)
  getUsers: () => request<User[]>('/users'),
  createUser: (data: Partial<User> & { password: string }) =>
    request<{ id: number; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: number, data: Partial<User> & { password?: string }) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Settings & Tables
  getSettings: () => request<RestaurantSettings>('/settings'),
  updateSettings: (data: Partial<RestaurantSettings>) =>
    request<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getTables: () => request<TableItem[]>('/tables'),
  createTable: (data: Partial<TableItem>) =>
    request<{ id: number }>('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTable: (id: number, data: Partial<TableItem>) =>
    request<{ message: string }>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTable: (id: number) =>
    request<{ message: string }>(`/tables/${id}`, { method: 'DELETE' }),

  // Menu
  getCategories: () => request<MenuCategory[]>('/menu/categories'),
  createCategory: (data: Partial<MenuCategory>) =>
    request<{ id: number }>('/menu/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMenuItems: (params?: { category_id?: number; search?: string; available_only?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category_id) query.append('category_id', String(params.category_id));
    if (params?.search) query.append('search', params.search);
    if (params?.available_only) query.append('available_only', 'true');
    return request<MenuItem[]>(`/menu/items?${query.toString()}`);
  },
  createMenuItem: (data: Partial<MenuItem>) =>
    request<{ id: number }>('/menu/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMenuItem: (id: number, data: Partial<MenuItem>) =>
    request<{ message: string }>(`/menu/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMenuItem: (id: number) =>
    request<{ message: string }>(`/menu/items/${id}`, { method: 'DELETE' }),

  // Inventory
  getIngredients: (params?: { category?: string; search?: string; stock_status?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.stock_status) query.append('stock_status', params.stock_status);
    return request<{
      ingredients: Ingredient[];
      summary: {
        total_ingredients: number;
        total_inventory_value: number;
        low_stock_count: number;
        out_of_stock_count: number;
      };
    }>(`/inventory/ingredients?${query.toString()}`);
  },
  createIngredient: (data: Partial<Ingredient>) =>
    request<{ id: number }>('/inventory/ingredients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIngredient: (id: number, data: Partial<Ingredient>) =>
    request<{ message: string }>(`/inventory/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  adjustStock: (data: {
    ingredient_id: number;
    adjustment_type: 'add' | 'waste' | 'set';
    quantity: number;
    reason?: string;
    notes?: string;
  }) =>
    request<{ message: string; current_stock: number }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getStockMovements: (params?: { ingredient_id?: number; movement_type?: string }) => {
    const query = new URLSearchParams();
    if (params?.ingredient_id) query.append('ingredient_id', String(params.ingredient_id));
    if (params?.movement_type) query.append('movement_type', params.movement_type);
    return request<StockMovement[]>(`/inventory/movements?${query.toString()}`);
  },

  // Recipes
  getRecipes: () => request<Recipe[]>('/recipes'),
  saveRecipe: (data: {
    menu_item_id: number;
    instructions: string;
    prep_notes: string;
    ingredients: { ingredient_id: number; quantity_required: number; unit: string }[];
  }) =>
    request<{ id: number; message: string }>('/recipes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Suppliers & PO
  getSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: Partial<Supplier>) =>
    request<{ id: number }>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPurchaseOrders: () => request<PurchaseOrder[]>('/purchase-orders'),
  createPurchaseOrder: (data: {
    supplier_id: number;
    notes?: string;
    items: { ingredient_id: number; quantity: number; unit_cost: number }[];
  }) =>
    request<{ poId: number; poNumber: string; totalCost: number }>('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  receivePurchaseOrder: (id: number) =>
    request<{ message: string }>(`/purchase-orders/${id}/receive`, {
      method: 'POST',
    }),

  // Orders
  getOrders: (params?: {
    status?: string;
    order_type?: string;
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.order_type) query.append('order_type', params.order_type);
    if (params?.payment_status) query.append('payment_status', params.payment_status);
    if (params?.search) query.append('search', params.search);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<{
      orders: Order[];
      counts: {
        total: number;
        pending: number;
        confirmed: number;
        preparing: number;
        ready: number;
        completed: number;
        cancelled: number;
      };
    }>(`/orders?${query.toString()}`);
  },
  getOrder: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (data: any) =>
    request<{ orderId: number; orderNumber: string; finalAmount: number; invoiceNumber: string }>(
      '/orders',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  updateOrderStatus: (id: number, status: string) =>
    request<{ message: string; status: string }>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Kitchen Display
  getKitchenOrders: () => request<Order[]>('/kitchen/orders'),

  // Billing & Invoices
  getInvoices: (params?: {
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.payment_status) query.append('payment_status', params.payment_status);
    if (params?.search) query.append('search', params.search);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<Invoice[]>(`/billing/invoices?${query.toString()}`);
  },
  getInvoice: (id: number) => request<Invoice>(`/billing/invoices/${id}`),
  recordPayment: (data: {
    invoice_id: number;
    amount: number;
    payment_method: string;
    transaction_reference?: string;
    notes?: string;
  }) =>
    request<{ message: string; payment_id: number; paid_amount: number; payment_status: string }>(
      '/billing/payments',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),
  processRefund: (data: { payment_id: number; amount: number; reason: string }) =>
    request<{ message: string }>('/billing/refunds', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses & Reports
  getExpenses: (params?: { category?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<Expense[]>(`/expenses?${query.toString()}`);
  },
  createExpense: (data: Partial<Expense>) =>
    request<{ id: number }>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id: number) =>
    request<{ message: string }>(`/expenses/${id}`, { method: 'DELETE' }),

  getFinancialReport: (params?: { start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    return request<FinancialReport>(`/reports/financial?${query.toString()}`);
  },

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Audit
  getAuditLogs: () => request<any[]>('/audit-logs'),
};
