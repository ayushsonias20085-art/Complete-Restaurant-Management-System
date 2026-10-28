import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';

export const apiRouter = express.Router();
apiRouter.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'savoria-super-secret-jwt-key-2026';

// Interfaces
interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'kitchen' | 'inventory';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Authentication Middleware
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Return unauthorized for protected routes
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Optional Auth (for initial loads / dev convenience)
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch {
      // Continue without user
    }
  }
  next();
}

// Role Authorization Middleware
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of [${allowedRoles.join(', ')}] permissions` });
    }
    next();
  };
}

// Log audit trail helper
export function logAudit(userId: number | null, userName: string | null, action: string, entityType: string, entityId: string, details: string) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, userName, action, entityType, entityId, details);
  } catch (err) {
    console.error('Audit log failed:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const tokenPayload: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  logAudit(user.id, user.name, 'USER_LOGIN', 'user', String(user.id), `Logged in as ${user.role}`);

  res.json({
    token,
    user: tokenPayload,
  });
});

// Quick switcher for seamless demonstration and testing of all roles
apiRouter.post('/auth/quick-switch', (req: Request, res: Response) => {
  const { role } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE role = ? AND active = 1 LIMIT 1').get(role) as any;
  if (!user) {
    return res.status(404).json({ error: `No active user found with role ${role}` });
  }

  const tokenPayload: AuthUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  logAudit(user.id, user.name, 'ROLE_SWITCH', 'user', String(user.id), `Switched active session to ${user.role}`);

  res.json({
    token,
    user: tokenPayload,
  });
});

apiRouter.get('/auth/me', authenticateToken, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

// Staff / Users Management (Admin only)
apiRouter.get('/users', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name, email, role, phone, active, created_at FROM users ORDER BY id ASC').all();
  res.json(users);
});

apiRouter.post('/users', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { name, email, password, role, phone } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, active)
      VALUES (?, ?, ?, ?, ?, 1)
    `).run(name, email, hash, role, phone || null);

    logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_USER', 'user', String(result.lastInsertRowid), `Created user ${name} (${role})`);
    res.status(201).json({ id: result.lastInsertRowid, message: 'User created successfully' });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

apiRouter.put('/users/:id', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, phone, active, password } = req.body;

  try {
    if (password && password.trim().length > 0) {
      const hash = bcrypt.hashSync(password, 10);
      db.prepare(`
        UPDATE users SET name = ?, role = ?, phone = ?, active = ?, password_hash = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, role, phone, active ? 1 : 0, hash, id);
    } else {
      db.prepare(`
        UPDATE users SET name = ?, role = ?, phone = ?, active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, role, phone, active ? 1 : 0, id);
    }

    logAudit(req.user?.id || null, req.user?.name || null, 'UPDATE_USER', 'user', id, `Updated user ID ${id}`);
    res.json({ message: 'User updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. SETTINGS & TABLES
// ==========================================

apiRouter.get('/settings', (req: Request, res: Response) => {
  const settings = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get();
  res.json(settings);
});

apiRouter.put('/settings', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const { name, tagline, address, phone, email, currency_symbol, tax_rate_percent, service_charge_percent, receipt_footer, low_stock_threshold_default } = req.body;

  db.prepare(`
    UPDATE restaurant_settings
    SET name = ?, tagline = ?, address = ?, phone = ?, email = ?,
        currency_symbol = ?, tax_rate_percent = ?, service_charge_percent = ?,
        receipt_footer = ?, low_stock_threshold_default = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `).run(
    name, tagline, address, phone, email,
    currency_symbol, tax_rate_percent, service_charge_percent,
    receipt_footer, low_stock_threshold_default
  );

  logAudit(req.user?.id || null, req.user?.name || null, 'UPDATE_SETTINGS', 'settings', '1', 'Updated restaurant configuration');
  res.json({ message: 'Settings updated successfully' });
});

apiRouter.get('/tables', (req: Request, res: Response) => {
  const tables = db.prepare(`
    SELECT t.*, o.order_number, o.final_amount, o.status as order_status, o.customer_name
    FROM tables t
    LEFT JOIN orders o ON t.current_order_id = o.id
    ORDER BY t.table_number ASC
  `).all();
  res.json(tables);
});

apiRouter.post('/tables', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { table_number, capacity, floor } = req.body;
  if (!table_number) return res.status(400).json({ error: 'Table number is required' });

  try {
    const result = db.prepare(`
      INSERT INTO tables (table_number, capacity, floor, status)
      VALUES (?, ?, ?, 'available')
    `).run(table_number, capacity || 4, floor || 'Main Dining');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Table created' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { table_number, capacity, floor, status } = req.body;
  db.prepare(`
    UPDATE tables SET table_number = ?, capacity = ?, floor = ?, status = ? WHERE id = ?
  `).run(table_number, capacity, floor, status, id);
  res.json({ message: 'Table updated' });
});

apiRouter.delete('/tables/:id', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM tables WHERE id = ?').run(id);
  res.json({ message: 'Table deleted' });
});

// ==========================================
// 3. MENU MANAGEMENT
// ==========================================

apiRouter.get('/menu/categories', (req: Request, res: Response) => {
  const categories = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM menu_items m WHERE m.category_id = c.id) as item_count
    FROM menu_categories c
    ORDER BY c.display_order ASC
  `).all();
  res.json(categories);
});

apiRouter.post('/menu/categories', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { name, description, display_order, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  try {
    const result = db.prepare(`
      INSERT INTO menu_categories (name, description, display_order, icon)
      VALUES (?, ?, ?, ?)
    `).run(name, description || null, display_order || 0, icon || 'Utensils');
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.get('/menu/items', (req: Request, res: Response) => {
  const { category_id, search, available_only } = req.query;
  let query = `
    SELECT m.*, c.name as category_name,
      (SELECT COUNT(*) FROM recipes r WHERE r.menu_item_id = m.id) as has_recipe
    FROM menu_items m
    JOIN menu_categories c ON m.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category_id) {
    query += ' AND m.category_id = ?';
    params.push(category_id);
  }
  if (available_only === 'true') {
    query += ' AND m.is_available = 1';
  }
  if (search) {
    query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY m.category_id ASC, m.name ASC';
  const items = db.prepare(query).all(...params);
  res.json(items);
});

