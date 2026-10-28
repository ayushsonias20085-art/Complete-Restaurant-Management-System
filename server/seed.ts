import bcrypt from 'bcryptjs';
import { db } from './db.ts';

export function seedDatabase() {
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  if (userCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial restaurant management system data...');

  const hashPassword = (pw: string) => bcrypt.hashSync(pw, 10);

  // 1. Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  insertUser.run('Alex Rivera (Owner)', 'admin@savoria.com', hashPassword('admin123'), 'admin', '+1 (555) 101-2001');
  insertUser.run('Elena Rostova (Floor Mgr)', 'manager@savoria.com', hashPassword('manager123'), 'manager', '+1 (555) 101-2002');
  insertUser.run('David Chen (Head Cashier)', 'cashier@savoria.com', hashPassword('cashier123'), 'cashier', '+1 (555) 101-2003');
  insertUser.run('Chef Marco Rossi (Head Chef)', 'kitchen@savoria.com', hashPassword('kitchen123'), 'kitchen', '+1 (555) 101-2004');
  insertUser.run('Sarah Miller (Stock Lead)', 'inventory@savoria.com', hashPassword('inventory123'), 'inventory', '+1 (555) 101-2005');

  // 2. Restaurant Settings
  db.prepare(`
    INSERT OR REPLACE INTO restaurant_settings (id, name, tagline, address, phone, email, currency_symbol, tax_rate_percent, service_charge_percent, receipt_footer, low_stock_threshold_default)
    VALUES (1, 'Savoria Bistro & Wine Bar', 'Artisanal Woodfire & Seasonal Dining', '452 Grand Avenue, Suite 100, Metro City', '+1 (555) 789-2345', 'info@savoria-bistro.com', '$', 8.5, 5.0, 'Thank you for dining at Savoria Bistro! We look forward to serving you again.', 10)
  `).run();

  // 3. Tables
  const insertTable = db.prepare(`
    INSERT INTO tables (table_number, capacity, floor, status)
    VALUES (?, ?, ?, ?)
  `);

  insertTable.run('T-01', 2, 'Main Dining', 'available');
  insertTable.run('T-02', 4, 'Main Dining', 'occupied');
  insertTable.run('T-03', 4, 'Main Dining', 'available');
  insertTable.run('T-04', 6, 'Main Dining', 'reserved');
  insertTable.run('T-05', 2, 'Terrace Patio', 'available');
  insertTable.run('T-06', 4, 'Terrace Patio', 'occupied');
  insertTable.run('T-07', 4, 'Terrace Patio', 'available');
  insertTable.run('T-08', 8, 'Private Booths', 'available');
  insertTable.run('T-09', 6, 'Private Booths', 'available');
  insertTable.run('T-10', 2, 'Window Bar', 'available');

  // 4. Categories
  const insertCategory = db.prepare(`
    INSERT INTO menu_categories (name, description, display_order, icon)
    VALUES (?, ?, ?, ?)
  `);

  const catStarters = insertCategory.run('Starters & Small Plates', 'Appetizers, bruschetta, soups and artisanal starters', 1, 'Salad').lastInsertRowid;
  const catMains = insertCategory.run('Woodfired & Chef Mains', 'Handcrafted steaks, fresh pastas, seafood, and artisanal pizza', 2, 'UtensilsCrossed').lastInsertRowid;
  const catDesserts = insertCategory.run('Artisanal Desserts', 'Pastry chef specialities, gelato, and sweet pairings', 3, 'Cake').lastInsertRowid;
  const catBeverages = insertCategory.run('Beverages & Cocktails', 'Specialty espresso, mocktails, curated wines, and craft brews', 4, 'Coffee').lastInsertRowid;

  // 5. Menu Items
  const insertMenuItem = db.prepare(`
    INSERT INTO menu_items (category_id, name, description, price, cost_price, image_url, is_available, tax_category, prep_time_minutes)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'standard', ?)
  `);

  const itemBruschetta = insertMenuItem.run(
    catStarters,
    'Tuscan Truffle Bruschetta',
    'Toasted sourdough, heirloom cherry tomatoes, buffalo mozzarella, white truffle oil & aged balsamic glaze',
    14.50,
    4.20,
    'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=600&q=80',
    10
  ).lastInsertRowid;

  const itemCalamari = insertMenuItem.run(
    catStarters,
    'Crispy Spiced Calamari',
    'Tender squid rings, smoked paprika dredge, Meyer lemon aioli & charred lime',
    16.00,
    5.50,
    'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    12
  ).lastInsertRowid;

  const itemBurrata = insertMenuItem.run(
    catStarters,
    'Pugliese Burrata Salad',
    'Whole cream-filled burrata, wild arugula, mission figs, crushed pistachios & herb emulsion',
    17.00,
    6.00,
    'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=600&q=80',
    8
  ).lastInsertRowid;

  const itemBurger = insertMenuItem.run(
    catMains,
    'Prime Wagyu Truffle Burger',
    'Dry-aged wagyu beef patty, black truffle aioli, aged sharp cheddar, caramelized shallots on brioche with rosemary parmesan fries',
    24.00,
    8.50,
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    15
  ).lastInsertRowid;

  const itemCarbonara = insertMenuItem.run(
    catMains,
    'Classic Roman Carbonara',
    'Bronze-cut bucatini, crispy cured guanciale, pasture egg yolks, pecorino romano & toasted Tellicherry black pepper',
    22.50,
    6.00,
    'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=600&q=80',
    14
  ).lastInsertRowid;

  const itemSalmon = insertMenuItem.run(
    catMains,
    'Pan-Seared King Salmon',
    'Wild Alaskan salmon, creamy saffron arborio risotto, blistered asparagus spears & lemon dill emulsion',
    28.50,
    11.00,
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
    18
  ).lastInsertRowid;

  const itemRibeye = insertMenuItem.run(
    catMains,
    'USDA Prime Bone-In Ribeye (14oz)',
    'Charbroiled herb-basted ribeye, roasted garlic bone marrow butter, potato puree & glazed rainbow carrots',
    39.00,
    16.00,
    'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=600&q=80',
    20
  ).lastInsertRowid;

  const itemPizza = insertMenuItem.run(
    catMains,
    'Woodfired Margherita DOC',
    'San Marzano tomato coulis, fior di latte mozzarella, fresh sweet basil & extra virgin olive oil',
    19.00,
    4.50,
    'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=600&q=80',
    12
  ).lastInsertRowid;

  const itemTiramisu = insertMenuItem.run(
    catDesserts,
    'Espresso Mascarpone Tiramisu',
    'House-baked ladyfingers soaked in dark roast espresso & Kahlua, layered with whipped Venetian mascarpone & Valrhona cacao',
    11.50,
    3.00,
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
    5
  ).lastInsertRowid;

  const itemLavaCake = insertMenuItem.run(
    catDesserts,
    'Belgian Molten Chocolate Lava',
    'Warm rich dark chocolate fondant, salted bourbon caramel drizzle & Tahitian vanilla bean gelato',
    12.50,
    3.50,
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    10
  ).lastInsertRowid;

  const itemMocktail = insertMenuItem.run(
    catBeverages,
    'Smoked Rosemary Grapefruit Fizz',
    'Fresh ruby red grapefruit juice, torched rosemary, botanical soda & agave nectar',
    8.50,
    1.80,
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    4
  ).lastInsertRowid;

  const itemEspresso = insertMenuItem.run(
    catBeverages,
    'Single Origin Double Espresso',
    'Ethiopian Yirgacheffe espresso with notes of jasmine, bergamot and honey',
    4.50,
    0.80,
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    3
  ).lastInsertRowid;

  // 6. Suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (name, contact_person, email, phone, address, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const suppPrime = insertSupplier.run(
    'Prime Heritage Meats & Seafood',
    'Marcus Vance',
    'orders@primeheritagemeats.com',
    '+1 (555) 440-1122',
    '880 Packing District Way, Metro City',
    'Delivers fresh aged beef, wagyu cuts, and wild salmon daily before 8:00 AM'
  ).lastInsertRowid;

  const suppProduce = insertSupplier.run(
    'Valley Green Organic Farms',
    'Clara Higgins',
    'clara@valleygreenorganic.com',
    '+1 (555) 440-3344',
    '120 Valley Farm Road, Napa County',
    'Organic herbs, heirloom tomatoes, wild mushrooms, and seasonal greens'
  ).lastInsertRowid;

  const suppDairy = insertSupplier.run(
    'Bella Italia Artisan Imports',
    'Gianni Moretti',
    'gianni@bellaitaliaimports.com',
    '+1 (555) 440-5566',
    '310 Harbor Boulevard, Dock 14',
    'Authentic imported burrata, parmigiano reggiano, pecorino, and olive oils'
  ).lastInsertRowid;

  const suppBakery = insertSupplier.run(
    'Golden Hearth Artisan Bakery',
    'Thomas Wright',
    'sales@goldenhearth.com',
    '+1 (555) 440-7788',
    '24 Baker Street, Metro City',
    'Fresh brioche buns, sourdough loaves, and ladyfinger pastries'
  ).lastInsertRowid;

  // 7. Ingredients
  const insertIngredient = db.prepare(`
    INSERT INTO ingredients (name, category, unit, current_stock, min_stock_level, cost_per_unit, supplier_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const ingWagyu = insertIngredient.run('Wagyu Ground Beef', 'Meat', 'kg', 24.5, 8.0, 22.00, suppPrime).lastInsertRowid;
  const ingSalmon = insertIngredient.run('Fresh King Salmon Fillet', 'Seafood', 'kg', 14.0, 5.0, 28.00, suppPrime).lastInsertRowid;
  const ingRibeye = insertIngredient.run('Prime Bone-In Ribeye Steaks', 'Meat', 'pcs', 18, 6, 16.50, suppPrime).lastInsertRowid;
  const ingGuanciale = insertIngredient.run('Cured Italian Guanciale', 'Meat', 'kg', 8.2, 3.0, 19.00, suppDairy).lastInsertRowid;
  const ingBrioche = insertIngredient.run('Brioche Burger Buns', 'Bakery', 'pcs', 45, 20, 1.20, suppBakery).lastInsertRowid;
  const ingSourdough = insertIngredient.run('Artisan Sourdough Batard', 'Bakery', 'pcs', 22, 10, 2.50, suppBakery).lastInsertRowid;
  const ingMozzarella = insertIngredient.run('Fior di Latte Mozzarella', 'Dairy', 'kg', 16.0, 6.0, 9.50, suppDairy).lastInsertRowid;
  const ingBurrata = insertIngredient.run('Pugliese Burrata Balls', 'Dairy', 'pcs', 19, 8, 3.80, suppDairy).lastInsertRowid;
  const ingParmesan = insertIngredient.run('Parmigiano Reggiano 24-Mo', 'Dairy', 'kg', 9.5, 4.0, 24.00, suppDairy).lastInsertRowid;
  const ingPecorino = insertIngredient.run('Pecorino Romano DOP', 'Dairy', 'kg', 7.0, 3.0, 21.00, suppDairy).lastInsertRowid;
  const ingTruffleOil = insertIngredient.run('White Truffle Oil Infusion', 'Condiments', 'l', 3.5, 1.5, 45.00, suppDairy).lastInsertRowid;
  const ingTomatoes = insertIngredient.run('Heirloom Cherry Tomatoes', 'Produce', 'kg', 18.0, 5.0, 4.50, suppProduce).lastInsertRowid;
  const ingSanMarzano = insertIngredient.run('San Marzano D.O.P. Tomatoes', 'Pantry', 'kg', 35.0, 10.0, 3.80, suppDairy).lastInsertRowid;
  const ingAsparagus = insertIngredient.run('Fresh Green Asparagus', 'Produce', 'kg', 6.2, 4.0, 6.00, suppProduce).lastInsertRowid;
  const ingArborio = insertIngredient.run('Arborio Risotto Rice', 'Grains', 'kg', 25.0, 8.0, 4.20, suppDairy).lastInsertRowid;
  const ingPasta = insertIngredient.run('Bronze-Cut Bucatini Pasta', 'Dry Goods', 'kg', 20.0, 6.0, 3.50, suppDairy).lastInsertRowid;
  const ingEggs = insertIngredient.run('Farm Fresh Pasture Eggs', 'Dairy', 'pcs', 180, 50, 0.35, suppProduce).lastInsertRowid;
  const ingMascarpone = insertIngredient.run('Venetian Mascarpone Cheese', 'Dairy', 'kg', 8.0, 3.0, 11.50, suppDairy).lastInsertRowid;
  const ingEspressoBeans = insertIngredient.run('Ethiopian Espresso Beans', 'Beverage', 'kg', 12.0, 4.0, 18.00, suppProduce).lastInsertRowid;
  const ingChocolate = insertIngredient.run('Valrhona 70% Dark Chocolate', 'Baking', 'kg', 11.0, 4.0, 26.00, suppDairy).lastInsertRowid;
  const ingCalamari = insertIngredient.run('Fresh Squid Tubes', 'Seafood', 'kg', 4.5, 5.0, 14.00, suppPrime).lastInsertRowid; // Low stock alert!
  const ingGrapefruit = insertIngredient.run('Ruby Red Grapefruits', 'Produce', 'kg', 3.0, 5.0, 3.20, suppProduce).lastInsertRowid; // Low stock alert!

  // 8. Recipes and Recipe Ingredients
  const insertRecipe = db.prepare(`
    INSERT INTO recipes (menu_item_id, instructions, prep_notes)
    VALUES (?, ?, ?)
  `);

  const insertRecipeIng = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_required, unit)
    VALUES (?, ?, ?, ?)
  `);

  // Burger Recipe
  const recBurger = insertRecipe.run(itemBurger, 'Grill wagyu patty 3 mins per side to medium. Toast bun with butter. Layer truffle aioli, cheddar, patty, and shallots.', 'Cook temp medium unless guest specifies').lastInsertRowid;
  insertRecipeIng.run(recBurger, ingWagyu, 0.22, 'kg'); // 220g wagyu
  insertRecipeIng.run(recBurger, ingBrioche, 1, 'pcs');
  insertRecipeIng.run(recBurger, ingTruffleOil, 0.015, 'l');
  insertRecipeIng.run(recBurger, ingParmesan, 0.03, 'kg');

  // Carbonara Recipe
  const recCarbonara = insertRecipe.run(itemCarbonara, 'Crisp guanciale in pan. Whisk 2 egg yolks with pecorino and black pepper. Toss al dente bucatini off heat with egg mix to form creamy glossy emulsion.', 'Never add cream to real carbonara').lastInsertRowid;
  insertRecipeIng.run(recCarbonara, ingPasta, 0.15, 'kg');
  insertRecipeIng.run(recCarbonara, ingGuanciale, 0.08, 'kg');
  insertRecipeIng.run(recCarbonara, ingEggs, 2, 'pcs');
  insertRecipeIng.run(recCarbonara, ingPecorino, 0.04, 'kg');

  // Salmon Recipe
  const recSalmon = insertRecipe.run(itemSalmon, 'Crisp skin on salmon in cast iron 4 min, flip 2 min. Serve over creamy saffron risotto with grilled asparagus.', 'Check skin is ultra crisp').lastInsertRowid;
  insertRecipeIng.run(recSalmon, ingSalmon, 0.20, 'kg');
  insertRecipeIng.run(recSalmon, ingArborio, 0.08, 'kg');
  insertRecipeIng.run(recSalmon, ingAsparagus, 0.10, 'kg');

  // Pizza Recipe
  const recPizza = insertRecipe.run(itemPizza, 'Stretch dough ball, spread San Marzano sauce, scatter fresh fior di latte and torn basil. Bake in 850°F oven for 90 seconds.', 'Neapolitan leopard spotting on crust').lastInsertRowid;
  insertRecipeIng.run(recPizza, ingSanMarzano, 0.12, 'kg');
  insertRecipeIng.run(recPizza, ingMozzarella, 0.15, 'kg');

  // Bruschetta Recipe
  const recBruschetta = insertRecipe.run(itemBruschetta, 'Grill sourdough slices, rub with garlic, top with macerated heirloom tomatoes, torn mozzarella and drizzle truffle oil.', 'Serve immediately warm').lastInsertRowid;
  insertRecipeIng.run(recBruschetta, ingSourdough, 1, 'pcs');
  insertRecipeIng.run(recBruschetta, ingTomatoes, 0.12, 'kg');
  insertRecipeIng.run(recBruschetta, ingMozzarella, 0.06, 'kg');
  insertRecipeIng.run(recBruschetta, ingTruffleOil, 0.01, 'l');

  // Tiramisu Recipe
  const recTiramisu = insertRecipe.run(itemTiramisu, 'Dip ladyfingers briefly in espresso, arrange in dish, top with whipped egg yolk mascarpone sabayon, dust generously with dark cacao.', 'Chill 4 hours minimum').lastInsertRowid;
  insertRecipeIng.run(recTiramisu, ingMascarpone, 0.09, 'kg');
  insertRecipeIng.run(recTiramisu, ingEggs, 1, 'pcs');
  insertRecipeIng.run(recTiramisu, ingEspressoBeans, 0.03, 'kg');

  // 9. Initial Stock Movement History
  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (ingredient_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMovement.run(ingWagyu, 'purchase_received', 25.0, 0, 25.0, 'purchase_order', 'PO-2026-001', 'Initial weekly supply received from Prime Meats', 'Sarah Miller');
  insertMovement.run(ingSalmon, 'purchase_received', 15.0, 0, 15.0, 'purchase_order', 'PO-2026-001', 'Fresh catch delivered on ice', 'Sarah Miller');
  insertMovement.run(ingBrioche, 'purchase_received', 50.0, 0, 50.0, 'purchase_order', 'PO-2026-002', 'Morning fresh bake delivery', 'Sarah Miller');

  // 10. Sample Purchase Order
  const po1 = db.prepare(`
    INSERT INTO purchase_orders (po_number, supplier_id, status, total_cost, ordered_at, received_at, notes, created_by)
    VALUES ('PO-2026-001', ?, 'received', 970.00, datetime('now', '-3 days'), datetime('now', '-2 days'), 'Weekly high-grade meats and fresh seafood order', 'Sarah Miller')
  `).run(suppPrime).lastInsertRowid;

  db.prepare(`
    INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_cost, total_cost)
    VALUES (?, ?, ?, ?, ?)
  `).run(po1, ingWagyu, 25, 22.00, 550.00);

  db.prepare(`
    INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_cost, total_cost)
    VALUES (?, ?, ?, ?, ?)
  `).run(po1, ingSalmon, 15, 28.00, 420.00);

  // Draft PO for restock
  const poDraft = db.prepare(`
    INSERT INTO purchase_orders (po_number, supplier_id, status, total_cost, ordered_at, notes, created_by)
    VALUES ('PO-2026-002', ?, 'ordered', 245.00, datetime('now', '-1 day'), 'Restock order for low squid and grapefruits', 'Sarah Miller')
  `).run(suppProduce).lastInsertRowid;

  db.prepare(`
    INSERT INTO purchase_order_items (purchase_order_id, ingredient_id, quantity, unit_cost, total_cost)
    VALUES (?, ?, ?, ?, ?)
  `).run(poDraft, ingGrapefruit, 20, 3.20, 64.00);

  // 11. Sample Orders & Invoices (Historical and Active)
  // Order 1: Completed Dine-in yesterday
  const ord1 = db.prepare(`
    INSERT INTO orders (order_number, order_type, table_id, customer_name, customer_phone, status, subtotal, discount_type, discount_value, discount_amount, tax_amount, service_charge, final_amount, special_instructions, stock_deducted, created_by, created_at, updated_at)
    VALUES ('ORD-1001', 'dine_in', 1, 'Jonathan Cole', '+1 (555) 321-4321', 'completed', 73.00, 'percentage', 10, 7.30, 5.58, 3.29, 74.57, 'Table anniversary celebration', 1, 'David Chen', datetime('now', '-1 day', '-3 hours'), datetime('now', '-1 day', '-1 hour'))
  `).run().lastInsertRowid;

  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord1, itemBurger, 'Prime Wagyu Truffle Burger', 24.00, 2, 48.00);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord1, itemCarbonara, 'Classic Roman Carbonara', 22.50, 1, 22.50);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord1, itemEspresso, 'Single Origin Double Espresso', 4.50, 2, 9.00);

  const inv1 = db.prepare(`
    INSERT INTO invoices (invoice_number, order_id, subtotal, discount_amount, tax_amount, service_charge, total_amount, paid_amount, payment_status, invoice_date, created_at)
    VALUES ('INV-2026-1001', ?, 73.00, 7.30, 5.58, 3.29, 74.57, 74.57, 'paid', datetime('now', '-1 day', '-1 hour'), datetime('now', '-1 day', '-1 hour'))
  `).run(ord1).lastInsertRowid;

  db.prepare(`
    INSERT INTO payments (invoice_id, order_id, amount, payment_method, transaction_reference, status, processed_by, created_at)
    VALUES (?, ?, 74.57, 'card', 'AUTH_VISA_8812', 'completed', 'David Chen', datetime('now', '-1 day', '-1 hour'))
  `).run(inv1, ord1);

  // Order 2: Completed Takeaway today
  const ord2 = db.prepare(`
    INSERT INTO orders (order_number, order_type, customer_name, customer_phone, status, subtotal, discount_amount, tax_amount, service_charge, final_amount, stock_deducted, created_by, created_at, updated_at)
    VALUES ('ORD-1002', 'takeaway', 'Claire Montgomery', '+1 (555) 987-1234', 'completed', 47.50, 0, 4.04, 0, 51.54, 1, 'David Chen', datetime('now', '-4 hours'), datetime('now', '-3 hours'))
  `).run().lastInsertRowid;

  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord2, itemSalmon, 'Pan-Seared King Salmon', 28.50, 1, 28.50);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord2, itemPizza, 'Woodfired Margherita DOC', 19.00, 1, 19.00);

  const inv2 = db.prepare(`
    INSERT INTO invoices (invoice_number, order_id, subtotal, discount_amount, tax_amount, service_charge, total_amount, paid_amount, payment_status, invoice_date, created_at)
    VALUES ('INV-2026-1002', ?, 47.50, 0, 4.04, 0, 51.54, 51.54, 'paid', datetime('now', '-3 hours'), datetime('now', '-3 hours'))
  `).run(ord2).lastInsertRowid;

  db.prepare(`
    INSERT INTO payments (invoice_id, order_id, amount, payment_method, transaction_reference, status, processed_by, created_at)
    VALUES (?, ?, 51.54, 'upi', 'UPI-REF-99238', 'completed', 'David Chen', datetime('now', '-3 hours'))
  `).run(inv2, ord2);

  // Order 3: Preparing right now for Kitchen Display
  const ord3 = db.prepare(`
    INSERT INTO orders (order_number, order_type, table_id, customer_name, status, subtotal, tax_amount, service_charge, final_amount, special_instructions, stock_deducted, created_by, created_at, updated_at)
    VALUES ('ORD-1003', 'dine_in', 2, 'Table 2 - Guests', 'preparing', 85.50, 7.27, 4.28, 97.05, 'Medium rare for Ribeye please. Allergy note: no dairy in salad.', 1, 'Elena Rostova', datetime('now', '-18 minutes'), datetime('now', '-14 minutes'))
  `).run().lastInsertRowid;

  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(ord3, itemRibeye, 'USDA Prime Bone-In Ribeye (14oz)', 39.00, 1, 39.00, 'Cook Medium Rare');
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal, special_requests) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(ord3, itemBurger, 'Prime Wagyu Truffle Burger', 24.00, 1, 24.00, 'Extra truffle aioli');
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord3, itemBruschetta, 'Tuscan Truffle Bruschetta', 14.50, 1, 14.50);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord3, itemMocktail, 'Smoked Rosemary Grapefruit Fizz', 8.50, 1, 8.50);

  // Link table 2 to current order
  db.prepare(`UPDATE tables SET status = 'occupied', current_order_id = ? WHERE id = 2`).run(ord3);

  // Order 4: Pending / Confirmed order for Table 6
  const ord4 = db.prepare(`
    INSERT INTO orders (order_number, order_type, table_id, customer_name, status, subtotal, tax_amount, service_charge, final_amount, special_instructions, stock_deducted, created_by, created_at, updated_at)
    VALUES ('ORD-1004', 'dine_in', 6, 'Patio Table 6 - Dr. Adams', 'confirmed', 53.00, 4.51, 2.65, 60.16, 'Water with sliced lemon right away', 1, 'David Chen', datetime('now', '-6 minutes'), datetime('now', '-4 minutes'))
  `).run().lastInsertRowid;

  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord4, itemCarbonara, 'Classic Roman Carbonara', 22.50, 2, 45.00);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord4, itemMocktail, 'Smoked Rosemary Grapefruit Fizz', 8.50, 1, 8.50);

  db.prepare(`UPDATE tables SET status = 'occupied', current_order_id = ? WHERE id = 6`).run(ord4);

  // Order 5: Delivery Order Pending
  const ord5 = db.prepare(`
    INSERT INTO orders (order_number, order_type, customer_name, customer_phone, delivery_address, status, subtotal, tax_amount, service_charge, final_amount, special_instructions, stock_deducted, created_by, created_at, updated_at)
    VALUES ('ORD-1005', 'delivery', 'Sophia Bennett', '+1 (555) 774-8833', '840 Ridgeview Terrace, Apt 4B', 'pending', 30.50, 2.59, 0, 33.09, 'Leave at door and ring bell please', 0, 'David Chen', datetime('now', '-2 minutes'), datetime('now', '-2 minutes'))
  `).run().lastInsertRowid;

  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord5, itemPizza, 'Woodfired Margherita DOC', 19.00, 1, 19.00);
  db.prepare(`INSERT INTO order_items (order_id, menu_item_id, item_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)`).run(ord5, itemTiramisu, 'Espresso Mascarpone Tiramisu', 11.50, 1, 11.50);

  // 12. Operating Expenses
  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, title, amount, expense_date, payment_method, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertExpense.run('utilities', 'Commercial Gas & Electricity - Oct', 640.00, '2026-10-24', 'bank_transfer', 'High usage for woodfired ovens and walk-in coolers', 'Alex Rivera');
  insertExpense.run('supplies', 'Sanitary & Kitchen Cleaning Supplies', 185.00, '2026-10-25', 'card', 'Eco-friendly degreasers, compostable takeaway boxes, paper napkins', 'Elena Rostova');
  insertExpense.run('maintenance', 'Espresso Machine Calibration & Filter Replacement', 220.00, '2026-10-26', 'card', 'Quarterly preventative service by La Marzocco technician', 'Alex Rivera');
  insertExpense.run('marketing', 'Downtown Food Festival Sponsorship & Social Ad', 350.00, '2026-10-22', 'card', 'Featured fall menu promotion', 'Alex Rivera');

  // 13. Audit Log entries
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertAudit.run(1, 'Alex Rivera', 'DATABASE_INITIALIZATION', 'system', '1', 'Restaurant database schemas and core assets initialized successfully.');
  insertAudit.run(5, 'Sarah Miller', 'STOCK_RECEIVE', 'purchase_order', 'PO-2026-001', 'Received 25kg Wagyu beef and 15kg King salmon.');
  insertAudit.run(3, 'David Chen', 'ORDER_CREATED', 'order', 'ORD-1001', 'Created dine-in order for Table 1.');

  console.log('Seeding complete! Restaurant Management System is ready.');
}
