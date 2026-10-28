import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Ingredient, Supplier, StockMovement } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Boxes,
  Plus,
  AlertTriangle,
  TrendingDown,
  ArrowUpDown,
  History,
  Search,
  DollarSign,
  CheckCircle2,
  Trash2,
  Edit2,
  PlusCircle,
  Truck,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [summary, setSummary] = useState({
    total_ingredients: 0,
    total_inventory_value: 0,
    low_stock_count: 0,
    out_of_stock_count: 0,
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'ingredients' | 'movements'>('ingredients');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'waste' | 'set'>('add');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Produce');
  const [newUnit, setNewUnit] = useState<'kg' | 'g' | 'l' | 'ml' | 'pcs'>('kg');
  const [newStock, setNewStock] = useState('');
  const [newMinStock, setNewMinStock] = useState('5');
  const [newCost, setNewCost] = useState('');
  const [newSupplierId, setNewSupplierId] = useState<number | ''>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ingRes, supps, movs] = await Promise.all([
        api.getIngredients({ search, stock_status: statusFilter !== 'all' ? statusFilter : undefined }),
        api.getSuppliers(),
        api.getStockMovements(),
      ]);
      setIngredients(ingRes.ingredients);
      setSummary(ingRes.summary);
      setSuppliers(supps);
      setMovements(movs);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleOpenAdjust = (ing: Ingredient) => {
    setSelectedIng(ing);
    setAdjustType('add');
    setAdjustQty('');
    setAdjustReason('Weekly delivery received');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIng || !adjustQty) return;

    try {
      await api.adjustStock({
        ingredient_id: selectedIng.id,
        adjustment_type: adjustType,
        quantity: parseFloat(adjustQty),
        reason: adjustReason,
        notes: adjustNotes,
      });
      setShowAdjustModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCategory) return;

    try {
      await api.createIngredient({
        name: newName,
        category: newCategory,
        unit: newUnit,
        current_stock: parseFloat(newStock) || 0,
        min_stock_level: parseFloat(newMinStock) || 5,
        cost_per_unit: parseFloat(newCost) || 0,
        supplier_id: newSupplierId ? Number(newSupplierId) : null,
      });
      setShowAddModal(false);
      setNewName('');
      setNewStock('');
      setNewCost('');
      await loadData();
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
            Inventory & Stock Control
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              Recipe Synced
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of ingredients, current stock levels, wastage, and automated order depletion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Ingredients</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total_ingredients} items
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Active pantry & walk-in catalog</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inventory Valuation</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono text-emerald-600 dark:text-emerald-400">
            {formatCurrency(summary.total_inventory_value)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Weighted sum of current stock &times; cost</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'low'
              ? 'border-amber-500 ring-2 ring-amber-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Low Stock Alerts</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {summary.low_stock_count} items
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Below safety stock reorder point</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'out' ? 'all' : 'out')}
          className={`bg-white dark:bg-slate-900 p-4 rounded-3xl border shadow-sm cursor-pointer transition-all ${
            statusFilter === 'out'
              ? 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Out of Stock</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {summary.out_of_stock_count} items
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Immediate replenishment required</span>
        </div>
      </div>

      {/* Tabs: Ingredients Catalog vs Stock Movements */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ingredients'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Ingredients List
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'movements'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Audit Trail</span>
          </button>
        </div>

        {activeTab === 'ingredients' && (
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ingredient or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'ingredients' ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Ingredient</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Min Threshold</th>
                  <th className="py-3.5 px-4">Cost / Unit</th>
                  <th className="py-3.5 px-4">Total Value</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-right">Stock Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ingredients.map((ing) => {
                  const isLow = ing.current_stock <= ing.min_stock_level && ing.current_stock > 0;
                  const isOut = ing.current_stock <= 0;
                  const ratio = Math.min(100, Math.round((ing.current_stock / (ing.min_stock_level * 2)) * 100));

                  return (
                    <tr
                      key={ing.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {ing.name}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold">
                          {ing.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold ${
                            isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {ing.current_stock} {ing.unit}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, ratio)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                        {ing.min_stock_level} {ing.unit}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {formatCurrency(ing.cost_per_unit)} / {ing.unit}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(ing.total_valuation)}
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {ing.supplier_name || 'Internal Pantry'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(ing)}
                          className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Stock Movements History */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Ingredient</th>
                  <th className="py-3.5 px-4">Movement Type</th>
                  <th className="py-3.5 px-4">Change</th>
                  <th className="py-3.5 px-4">Before &rarr; After</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(m.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {m.ingredient_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        m.movement_type === 'purchase_received'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : m.movement_type === 'order_consumption'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                          : m.movement_type === 'waste'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                          : m.movement_type === 'order_cancellation_restore'
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {m.movement_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-mono font-bold ${
                      m.quantity_change > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change} {m.unit}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {m.quantity_before} &rarr; <span className="font-bold text-slate-800 dark:text-slate-200">{m.quantity_after}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {m.notes || 'Routine stock operation'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {m.created_by || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedIng && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveAdjustment}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Adjust Stock: {selectedIng.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Current on hand: {selectedIng.current_stock} {selectedIng.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Adjustment Type Radios */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  adjustType === 'add'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                + Add / Receive
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('waste')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  adjustType === 'waste'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                - Waste / Spoilage
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('set')}
                className={`py-2 rounded-lg font-semibold transition-all ${
                  adjustType === 'set'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                = Physical Count
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Quantity ({selectedIng.unit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={`Amount in ${selectedIng.unit}`}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken packaging, spoilage, delivery check-in..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Inspector notes, temperature check, batch number..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Commit Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Ingredient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateIngredient}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Add Inventory Ingredient
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. San Marzano Tomatoes"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Produce">Produce</option>
                    <option value="Meat">Meat</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Condiments">Condiments</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Grains">Grains</option>
                    <option value="Pantry">Pantry</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="l">Litres (l)</option>
                    <option value="ml">Millilitres (ml)</option>
                    <option value="pcs">Pieces (pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Stock On Hand
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5"
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost per Unit ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 14.50"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Primary Supplier
                  </label>
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Optional Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Create Ingredient
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
