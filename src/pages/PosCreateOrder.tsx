import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MenuItem, MenuCategory, TableItem } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Utensils,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Printer,
  FileCheck,
} from 'lucide-react';

interface PosCreateOrderProps {
  setActiveTab: (tab: string) => void;
  onOpenReceipt?: (invoiceId: number) => void;
}

interface CartItem {
  menu_item_id: number;
  item_name: string;
  unit_price: number;
  quantity: number;
  special_requests: string;
  image_url: string;
}

export const PosCreateOrder: React.FC<PosCreateOrderProps> = ({ setActiveTab }) => {
  const { formatCurrency, settings } = useSettings();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in');
  const [tableId, setTableId] = useState<number | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [autoConfirm, setAutoConfirm] = useState(true);

  // Success modal
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, items, tbls] = await Promise.all([
          api.getCategories(),
          api.getMenuItems({ available_only: true }),
          api.getTables(),
        ]);
        setCategories(cats);
        setMenuItems(items);
        setTables(tbls);
        if (cats.length > 0) {
          setSelectedCategory(cats[0].id);
        }
      } catch (err) {
        console.error('Failed to load POS catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtered Menu Items
  const filteredItems = menuItems.filter((item) => {
    const matchesCat = selectedCategory ? item.category_id === selectedCategory : true;
    const matchesSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCat && matchesSearch;
  });

  // Cart actions
  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.menu_item_id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menu_item_id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          item_name: item.name,
          unit_price: item.price,
          quantity: 1,
          special_requests: '',
          image_url: item.image_url,
        },
      ];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.menu_item_id === menuItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNotes = (menuItemId: number, notes: string) => {
    setCart((prev) =>
      prev.map((ci) =>
        ci.menu_item_id === menuItemId ? { ...ci, special_requests: notes } : ci
      )
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((ci) => ci.menu_item_id !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setSpecialInstructions('');
    setDiscountValue(0);
    setTableId('');
  };

  // Calculations
  const taxRate = settings?.tax_rate_percent || 8.5;
  const serviceChargeRate = orderType === 'dine_in' ? (settings?.service_charge_percent || 5.0) : 0;

  const subtotal = cart.reduce((sum, ci) => sum + ci.unit_price * ci.quantity, 0);

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = (subtotal * Math.min(100, discountValue)) / 100;
    } else {
      discountAmount = Math.min(subtotal, discountValue);
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxRate) / 100;
  const serviceChargeAmount = (taxableAmount * serviceChargeRate) / 100;
  const finalTotal = taxableAmount + taxAmount + serviceChargeAmount;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (orderType === 'dine_in' && !tableId) {
      alert('Please select a dining table for Dine-in orders');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        order_type: orderType,
        table_id: orderType === 'dine_in' ? tableId : null,
        customer_name: customerName || (orderType === 'dine_in' ? `Table ${tables.find(t => t.id === tableId)?.table_number} Guest` : 'Walk-in Guest'),
        customer_phone: customerPhone || null,
        delivery_address: orderType === 'delivery' ? deliveryAddress : null,
        special_instructions: specialInstructions || null,
        discount_type: discountType,
        discount_value: discountValue,
        auto_confirm: autoConfirm,
        items: cart.map((ci) => ({
          menu_item_id: ci.menu_item_id,
          quantity: ci.quantity,
          special_requests: ci.special_requests || null,
        })),
      };

      const res = await api.createOrder(payload);
      setPlacedOrder(res);
      clearCart();
    } catch (err: any) {
      alert(`Error creating order: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            POS Order Station
            <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              Station #01
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select dishes, customize orders, and transmit tickets directly to kitchen line & billing.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search dish or ingredient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Menu Catalog (7 or 8 columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === null
                  ? 'bg-orange-600 text-white shadow-orange-600/30'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-orange-600 text-white shadow-orange-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const inCart = cart.find((ci) => ci.menu_item_id === item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm hover:border-orange-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono font-bold">
                      {formatCurrency(item.price)}
                    </div>
                    {item.prep_time_minutes && (
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                        {item.prep_time_minutes} min prep
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">
                      {item.category_name}
                    </span>

                    {inCart ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-xl border border-orange-200 dark:border-orange-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {inCart.quantity} in cart
                      </span>
                    ) : (
                      <button className="p-1.5 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600 group-hover:text-white transition-all">
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Cart & Order Placement (5 or 4 columns) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 sticky top-20">
          {/* Order Mode Selector */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                orderType === 'dine_in'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Dine-In</span>
            </button>
            <button
              onClick={() => setOrderType('takeaway')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                orderType === 'takeaway'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Takeaway</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                orderType === 'delivery'
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery</span>
            </button>
          </div>

          {/* Table / Customer Details Form */}
          <div className="space-y-2.5">
            {orderType === 'dine_in' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Dining Table *
                </label>
                <select
                  value={tableId}
                  onChange={(e) => setTableId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                >
                  <option value="">-- Choose Available Table --</option>
                  {tables.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.status === 'occupied'}>
                      {t.table_number} ({t.floor} - {t.capacity} Seats) {t.status === 'occupied' ? '(Occupied)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555)..."
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {orderType === 'delivery' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Street Address *
                </label>
                <input
                  type="text"
                  placeholder="Apartment, Street, Area..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div className="border-t border-b border-slate-100 dark:border-slate-800 py-3 space-y-2.5 max-h-60 overflow-y-auto pr-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>Selected Dishes ({cart.reduce((s, c) => s + c.quantity, 0)})</span>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-rose-500 hover:text-rose-600 text-[11px]">
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length > 0 ? (
              cart.map((ci) => (
                <div
                  key={ci.menu_item_id}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                      {ci.item_name}
                    </span>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {formatCurrency(ci.unit_price * ci.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      placeholder="Special note (e.g. no garlic)..."
                      value={ci.special_requests}
                      onChange={(e) => updateItemNotes(ci.menu_item_id, e.target.value)}
                      className="text-[10px] bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none text-slate-600 dark:text-slate-300 w-36 placeholder:italic"
                    />

                    <div className="flex items-center gap-1 bg-white dark:bg-slate-700 rounded-xl p-0.5 border border-slate-200 dark:border-slate-600">
                      <button
                        onClick={() => updateQuantity(ci.menu_item_id, -1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-1.5 font-bold text-xs text-slate-900 dark:text-white">
                        {ci.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(ci.menu_item_id, 1)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(ci.menu_item_id)}
                        className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                <ShoppingBag className="w-7 h-7 mx-auto mb-1 opacity-50" />
                Cart is currently empty. Tap a dish to add.
              </div>
            )}
          </div>

          {/* Discount Controls */}
          {cart.length > 0 && (
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Promo / Discount
                </span>
                <div className="flex gap-1 text-[10px]">
                  <button
                    onClick={() => setDiscountType('percentage')}
                    className={`px-1.5 py-0.5 rounded ${
                      discountType === 'percentage'
                        ? 'bg-orange-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    %
                  </button>
                  <button
                    onClick={() => setDiscountType('fixed')}
                    className={`px-1.5 py-0.5 rounded ${
                      discountType === 'fixed'
                        ? 'bg-orange-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>

              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : subtotal}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder={discountType === 'percentage' ? 'e.g. 10 (%)' : 'e.g. 5 ($)'}
                className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Price Calculation Summary */}
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount:</span>
                <span className="font-mono font-semibold">-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Sales Tax ({taxRate}%):</span>
              <span className="font-mono">{formatCurrency(taxAmount)}</span>
            </div>

            {orderType === 'dine_in' && serviceChargeRate > 0 && (
              <div className="flex justify-between">
                <span>Service Charge ({serviceChargeRate}%):</span>
                <span className="font-mono">{formatCurrency(serviceChargeAmount)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
              <span>Final Total:</span>
              <span className="text-base text-orange-600 dark:text-orange-400 font-mono">
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>

          {/* Workflow Toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoConfirm}
              onChange={(e) => setAutoConfirm(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>Auto-confirm & deduct recipe inventory immediately</span>
          </label>

          {/* Place Order CTA */}
          <button
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || submitting}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-600/30 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span>Transmitting Order...</span>
            ) : (
              <>
                <span>Place Order &bull; {formatCurrency(finalTotal)}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Order Confirmed!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Ticket <span className="font-bold font-mono text-orange-600">{placedOrder.orderNumber}</span> has been logged to the database and sent to the kitchen line.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Invoice Number:</span>
                <span className="font-mono font-bold">{placedOrder.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Payable:</span>
                <span className="font-mono font-bold text-orange-600">{formatCurrency(placedOrder.finalAmount)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setPlacedOrder(null);
                  setActiveTab('orders');
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold"
              >
                View in Orders Dashboard
              </button>
              <button
                onClick={() => setPlacedOrder(null)}
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Create Another Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
