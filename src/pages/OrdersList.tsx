import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChefHat,
  Receipt,
  Utensils,
  Truck,
  ShoppingBag,
  Eye,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Boxes,
} from 'lucide-react';

interface OrdersListProps {
  onOpenReceipt: (invoiceId: number) => void;
  setActiveTab: (tab: string) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ onOpenReceipt, setActiveTab }) => {
  const { formatCurrency } = useSettings();

  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    cancelled: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected order for Detail Modal
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getOrders({
        status: selectedStatus,
        order_type: selectedType,
        search: searchQuery,
      });
      setOrders(res.orders);
      setCounts(res.counts);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, [selectedStatus, selectedType, searchQuery]);

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    try {
      setUpdatingStatus(true);
      await api.updateOrderStatus(orderId, nextStatus);
      await loadOrders();
      if (activeOrder && activeOrder.id === orderId) {
        const refreshed = await api.getOrder(orderId);
        setActiveOrder(refreshed);
      }
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    confirmed: { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    preparing: { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
    ready: { bg: 'bg-purple-50 dark:bg-purple-950/50', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    completed: { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    cancelled: { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Order Management System
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {counts.total} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track dining room orders from pending to completion with automatic recipe inventory sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
          >
            + New Order
          </button>
          <button
            onClick={loadOrders}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 rounded-xl"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders', count: counts.total },
            { id: 'pending', label: 'Pending', count: counts.pending },
            { id: 'confirmed', label: 'Confirmed', count: counts.confirmed },
            { id: 'preparing', label: 'Preparing', count: counts.preparing },
            { id: 'ready', label: 'Ready', count: counts.ready },
            { id: 'completed', label: 'Completed', count: counts.completed },
            { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedStatus === tab.id
                  ? 'bg-orange-600 text-white shadow-orange-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedStatus === tab.id
                    ? 'bg-orange-700 text-orange-100'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by order number (e.g. ORD-1001), guest name, or table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Service Types</option>
              <option value="dine_in">Dine-In Only</option>
              <option value="takeaway">Takeaway Only</option>
              <option value="delivery">Delivery Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table / Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Type & Table</th>
                <th className="py-3.5 px-4">Guest</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {orders.length > 0 ? (
                orders.map((o) => {
                  const sc = statusColors[o.status] || statusColors.pending;
                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {o.order_number}
                        <div className="text-[10px] font-normal text-slate-400">
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 capitalize">
                          {o.order_type === 'dine_in' && <Utensils className="w-3.5 h-3.5 text-orange-500" />}
                          {o.order_type === 'takeaway' && <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />}
                          {o.order_type === 'delivery' && <Truck className="w-3.5 h-3.5 text-emerald-500" />}
                          {o.order_type.replace('_', ' ')}
                        </span>
                        {o.table_number && (
                          <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                            Table: {o.table_number}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                        {o.customer_name}
                        {o.customer_phone && (
                          <div className="text-[10px] text-slate-400">{o.customer_phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {o.items && o.items.length > 0
                            ? o.items.map((i) => `${i.quantity}x ${i.item_name}`).join(', ')
                            : `${o.item_count || 1} items`}
                        </div>
                        {o.special_instructions && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 italic block truncate">
                            &ldquo;{o.special_instructions}&rdquo;
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(o.final_amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border capitalize ${sc.bg} ${sc.text} ${sc.border}`}
                        >
                          {o.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            o.payment_status === 'paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                              : o.payment_status === 'partially_paid'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {o.payment_status || 'unpaid'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={async () => {
                              const detailed = await api.getOrder(o.id);
                              setActiveOrder(detailed);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 transition-colors"
                            title="View Full Order Details & Status Workflow"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {o.invoice_number && (
                            <button
                              onClick={async () => {
                                const detailed = await api.getOrder(o.id);
                                if (detailed.invoice) {
                                  onOpenReceipt(detailed.invoice.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                              title="Print Receipt / View Invoice"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No orders match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Workflow Modal */}
      {activeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono">
                    {activeOrder.order_number}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[activeOrder.status]?.bg} ${statusColors[activeOrder.status]?.text}`}>
                    {activeOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {new Date(activeOrder.created_at).toLocaleString()} by {activeOrder.created_by}
                </p>
              </div>

              <button
                onClick={() => setActiveOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                &times;
              </button>
            </div>

            {/* Inventory Sync Status */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                <Boxes className="w-4 h-4 text-orange-500" />
                Recipe Stock Deduction:
              </span>
              <span
                className={`font-semibold text-[11px] px-2 py-0.5 rounded-full ${
                  activeOrder.stock_deducted === 1
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                }`}
              >
                {activeOrder.stock_deducted === 1 ? 'Deducted from Inventory' : 'Pending Deduction'}
              </span>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Advance Order Workflow:
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { id: 'pending', label: 'Pending' },
                  { id: 'confirmed', label: 'Confirm' },
                  { id: 'preparing', label: 'Cook' },
                  { id: 'ready', label: 'Ready' },
                  { id: 'completed', label: 'Complete' },
                ].map((s) => (
                  <button
                    key={s.id}
                    disabled={updatingStatus || activeOrder.status === s.id}
                    onClick={() => handleStatusChange(activeOrder.id, s.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                      activeOrder.status === s.id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/30'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {activeOrder.status !== 'cancelled' && (
                <button
                  onClick={() => {
                    if (confirm('Cancel this order? If stock was already deducted, it will be restored to inventory.')) {
                      handleStatusChange(activeOrder.id, 'cancelled');
                    }
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-semibold pt-1"
                >
                  Cancel Order & Restore Stock
                </button>
              )}
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Order Items:
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl border-slate-100 dark:border-slate-800 overflow-hidden text-xs">
                {activeOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        {item.quantity}x {item.item_name}
                      </span>
                      {item.special_requests && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                          Note: {item.special_requests}
                        </div>
                      )}
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(activeOrder.subtotal)}</span>
              </div>
              {activeOrder.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span className="font-mono">-{formatCurrency(activeOrder.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-mono">{formatCurrency(activeOrder.tax_amount)}</span>
              </div>
              {activeOrder.service_charge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge:</span>
                  <span className="font-mono">{formatCurrency(activeOrder.service_charge)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm">
                <span>Final Payable:</span>
                <span className="font-mono text-orange-600 dark:text-orange-400">{formatCurrency(activeOrder.final_amount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {activeOrder.invoice && (
                <button
                  onClick={() => {
                    const invId = activeOrder.invoice?.id;
                    if (invId) {
                      setActiveOrder(null);
                      onOpenReceipt(invId);
                    }
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              )}
              <button
                onClick={() => setActiveOrder(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