apiRouter.post('/menu/items', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { category_id, name, description, price, cost_price, image_url, is_available, tax_category, prep_time_minutes } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: 'Category, name, and price are required' });
  }

  const result = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, price, cost_price, image_url, is_available, tax_category, prep_time_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    category_id,
    name,
    description || null,
    price,
    cost_price || 0,
    image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    is_available !== undefined ? (is_available ? 1 : 0) : 1,
    tax_category || 'standard',
    prep_time_minutes || 15
  );

  logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_MENU_ITEM', 'menu_item', String(result.lastInsertRowid), `Created menu item: ${name}`);
  res.status(201).json({ id: result.lastInsertRowid, message: 'Item created' });
});

apiRouter.put('/menu/items/:id', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { category_id, name, description, price, cost_price, image_url, is_available, tax_category, prep_time_minutes } = req.body;

  db.prepare(`
    UPDATE menu_items
    SET category_id = ?, name = ?, description = ?, price = ?, cost_price = ?,
        image_url = ?, is_available = ?, tax_category = ?, prep_time_minutes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    category_id,
    name,
    description,
    price,
    cost_price,
    image_url,
    is_available ? 1 : 0,
    tax_category,
    prep_time_minutes,
    id
  );

  logAudit(req.user?.id || null, req.user?.name || null, 'UPDATE_MENU_ITEM', 'menu_item', id, `Updated menu item: ${name}`);
  res.json({ message: 'Item updated' });
});

apiRouter.delete('/menu/items/:id', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    logAudit(req.user?.id || null, req.user?.name || null, 'DELETE_MENU_ITEM', 'menu_item', id, `Deleted menu item ID ${id}`);
    res.json({ message: 'Item deleted' });
  } catch (err: any) {
    res.status(400).json({ error: 'Cannot delete item that is referenced in orders or recipes' });
  }
});

// ==========================================
// 4. INVENTORY & INGREDIENTS MANAGEMENT
// ==========================================

apiRouter.get('/inventory/ingredients', (req: Request, res: Response) => {
  const { category, search, stock_status } = req.query;
  let query = `
    SELECT i.*, s.name as supplier_name,
      (i.current_stock * i.cost_per_unit) as total_valuation,
      CASE
        WHEN i.current_stock <= 0 THEN 'out_of_stock'
        WHEN i.current_stock <= i.min_stock_level THEN 'low_stock'
        ELSE 'healthy'
      END as stock_status
    FROM ingredients i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (category) {
    query += ' AND i.category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (i.name LIKE ? OR i.category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (stock_status === 'low') {
    query += ' AND i.current_stock <= i.min_stock_level';
  } else if (stock_status === 'out') {
    query += ' AND i.current_stock <= 0';
  }

  query += ' ORDER BY stock_status ASC, i.name ASC';
  const ingredients = db.prepare(query).all(...params);

  // Compute summary values
  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_ingredients,
      SUM(current_stock * cost_per_unit) as total_inventory_value,
      SUM(CASE WHEN current_stock <= min_stock_level AND current_stock > 0 THEN 1 ELSE 0 END) as low_stock_count,
      SUM(CASE WHEN current_stock <= 0 THEN 1 ELSE 0 END) as out_of_stock_count
    FROM ingredients
  `).get();

  res.json({ ingredients, summary });
});

apiRouter.post('/inventory/ingredients', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { name, category, unit, current_stock, min_stock_level, cost_per_unit, supplier_id } = req.body;
  if (!name || !category || !unit) {
    return res.status(400).json({ error: 'Name, category, and unit are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO ingredients (name, category, unit, current_stock, min_stock_level, cost_per_unit, supplier_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, unit, current_stock || 0, min_stock_level || 5, cost_per_unit || 0, supplier_id || null);

    if (current_stock && current_stock > 0) {
      db.prepare(`
        INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, notes, created_by)
        VALUES (?, 'manual_adjustment', ?, 0, ?, 'manual', 'Initial stock entry', ?)
      `).run(result.lastInsertRowid, current_stock, current_stock, req.user?.name || 'Staff');
    }

    logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_INGREDIENT', 'ingredient', String(result.lastInsertRowid), `Created ingredient: ${name}`);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Ingredient created' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/inventory/ingredients/:id', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, unit, min_stock_level, cost_per_unit, supplier_id } = req.body;

  db.prepare(`
    UPDATE ingredients
    SET name = ?, category = ?, unit = ?, min_stock_level = ?, cost_per_unit = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, category, unit, min_stock_level, cost_per_unit, supplier_id || null, id);

  res.json({ message: 'Ingredient updated' });
});

