import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MenuItem, MenuCategory } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export const MenuManagement: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemCatId, setItemCatId] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemPrep, setItemPrep] = useState('15');
  const [itemAvailable, setItemAvailable] = useState(true);

  // Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const loadMenu = async () => {
    try {
      setLoading(true);
      const [cats, menu] = await Promise.all([
        api.getCategories(),
        api.getMenuItems({ category_id: selectedCat || undefined, search }),
      ]);
      setCategories(cats);
      setItems(menu);
      if (cats.length > 0 && !itemCatId) {
        setItemCatId(cats[0].id);
      }
    } catch (err) {
      console.error('Failed to load menu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
  }, [selectedCat, search]);

  const openAddItem = () => {
    setEditingItem(null);
    setItemName('');
    setItemCatId(categories[0]?.id || 1);
    setItemPrice('');
    setItemCost('');
    setItemDesc('');
    setItemImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80');
    setItemPrep('15');
    setItemAvailable(true);
    setShowItemModal(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCatId(item.category_id);
    setItemPrice(String(item.price));
    setItemCost(String(item.cost_price || 0));
    setItemDesc(item.description);
    setItemImage(item.image_url);
    setItemPrep(String(item.prep_time_minutes || 15));
    setItemAvailable(item.is_available === 1);
    setShowItemModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    try {
      const payload = {
        name: itemName,
        category_id: Number(itemCatId),
        price: parseFloat(itemPrice),
        cost_price: parseFloat(itemCost) || 0,
        description: itemDesc,
        image_url: itemImage,
        prep_time_minutes: parseInt(itemPrep) || 15,
        is_available: itemAvailable ? 1 : 0,
      };

      if (editingItem) {
        await api.updateMenuItem(editingItem.id, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setShowItemModal(false);
      await loadMenu();
    } catch (err: any) {
      alert(`Error saving menu item: ${err.message}`);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await api.updateMenuItem(item.id, {
        category_id: item.category_id,
        name: item.name,
        price: item.price,
        is_available: item.is_available === 1 ? 0 : 1,
      });
      await loadMenu();
    } catch (err: any) {
      alert(`Failed to toggle availability: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteMenuItem(id);
      await loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await api.createCategory({ name: catName, description: catDesc });
      setCatName('');
      setCatDesc('');
      setShowCategoryModal(false);
      await loadMenu();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Menu Catalog & Pricing
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {items.length} Active Items
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage culinary offerings, ingredients costing, profit margins, and dish availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all"
          >
            + Add Category
          </button>
          <button
            onClick={openAddItem}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Dish</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedCat === null
                ? 'bg-orange-600 text-white shadow-orange-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCat === c.id
                  ? 'bg-orange-600 text-white shadow-orange-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {c.name} ({c.item_count || 0})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search menu dishes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const margin = item.price > 0 && item.cost_price > 0
            ? (((item.price - item.cost_price) / item.price) * 100).toFixed(0)
            : null;

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-col justify-between transition-all group ${
                item.is_available === 0 ? 'opacity-60 bg-slate-50 dark:bg-slate-950/60' : ''
              }`}
            >
              <div>
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md text-white font-mono font-bold text-xs">
                    {formatCurrency(item.price)}
                  </div>
                  {item.is_available === 0 && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="px-3 py-1 bg-rose-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                  <span>{item.category_name}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="w-3 h-3" />
                    {item.prep_time_minutes} mins
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {item.description}
                </p>

                {/* Cost & Profit Margin Pills */}
                <div className="mt-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase">Food Cost:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(item.cost_price || 0)}
                    </span>
                  </div>
                  {margin && (
                    <div className="text-right">
                      <span className="text-slate-400 block text-[9px] uppercase">Margin:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {margin}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors ${
                    item.is_available === 1
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-200'
                  }`}
                >
                  {item.is_available === 1 ? 'Available' : 'Unavailable'}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditItem(item)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Dish Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveItem}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingItem ? 'Edit Culinary Dish' : 'Create New Menu Item'}
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dish Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Woodfired Truffle Pizza"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prep Time (mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemPrep}
                    onChange={(e) => setItemPrep(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Menu Selling Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="24.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estimated Ingredient Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="7.50"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Food Photography Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={itemImage}
                  onChange={(e) => setItemImage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Menu Description & Tasting Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation method, pairings..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Dish is actively available for ordering
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {editingItem ? 'Save Changes' : 'Create Dish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Menu Category</h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Woodfired Pizzas"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted dough with San Marzano tomatoes"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
