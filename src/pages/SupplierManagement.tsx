import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Supplier, PurchaseOrder, Ingredient } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Truck,
  Plus,
  CheckCircle2,
  PackageCheck,
  Clock,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  Boxes,
  ArrowRight,
} from 'lucide-react';

export const SupplierManagement: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'directory'>('orders');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showPOModal, setShowPOModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  // New PO State
  const [poSupplierId, setPoSupplierId] = useState<number>(0);
  const [poNotes, setPoNotes] = useState('');
  const [poLines, setPoLines] = useState<
    { ingredient_id: number; quantity: number; unit_cost: number }[]
  >([]);

  // New Supplier State
  const [suppName, setSuppName] = useState('');
  const [suppContact, setSuppContact] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppAddress, setSuppAddress] = useState('');
  const [suppNotes, setSuppNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [supps, pos, ingRes] = await Promise.all([
        api.getSuppliers(),
        api.getPurchaseOrders(),
        api.getIngredients(),
      ]);
      setSuppliers(supps);
      setPurchaseOrders(pos);
      setIngredients(ingRes.ingredients);
      if (supps.length > 0 && !poSupplierId) {
        setPoSupplierId(supps[0].id);
      }
    } catch (err) {
      console.error('Failed to load supplier data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewPO = () => {
    setPoSupplierId(suppliers[0]?.id || 1);
    setPoNotes('');
    setPoLines([
      {
        ingredient_id: ingredients[0]?.id || 1,
        quantity: 10,
        unit_cost: ingredients[0]?.cost_per_unit || 5,
      },
    ]);
    setShowPOModal(true);
  };

  const addPOLine = () => {
    const firstIng = ingredients[0];
    setPoLines([
      ...poLines,
      {
        ingredient_id: firstIng?.id || 1,
        quantity: 10,
        unit_cost: firstIng?.cost_per_unit || 5,
      },
    ]);
  };

  const updatePOLine = (idx: number, field: string, val: any) => {
    setPoLines(
      poLines.map((line, i) => {
        if (i === idx) {
          if (field === 'ingredient_id') {
            const ing = ingredients.find((item) => item.id === Number(val));
            return {
              ...line,
              ingredient_id: Number(val),
              unit_cost: ing?.cost_per_unit || line.unit_cost,
            };
          }
          return { ...line, [field]: parseFloat(val) || 0 };
        }
        return line;
      })
    );
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || poLines.length === 0) return;

    try {
      await api.createPurchaseOrder({
        supplier_id: poSupplierId,
        notes: poNotes,
        items: poLines,
      });
      setShowPOModal(false);
      await loadData();
    } catch (err: any) {
      alert(`PO creation error: ${err.message}`);
    }
  };

  const handleReceivePO = async (poId: number) => {
    if (!confirm('Confirm receiving this delivery? Inventory quantities will be updated immediately.')) return;
    try {
      await api.receivePurchaseOrder(poId);
      await loadData();
    } catch (err: any) {
      alert(`Error receiving PO: ${err.message}`);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName) return;

    try {
      await api.createSupplier({
        name: suppName,
        contact_person: suppContact,
        email: suppEmail,
        phone: suppPhone,
        address: suppAddress,
        notes: suppNotes,
      });
      setShowSupplierModal(false);
      setSuppName('');
      setSuppContact('');
      setSuppEmail('');
      setSuppPhone('');
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
            Suppliers & Procurement
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {purchaseOrders.length} Purchase Orders
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage vendors, issue purchase orders, and receive fresh stock straight into inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowSupplierModal(true)}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all"
          >
            + Add Vendor
          </button>
          <button
            onClick={openNewPO}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Purchase Orders ({purchaseOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'directory'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <span>Vendor Directory ({suppliers.length})</span>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'orders' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {po.po_number}
                      </span>
                      <div className="text-[10px] text-slate-400">
                        Ordered: {new Date(po.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        po.status === 'received'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : po.status === 'ordered'
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vendor:</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">{po.supplier_name}</strong>
                    {po.supplier_phone && (
                      <span className="text-slate-500 block text-[11px]">{po.supplier_phone}</span>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="mt-3 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Items Ordered:</span>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl border-slate-100 dark:border-slate-800 overflow-hidden text-xs max-h-36 overflow-y-auto">
                      {po.items?.map((item) => (
                        <div key={item.id} className="p-2 flex justify-between">
                          <span className="text-slate-700 dark:text-slate-300">
                            {item.quantity} {item.unit} &bull; {item.ingredient_name}
                          </span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {formatCurrency(item.total_cost)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {po.notes && (
                    <div className="mt-2 text-[11px] text-slate-500 italic">
                      Note: {po.notes}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">PO Total:</span>
                    <span className="text-base font-bold font-mono text-orange-600 dark:text-orange-400">
                      {formatCurrency(po.total_cost)}
                    </span>
                  </div>

                  {po.status === 'ordered' && (
                    <button
                      onClick={() => handleReceivePO(po.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Receive Delivery</span>
                    </button>
                  )}

                  {po.status === 'received' && (
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Stock Verified</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Vendors Directory */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3"
            >
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{s.name}</h3>
                <p className="text-xs text-orange-600 font-medium mt-0.5">
                  Contact: {s.contact_person || 'Representative'}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                {s.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                )}
                {s.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                )}
                {s.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.address}</span>
                  </div>
                )}
              </div>

              {s.notes && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-500 italic">
                  {s.notes}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
                <span>{s.ingredients_supplied_count || 0} catalog ingredients</span>
                <span>{s.purchase_orders_count || 0} lifetime orders</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreatePO}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create Vendor Purchase Order
              </h3>
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Vendor *
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Order Line Items:
                  </span>
                  <button
                    type="button"
                    onClick={addPOLine}
                    className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {poLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <select
                        value={line.ingredient_id}
                        onChange={(e) => updatePOLine(idx, 'ingredient_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Quantity"
                        value={line.quantity}
                        onChange={(e) => updatePOLine(idx, 'quantity', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />

                      <input
                        type="number"
                        step="0.01"
                        placeholder="Unit $"
                        value={line.unit_cost}
                        onChange={(e) => updatePOLine(idx, 'unit_cost', e.target.value)}
                        className="w-20 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />

                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 w-16 text-right">
                        {formatCurrency(line.quantity * line.unit_cost)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Notes & Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deliver before 8:00 AM through dock entrance..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 text-right">
                <span className="text-slate-400 text-xs">Estimated Cost: </span>
                <strong className="text-base text-orange-600 font-mono">
                  {formatCurrency(
                    poLines.reduce((sum, l) => sum + (l.quantity * l.unit_cost || 0), 0)
                  )}
                </strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPOModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Issue Purchase Order
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateSupplier}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Register Food Vendor</h3>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Organic Fisheries"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Representative Contact Person
                </label>
                <input
                  type="text"
                  placeholder="e.g. Julian Hayes"
                  value={suppContact}
                  onChange={(e) => setSuppContact(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="orders@apex.com"
                    value={suppEmail}
                    onChange={(e) => setSuppEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555)..."
                    value={suppPhone}
                    onChange={(e) => setSuppPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Facility Address
                </label>
                <input
                  type="text"
                  placeholder="Street, City, State..."
                  value={suppAddress}
                  onChange={(e) => setSuppAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Terms & Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Lead times, cold-chain protocol, payment terms..."
                  value={suppNotes}
                  onChange={(e) => setSuppNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Save Vendor
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