// Manual Stock Adjustment / Wastage / Restock
apiRouter.post('/inventory/adjust', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { ingredient_id, adjustment_type, quantity, reason, notes } = req.body;
  // adjustment_type: 'add' (delivery/purchase), 'waste' (spoilage/dropped), 'set' (physical count correction)

  const ingredient = db.prepare('SELECT * FROM ingredients WHERE id = ?').get(ingredient_id) as any;
  if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });

  const numQty = parseFloat(quantity);
  if (isNaN(numQty) || numQty < 0) return res.status(400).json({ error: 'Valid positive quantity required' });

  let qtyBefore = ingredient.current_stock;
  let qtyAfter = qtyBefore;
  let qtyChange = 0;
  let movementType = 'manual_adjustment';

  if (adjustment_type === 'add') {
    qtyChange = numQty;
    qtyAfter = qtyBefore + numQty;
    movementType = 'purchase_received';
  } else if (adjustment_type === 'waste') {
    qtyChange = -numQty;
    qtyAfter = Math.max(0, qtyBefore - numQty);
    movementType = 'waste';
  } else if (adjustment_type === 'set') {
    qtyChange = numQty - qtyBefore;
    qtyAfter = numQty;
    movementType = 'manual_adjustment';
  }

  // Execute in transaction
  const adjustTx = db.transaction(() => {
    db.prepare('UPDATE ingredients SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qtyAfter, ingredient_id);
    db.prepare(`
      INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, notes, created_by)
      VALUES (?, ?, ?, ?, ?, 'manual', ?, ?)
    `).run(ingredient_id, movementType, qtyChange, qtyBefore, qtyAfter, notes ? `${reason || ''}: ${notes}` : reason || 'Manual stock adjustment', req.user?.name || 'Staff');
  });

  adjustTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'ADJUST_STOCK', 'ingredient', String(ingredient_id), `Adjusted ${ingredient.name} by ${qtyChange} ${ingredient.unit} to ${qtyAfter}`);

  res.json({
    message: 'Stock adjusted successfully',
    ingredient_id,
    current_stock: qtyAfter,
  });
});

apiRouter.get('/inventory/movements', (req: Request, res: Response) => {
  const { ingredient_id, movement_type, limit } = req.query;
  let query = `
    SELECT sm.*, i.name as ingredient_name, i.unit
    FROM stock_movements sm
    JOIN ingredients i ON sm.ingredient_id = i.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (ingredient_id) {
    query += ' AND sm.ingredient_id = ?';
    params.push(ingredient_id);
  }
  if (movement_type) {
    query += ' AND sm.movement_type = ?';
    params.push(movement_type);
  }

  query += ` ORDER BY sm.created_at DESC LIMIT ${parseInt(String(limit)) || 50}`;
  const movements = db.prepare(query).all(...params);
  res.json(movements);
});

// ==========================================
// 5. RECIPES & INGREDIENT MAPPING
// ==========================================

apiRouter.get('/recipes', (req: Request, res: Response) => {
  const recipes = db.prepare(`
    SELECT r.*, m.name as menu_item_name, m.price as menu_item_price, m.image_url, c.name as category_name
    FROM recipes r
    JOIN menu_items m ON r.menu_item_id = m.id
    JOIN menu_categories c ON m.category_id = c.id
    ORDER BY m.name ASC
  `).all() as any[];

  // Attach ingredients to each recipe
  for (const r of recipes) {
    r.ingredients = db.prepare(`
      SELECT ri.*, i.name as ingredient_name, i.cost_per_unit, i.current_stock, i.unit as base_unit,
        (ri.quantity_required * i.cost_per_unit) as cost_contribution
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ?
    `).all(r.id);

    // Calculate total recipe cost and margin
    const totalCost = r.ingredients.reduce((sum: number, ing: any) => sum + (ing.cost_contribution || 0), 0);
    r.total_cost = parseFloat(totalCost.toFixed(2));
    r.profit_margin_percent = r.menu_item_price > 0
      ? parseFloat((((r.menu_item_price - totalCost) / r.menu_item_price) * 100).toFixed(1))
      : 0;
  }

  res.json(recipes);
});

apiRouter.post('/recipes', authenticateToken, requireRole(['admin', 'manager', 'kitchen']), (req: Request, res: Response) => {
  const { menu_item_id, instructions, prep_notes, ingredients } = req.body;
  if (!menu_item_id || !ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({ error: 'Menu item ID and ingredients array are required' });
  }

  const recipeTx = db.transaction(() => {
    // Delete existing recipe for this menu item if any
    const existing = db.prepare('SELECT id FROM recipes WHERE menu_item_id = ?').get(menu_item_id) as any;
    let recipeId: number;

    if (existing) {
      recipeId = existing.id;
      db.prepare('UPDATE recipes SET instructions = ?, prep_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(instructions || '', prep_notes || '', recipeId);
      db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?').run(recipeId);
    } else {
      const result = db.prepare('INSERT INTO recipes (menu_item_id, instructions, prep_notes) VALUES (?, ?, ?)').run(menu_item_id, instructions || '', prep_notes || '');
      recipeId = Number(result.lastInsertRowid);
    }

    const insertRi = db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required, unit) VALUES (?, ?, ?, ?)');
    for (const ing of ingredients) {
      insertRi.run(recipeId, ing.ingredient_id, ing.quantity_required, ing.unit);
    }

    return recipeId;
  });

  try {
    const id = recipeTx();
    logAudit(req.user?.id || null, req.user?.name || null, 'SAVE_RECIPE', 'recipe', String(id), `Saved recipe for menu item ID ${menu_item_id}`);
    res.status(201).json({ id, message: 'Recipe saved successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SUPPLIERS & PURCHASE ORDERS
// ==========================================

apiRouter.get('/suppliers', (req: Request, res: Response) => {
  const suppliers = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM ingredients i WHERE i.supplier_id = s.id) as ingredients_supplied_count,
      (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id) as purchase_orders_count
    FROM suppliers s
    ORDER BY s.name ASC
  `).all();
  res.json(suppliers);
});

apiRouter.post('/suppliers', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { name, contact_person, email, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Supplier name is required' });

  const result = db.prepare(`
    INSERT INTO suppliers (name, contact_person, email, phone, address, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, contact_person, email, phone, address, notes);

  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.get('/purchase-orders', (req: Request, res: Response) => {
  const pos = db.prepare(`
    SELECT po.*, s.name as supplier_name, s.phone as supplier_phone, s.email as supplier_email,
      (SELECT COUNT(*) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id) as item_count
    FROM purchase_orders po
    JOIN suppliers s ON po.supplier_id = s.id
    ORDER BY po.created_at DESC
  `).all() as any[];

  for (const po of pos) {
    po.items = db.prepare(`
      SELECT poi.*, i.name as ingredient_name, i.unit
      FROM purchase_order_items poi
      JOIN ingredients i ON poi.ingredient_id = i.id
      WHERE poi.purchase_order_id = ?
    `).all(po.id);
  }

  res.json(pos);
});

apiRouter.post('/purchase-orders', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { supplier_id, notes, items } = req.body;
  if (!supplier_id || !items || !items.length) {
    return res.status(400).json({ error: 'Supplier and at least one item required' });
  }

  const count = (db.prepare('SELECT COUNT(*) as count FROM purchase_orders').get() as { count: number }).count;
  const poNumber = `PO-2026-${String(count + 1).padStart(3, '0')}`;

  const poTx = db.transaction(() => {
    let totalCost = 0;
    for (const item of items) {
      totalCost += (item.quantity * item.unit_cost);
    }

    const poRes = db.prepare(`
      INSERT INTO purchase_orders (po_number, supplier_id, status, total_cost, ordered_at, notes, created_by)
      VALUES (?, ?, 'ordered', ?, CURRENT_TIMESTAMP, ?, ?)
    `).run(poNumber, supplier_id, totalCost, notes || null, req.user?.name || 'Staff');

    const poId = Number(poRes.lastInsertRowid);
    const insertItem = db.prepare(`
      INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_cost, total_cost)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(poId, item.ingredient_id, item.quantity, item.unit_cost, item.quantity * item.unit_cost);
    }

    return { poId, poNumber, totalCost };
  });

  const result = poTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_PO', 'purchase_order', result.poNumber, `Created purchase order for $${result.totalCost}`);
  res.status(201).json(result);
});

// Receive Purchase Order (Increments ingredient stock atomically with movement log)
apiRouter.post('/purchase-orders/:id/receive', authenticateToken, requireRole(['admin', 'manager', 'inventory']), (req: Request, res: Response) => {
  const { id } = req.params;
  const po = db.prepare('SELECT * FROM purchase_orders WHERE id = ?').get(id) as any;
  if (!po) return res.status(404).json({ error: 'Purchase order not found' });
  if (po.status === 'received') return res.status(400).json({ error: 'This purchase order has already been received' });

  const items = db.prepare('SELECT * FROM purchase_order_items WHERE purchase_order_id = ?').all(id) as any[];

  const receiveTx = db.transaction(() => {
    for (const item of items) {
      const ing = db.prepare('SELECT current_stock, cost_per_unit FROM ingredients WHERE id = ?').get(item.ingredient_id) as any;
      if (ing) {
        const qtyBefore = ing.current_stock;
        const qtyAfter = qtyBefore + item.quantity;
        // Update stock and cost
        db.prepare('UPDATE ingredients SET current_stock = ?, cost_per_unit = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(qtyAfter, item.unit_cost, item.ingredient_id);

        db.prepare(`
          INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
          VALUES (?, 'purchase_received', ?, ?, ?, 'purchase_order', ?, ?, ?)
        `).run(item.ingredient_id, item.quantity, qtyBefore, qtyAfter, po.po_number, `Received from PO ${po.po_number}`, req.user?.name || 'Staff');
      }
    }

    db.prepare('UPDATE purchase_orders SET status = \'received\', received_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
  });

  receiveTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'RECEIVE_PO', 'purchase_order', po.po_number, `Received delivery for ${po.po_number}`);
  res.json({ message: 'Purchase order received and inventory updated successfully' });
});

// ==========================================
// 7. ORDER MANAGEMENT & INTEGRATION
// ==========================================

// Helper to deduct stock based on recipe
function deductStockForOrder(orderId: number, orderNumber: string, performedBy: string) {
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];

  for (const oi of orderItems) {
    const recipe = db.prepare('SELECT id FROM recipes WHERE menu_item_id = ?').get(oi.menu_item_id) as any;
    if (!recipe) continue;

    const recipeIngs = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ?').all(recipe.id) as any[];
    for (const ri of recipeIngs) {
      const totalNeeded = ri.quantity_required * oi.quantity;
      const ing = db.prepare('SELECT current_stock FROM ingredients WHERE id = ?').get(ri.ingredient_id) as any;
      if (ing) {
        const qtyBefore = ing.current_stock;
        const qtyAfter = Math.max(0, qtyBefore - totalNeeded);
        db.prepare('UPDATE ingredients SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qtyAfter, ri.ingredient_id);

        db.prepare(`
          INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
          VALUES (?, 'order_consumption', ?, ?, ?, 'order', ?, ?, ?)
        `).run(ri.ingredient_id, -totalNeeded, qtyBefore, qtyAfter, orderNumber, `Consumed for ${oi.quantity}x ${oi.item_name} in order ${orderNumber}`, performedBy);
      }
    }
  }

  db.prepare('UPDATE orders SET stock_deducted = 1 WHERE id = ?').run(orderId);
}

// Helper to restore stock if order is cancelled
function restoreStockForOrder(orderId: number, orderNumber: string, performedBy: string) {
  const orderItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as any[];

  for (const oi of orderItems) {
    const recipe = db.prepare('SELECT id FROM recipes WHERE menu_item_id = ?').get(oi.menu_item_id) as any;
    if (!recipe) continue;

    const recipeIngs = db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ?').all(recipe.id) as any[];
    for (const ri of recipeIngs) {
      const totalToRestore = ri.quantity_required * oi.quantity;
      const ing = db.prepare('SELECT current_stock FROM ingredients WHERE id = ?').get(ri.ingredient_id) as any;
      if (ing) {
        const qtyBefore = ing.current_stock;
        const qtyAfter = qtyBefore + totalToRestore;
        db.prepare('UPDATE ingredients SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(qtyAfter, ri.ingredient_id);

        db.prepare(`
          INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
          VALUES (?, 'order_cancellation_restore', ?, ?, ?, 'order', ?, ?, ?)
        `).run(ri.ingredient_id, totalToRestore, qtyBefore, qtyAfter, orderNumber, `Restored from cancelled order ${orderNumber}`, performedBy);
      }
    }
  }

  db.prepare('UPDATE orders SET stock_deducted = 0 WHERE id = ?').run(orderId);
}

// Get Orders with filters
apiRouter.get('/orders', (req: Request, res: Response) => {
  const { status, order_type, payment_status, search, start_date, end_date, limit } = req.query;

  let query = `
    SELECT o.*, t.table_number,
      i.invoice_number, i.payment_status, i.paid_amount,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN invoices i ON i.order_id = o.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' AND o.status = ?';
    params.push(status);
  }
  if (order_type && order_type !== 'all') {
    query += ' AND o.order_type = ?';
    params.push(order_type);
  }
  if (payment_status && payment_status !== 'all') {
    query += ' AND i.payment_status = ?';
    params.push(payment_status);
  }
  if (search) {
    query += ' AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR t.table_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (start_date) {
    query += ' AND DATE(o.created_at) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND DATE(o.created_at) <= DATE(?)';
    params.push(end_date);
  }

  query += ` ORDER BY o.created_at DESC LIMIT ${parseInt(String(limit)) || 100}`;
  const orders = db.prepare(query).all(...params) as any[];

  // Attach order items
  for (const o of orders) {
    o.items = db.prepare(`
      SELECT oi.*, m.image_url
      FROM order_items oi
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `).all(o.id);
  }

  // Summary counts for filter tabs
  const counts = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
      SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
    FROM orders
  `).get();

  res.json({ orders, counts });
});

// Single Order Detail
apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const order = db.prepare(`
    SELECT o.*, t.table_number, t.floor as table_floor
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.id = ?
  `).get(id) as any;

  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.items = db.prepare(`
    SELECT oi.*, m.image_url, m.prep_time_minutes
    FROM order_items oi
    LEFT JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = ?
  `).all(id);

  order.invoice = db.prepare('SELECT * FROM invoices WHERE order_id = ?').get(id);
  if (order.invoice) {
    order.payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at DESC').all(order.invoice.id);
  }

  res.json(order);
});

// Create Order (POS / Staff / Guest)
apiRouter.post('/orders', authenticateToken, (req: Request, res: Response) => {
  const {
    order_type,
    table_id,
    customer_name,
    customer_phone,
    delivery_address,
    special_instructions,
    discount_type,
    discount_value,
    items,
    auto_confirm
  } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const settings = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get() as any;
  const taxRate = settings.tax_rate_percent || 8.5;
  const serviceChargeRate = order_type === 'dine_in' ? (settings.service_charge_percent || 5.0) : 0;

  // Generate unique order number: ORD-XXXX
  const todayCount = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;
  const orderNumber = `ORD-${1000 + todayCount + 1}`;

  const createOrderTx = db.transaction(() => {
    // 1. Calculate subtotal
    let subtotal = 0;
    const resolvedItems: any[] = [];

    for (const item of items) {
      const menuItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.menu_item_id) as any;
      if (!menuItem) throw new Error(`Menu item ID ${item.menu_item_id} not found`);
      const qty = parseInt(item.quantity) || 1;
      const itemSubtotal = menuItem.price * qty;
      subtotal += itemSubtotal;

      resolvedItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        unit_price: menuItem.price,
        quantity: qty,
        subtotal: itemSubtotal,
        special_requests: item.special_requests || null
      });
    }

    // 2. Calculate discounts
    let discountAmount = 0;
    if (discount_value && discount_value > 0) {
      if (discount_type === 'percentage') {
        discountAmount = (subtotal * Math.min(100, discount_value)) / 100;
      } else {
        discountAmount = Math.min(subtotal, discount_value);
      }
    }
    const afterDiscount = Math.max(0, subtotal - discountAmount);

    // 3. Calculate taxes and service charges
    const taxAmount = (afterDiscount * taxRate) / 100;
    const serviceCharge = (afterDiscount * serviceChargeRate) / 100;
    const finalAmount = parseFloat((afterDiscount + taxAmount + serviceCharge).toFixed(2));

    const initialStatus = auto_confirm ? 'confirmed' : 'pending';

    // 4. Insert order
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_number, order_type, table_id, customer_name, customer_phone,
        delivery_address, status, subtotal, discount_type, discount_value,
        discount_amount, tax_amount, service_charge, final_amount,
        special_instructions, stock_deducted, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      orderNumber,
      order_type || 'dine_in',
      table_id || null,
      customer_name || 'Walk-in Guest',
      customer_phone || null,
      delivery_address || null,
      initialStatus,
      parseFloat(subtotal.toFixed(2)),
      discount_type || 'percentage',
      discount_value || 0,
      parseFloat(discountAmount.toFixed(2)),
      parseFloat(taxAmount.toFixed(2)),
      parseFloat(serviceCharge.toFixed(2)),
      finalAmount,
      special_instructions || null,
      req.user?.name || 'Staff'
    );

    const orderId = Number(orderResult.lastInsertRowid);

    // 5. Insert order items
    const insertOi = db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const ri of resolvedItems) {
      insertOi.run(orderId, ri.menu_item_id, ri.item_name, ri.unit_price, ri.quantity, ri.subtotal, ri.special_requests);
    }

    // 6. Update table status if dine_in
    if (order_type === 'dine_in' && table_id) {
      db.prepare(`
        UPDATE tables SET status = 'occupied', current_order_id = ? WHERE id = ?
      `).run(orderId, table_id);
    }

    // 7. Auto-generate corresponding Invoice
    const invoiceNumber = `INV-2026-${orderNumber.replace('ORD-', '')}`;
    db.prepare(`
      INSERT INTO invoices (
        invoice_number, order_id, subtotal, discount_amount,
        tax_amount, service_charge, total_amount, paid_amount, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'unpaid')
    `).run(
      invoiceNumber,
      orderId,
      parseFloat(subtotal.toFixed(2)),
      parseFloat(discountAmount.toFixed(2)),
      parseFloat(taxAmount.toFixed(2)),
      parseFloat(serviceCharge.toFixed(2)),
      finalAmount
    );

    // 8. If auto_confirmed, deduct recipe ingredients immediately
    if (auto_confirm) {
      deductStockForOrder(orderId, orderNumber, req.user?.name || 'Staff');
    }

    return { orderId, orderNumber, finalAmount, invoiceNumber };
  });

  try {
    const resData = createOrderTx();
    logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_ORDER', 'order', resData.orderNumber, `Placed ${order_type} order ${resData.orderNumber} for $${resData.finalAmount}`);
    res.status(201).json(resData);
  } catch (err: any) {
    console.error('Create order error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update Order Status (Pending -> Confirmed -> Preparing -> Ready -> Completed -> Cancelled)
apiRouter.patch('/orders/:id/status', authenticateToken, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const statusTx = db.transaction(() => {
    // 1. Recipe stock deduction on 'confirmed' or 'preparing' if not already deducted
    if ((status === 'confirmed' || status === 'preparing') && order.stock_deducted === 0) {
      deductStockForOrder(order.id, order.order_number, req.user?.name || 'Staff');
    }

    // 2. If cancelled and stock was deducted, restore stock
    if (status === 'cancelled' && order.stock_deducted === 1) {
      restoreStockForOrder(order.id, order.order_number, req.user?.name || 'Staff');
    }

    // 3. If completed or cancelled, free table if dine_in
    if ((status === 'completed' || status === 'cancelled') && order.table_id) {
      db.prepare(`
        UPDATE tables SET status = 'available', current_order_id = NULL WHERE id = ?
      `).run(order.table_id);
    }

    // 4. Update order status
    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  });

  statusTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'ORDER_STATUS_UPDATE', 'order', order.order_number, `Changed order ${order.order_number} status from ${order.status} to ${status}`);

  res.json({ message: `Order status updated to ${status}`, status });
});

// ==========================================
// 8. KITCHEN DISPLAY SYSTEM (KDS)
// ==========================================

apiRouter.get('/kitchen/orders', (req: Request, res: Response) => {
  const orders = db.prepare(`
    SELECT o.*, t.table_number,
      CAST((julianday('now') - julianday(o.created_at)) * 24 * 60 AS INTEGER) as elapsed_minutes
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE o.status IN ('confirmed', 'preparing', 'ready')
    ORDER BY
      CASE o.status
        WHEN 'preparing' THEN 1
        WHEN 'confirmed' THEN 2
        WHEN 'ready' THEN 3
      END ASC,
      o.created_at ASC
  `).all() as any[];

  for (const o of orders) {
    o.items = db.prepare(`
      SELECT oi.*, m.prep_time_minutes
      FROM order_items oi
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE oi.order_id = ?
    `).all(o.id);

    // Flag as delayed if elapsed > 15 mins and not yet ready
    o.is_delayed = o.elapsed_minutes > 15 && o.status !== 'ready';
  }

  res.json(orders);
});

// ==========================================
// 9. BILLING, PAYMENTS & REFUNDS
// ==========================================

apiRouter.get('/billing/invoices', (req: Request, res: Response) => {
  const { payment_status, search, start_date, end_date } = req.query;

  let query = `
    SELECT i.*, o.order_number, o.order_type, o.customer_name, o.customer_phone, t.table_number,
      (i.total_amount - i.paid_amount) as balance_due
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (payment_status && payment_status !== 'all') {
    query += ' AND i.payment_status = ?';
    params.push(payment_status);
  }
  if (search) {
    query += ' AND (i.invoice_number LIKE ? OR o.order_number LIKE ? OR o.customer_name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (start_date) {
    query += ' AND DATE(i.invoice_date) >= DATE(?)';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND DATE(i.invoice_date) <= DATE(?)';
    params.push(end_date);
  }

  query += ' ORDER BY i.created_at DESC';
  const invoices = db.prepare(query).all(...params);
  res.json(invoices);
});

apiRouter.get('/billing/invoices/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const invoice = db.prepare(`
    SELECT i.*, o.order_number, o.order_type, o.customer_name, o.customer_phone, o.delivery_address, o.special_instructions, t.table_number
    FROM invoices i
    JOIN orders o ON i.order_id = o.id
    LEFT JOIN tables t ON o.table_id = t.id
    WHERE i.id = ?
  `).get(id) as any;

  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  invoice.items = db.prepare(`
    SELECT oi.*, m.name as item_name
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    WHERE oi.order_id = ?
  `).all(invoice.order_id);

  invoice.payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY created_at ASC').all(invoice.id);
  invoice.refunds = db.prepare('SELECT * FROM refunds WHERE invoice_id = ? ORDER BY created_at ASC').all(invoice.id);
  invoice.settings = db.prepare('SELECT * FROM restaurant_settings WHERE id = 1').get();

  res.json(invoice);
});

// Record Payment (Full or Split / Partial Payment)
apiRouter.post('/billing/payments', authenticateToken, requireRole(['admin', 'manager', 'cashier']), (req: Request, res: Response) => {
  const { invoice_id, amount, payment_method, transaction_reference, notes } = req.body;

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id) as any;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const payAmount = parseFloat(amount);
  if (isNaN(payAmount) || payAmount <= 0) {
    return res.status(400).json({ error: 'Valid payment amount is required' });
  }

  const remaining = parseFloat((invoice.total_amount - invoice.paid_amount).toFixed(2));
  if (remaining <= 0) {
    return res.status(400).json({ error: 'This invoice is already fully settled' });
  }

  const paymentTx = db.transaction(() => {
    // 1. Record payment
    const paymentResult = db.prepare(`
      INSERT INTO payments (invoice_id, order_id, amount, payment_method, transaction_reference, status, notes, processed_by)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)
    `).run(invoice_id, invoice.order_id, payAmount, payment_method || 'cash', transaction_reference || null, notes || null, req.user?.name || 'Cashier');

    // 2. Update invoice paid amount & status
    const newPaid = parseFloat((invoice.paid_amount + payAmount).toFixed(2));
    const newStatus = newPaid >= invoice.total_amount ? 'paid' : 'partially_paid';

    db.prepare(`
      UPDATE invoices SET paid_amount = ?, payment_status = ? WHERE id = ?
    `).run(newPaid, newStatus, invoice_id);

    return { paymentId: paymentResult.lastInsertRowid, newPaid, newStatus };
  });

  const result = paymentTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'RECORD_PAYMENT', 'invoice', invoice.invoice_number, `Recorded payment of $${payAmount} via ${payment_method}`);

  res.json({
    message: 'Payment recorded successfully',
    payment_id: result.paymentId,
    paid_amount: result.newPaid,
    payment_status: result.newStatus,
  });
});

// Process Refund
apiRouter.post('/billing/refunds', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { payment_id, amount, reason } = req.body;
  if (!payment_id || !amount || !reason) {
    return res.status(400).json({ error: 'Payment ID, amount, and reason are required' });
  }

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id) as any;
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(payment.invoice_id) as any;
  const refundAmount = parseFloat(amount);

  if (refundAmount > payment.amount) {
    return res.status(400).json({ error: 'Refund amount cannot exceed payment amount' });
  }

  const refundTx = db.transaction(() => {
    db.prepare(`
      INSERT INTO refunds (payment_id, invoice_id, amount, reason, processed_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(payment_id, invoice.id, refundAmount, reason, req.user?.name || 'Manager');

    db.prepare('UPDATE payments SET status = \'refunded\' WHERE id = ?').run(payment_id);

    const newPaid = Math.max(0, parseFloat((invoice.paid_amount - refundAmount).toFixed(2)));
    const newStatus = newPaid === 0 ? 'refunded' : 'partially_paid';
    db.prepare('UPDATE invoices SET paid_amount = ?, payment_status = ? WHERE id = ?').run(newPaid, newStatus, invoice.id);
  });

  refundTx();
  logAudit(req.user?.id || null, req.user?.name || null, 'PROCESS_REFUND', 'payment', String(payment_id), `Refunded $${refundAmount} for invoice ${invoice.invoice_number}. Reason: ${reason}`);

  res.json({ message: 'Refund processed successfully' });
});

// ==========================================
// 10. EXPENSES & FINANCIAL REPORTS
// ==========================================

apiRouter.get('/expenses', (req: Request, res: Response) => {
  const { category, start_date, end_date } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params: any[] = [];

  if (category && category !== 'all') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (start_date) {
    query += ' AND expense_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    query += ' AND expense_date <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY expense_date DESC';
  const expenses = db.prepare(query).all(...params);
  res.json(expenses);
});

apiRouter.post('/expenses', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { category, title, amount, expense_date, payment_method, notes } = req.body;
  if (!category || !title || !amount || !expense_date) {
    return res.status(400).json({ error: 'Category, title, amount, and date are required' });
  }

  const result = db.prepare(`
    INSERT INTO expenses (category, title, amount, expense_date, payment_method, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(category, title, parseFloat(amount), expense_date, payment_method || 'bank_transfer', notes || null, req.user?.name || 'Staff');

  logAudit(req.user?.id || null, req.user?.name || null, 'CREATE_EXPENSE', 'expense', String(result.lastInsertRowid), `Logged expense: ${title} ($${amount})`);
  res.status(201).json({ id: result.lastInsertRowid });
});

apiRouter.delete('/expenses/:id', authenticateToken, requireRole(['admin', 'manager']), (req: Request, res: Response) => {
  const { id } = req.params;
  db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  res.json({ message: 'Expense deleted' });
});

// Financial Analytics & Profit Report
apiRouter.get('/reports/financial', (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  let dateFilter = '';
  const params: any[] = [];
  if (start_date && end_date) {
    dateFilter = 'WHERE DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)';
    params.push(start_date, end_date);
  } else {
    // Default last 30 days
    dateFilter = "WHERE created_at >= datetime('now', '-30 days')";
  }

  // 1. Sales Breakdown
  const salesStats = db.prepare(`
    SELECT
      COALESCE(SUM(subtotal), 0) as gross_sales,
      COALESCE(SUM(discount_amount), 0) as total_discounts,
      COALESCE(SUM(tax_amount), 0) as total_taxes,
      COALESCE(SUM(service_charge), 0) as total_service_charges,
      COALESCE(SUM(final_amount), 0) as net_sales,
      COUNT(*) as total_orders
    FROM orders
    ${dateFilter} AND status != 'cancelled'
  `).get(...params) as any;

  // 2. Refunds
  let refundQuery = 'SELECT COALESCE(SUM(amount), 0) as total_refunds FROM refunds';
  const refundParams: any[] = [];
  if (start_date && end_date) {
    refundQuery += ' WHERE DATE(created_at) >= DATE(?) AND DATE(created_at) <= DATE(?)';
    refundParams.push(start_date, end_date);
  }
  const refundsTotal = (db.prepare(refundQuery).get(...refundParams) as any).total_refunds || 0;

  // 3. Operating Expenses
  let expQuery = 'SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses';
  const expParams: any[] = [];
  if (start_date && end_date) {
    expQuery += ' WHERE expense_date >= ? AND expense_date <= ?';
    expParams.push(start_date, end_date);
  } else {
    expQuery += " WHERE expense_date >= date('now', '-30 days')";
  }
  const expensesTotal = (db.prepare(expQuery).get(...expParams) as any).total_expenses || 0;

  // 4. Ingredient Cost (COGS) estimation from sold order items
  const cogsQuery = `
    SELECT COALESCE(SUM(oi.quantity * m.cost_price), 0) as estimated_cogs
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN menu_items m ON oi.menu_item_id = m.id
    ${dateFilter} AND o.status != 'cancelled'
  `;
  const estimatedCogs = (db.prepare(cogsQuery).get(...params) as any).estimated_cogs || 0;

  // Estimated Profit = (Net Sales - Refunds) - (COGS + Operating Expenses)
  const actualRevenue = salesStats.net_sales - refundsTotal;
  const estimatedNetProfit = actualRevenue - (estimatedCogs + expensesTotal);

  // Daily Trend Breakdown
  let trendQuery = `
    SELECT DATE(created_at) as date,
      COALESCE(SUM(final_amount), 0) as revenue,
      COUNT(*) as orders_count
    FROM orders
    ${dateFilter} AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;
  const dailyTrends = db.prepare(trendQuery).all(...params);

  res.json({
    gross_sales: parseFloat(salesStats.gross_sales.toFixed(2)),
    total_discounts: parseFloat(salesStats.total_discounts.toFixed(2)),
    total_taxes: parseFloat(salesStats.total_taxes.toFixed(2)),
    total_service_charges: parseFloat(salesStats.total_service_charges.toFixed(2)),
    net_sales: parseFloat(salesStats.net_sales.toFixed(2)),
    total_orders: salesStats.total_orders,
    total_refunds: parseFloat(refundsTotal.toFixed(2)),
    actual_revenue: parseFloat(actualRevenue.toFixed(2)),
    estimated_cogs: parseFloat(estimatedCogs.toFixed(2)),
    operating_expenses: parseFloat(expensesTotal.toFixed(2)),
    estimated_profit: parseFloat(estimatedNetProfit.toFixed(2)),
    daily_trends: dailyTrends,
  });
});

// ==========================================
// 11. DASHBOARD SUMMARY
// ==========================================

apiRouter.get('/dashboard/summary', (req: Request, res: Response) => {
  // Today's metrics
  const todayMetrics = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN DATE(created_at) = DATE('now') AND status != 'cancelled' THEN final_amount ELSE 0 END), 0) as today_revenue,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_orders,
      COUNT(CASE WHEN status IN ('pending', 'confirmed') THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders
    FROM orders
  `).get() as any;

  // Inventory Alerts
  const inventoryAlerts = db.prepare(`
    SELECT COUNT(*) as low_stock_count
    FROM ingredients
    WHERE current_stock <= min_stock_level
  `).get() as any;

  // Top Selling Menu Items
  const topItems = db.prepare(`
    SELECT m.name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN menu_items m ON oi.menu_item_id = m.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status != 'cancelled'
    GROUP BY m.id
    ORDER BY total_sold DESC
    LIMIT 5
  `).all();

  // Sales Trend (Past 7 Days)
  const salesTrend = db.prepare(`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(final_amount), 0) as revenue,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= datetime('now', '-7 days') AND status != 'cancelled'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `).all();

  // Payment Methods Breakdown
  const paymentMethods = db.prepare(`
    SELECT payment_method, COUNT(*) as count, SUM(amount) as total
    FROM payments
    WHERE status = 'completed'
    GROUP BY payment_method
  `).all();

  // Recent Orders (5 latest)
  const recentOrders = db.prepare(`
    SELECT o.id, o.order_number, o.customer_name, o.order_type, o.status, o.final_amount, o.created_at, t.table_number
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY o.created_at DESC
    LIMIT 6
  `).all();

  // Low stock list
  const lowStockItems = db.prepare(`
    SELECT id, name, category, current_stock, min_stock_level, unit
    FROM ingredients
    WHERE current_stock <= min_stock_level
    ORDER BY (current_stock / min_stock_level) ASC
    LIMIT 6
  `).all();

  res.json({
    metrics: {
      today_revenue: parseFloat(todayMetrics.today_revenue.toFixed(2)),
      today_orders: todayMetrics.today_orders,
      pending_orders: todayMetrics.pending_orders,
      preparing_orders: todayMetrics.preparing_orders,
      low_stock_count: inventoryAlerts.low_stock_count,
    },
    top_items: topItems,
    sales_trend: salesTrend,
    payment_methods: paymentMethods,
    recent_orders: recentOrders,
    low_stock_items: lowStockItems,
  });
});

// Audit logs
apiRouter.get('/audit-logs', authenticateToken, requireRole(['admin']), (req: Request, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});
