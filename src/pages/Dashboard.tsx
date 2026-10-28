import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  ChefHat,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Boxes,
  FileText,
  CreditCard,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const { formatCurrency } = useSettings();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading operations dashboard...</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    today_revenue: 0,
    today_orders: 0,
    pending_orders: 0,
    preparing_orders: 0,
    low_stock_count: 0,
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Executive Overview
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Live Real-Time
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time synchronization across Dining POS, Kitchen Line, and Warehouse Inventory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create POS Order</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all"
          >
            <Boxes className="w-4 h-4 text-orange-500" />
            <span>Adjust Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold transition-all"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Financial Report</span>
          </button>
          <button
            onClick={loadSummary}
            className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800/50 rounded-2xl transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Today Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
            <div className="w-10 h-10 rounded-2xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {formatCurrency(metrics.today_revenue)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{metrics.today_orders} orders recorded today</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Orders</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.today_orders}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Includes Dine-in, Takeaway & Delivery</span>
            </div>
          </div>
        </div>

        {/* Kitchen Active / Preparing */}
        <div
          onClick={() => setActiveTab('kds')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-400/50 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kitchen Queue</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono flex items-center gap-2">
              {metrics.preparing_orders}
              <span className="text-xs font-medium text-slate-400">on grill</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>{metrics.pending_orders} pending confirmation</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-400/50 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inventory Alerts</span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              metrics.low_stock_count > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {metrics.low_stock_count}
            </div>
            <div className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
              {metrics.low_stock_count > 0 ? 'Items below minimum stock threshold' : 'All stock levels optimal'}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts: Sales Trend & Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Daily Revenue Trend</h3>
              <p className="text-xs text-slate-500">Committed sales revenue over the past period</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-xl bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              Area Breakdown
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {data?.sales_trend && data.sales_trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.sales_trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`$${val}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#ea580c" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No revenue trend data recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Split */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Methods</h3>
                <p className="text-xs text-slate-500">Distribution of collected payments</p>
              </div>
              <CreditCard className="w-4 h-4 text-slate-400" />
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              {data?.payment_methods && data.payment_methods.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.payment_methods}
                      dataKey="total"
                      nameKey="payment_method"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {data.payment_methods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                      formatter={(val: any) => [formatCurrency(val), 'Volume']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-xs text-slate-400">No payment records yet</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            {data?.payment_methods &&
              data.payment_methods.map((pm, idx) => (
                <div key={pm.payment_method} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300 capitalize">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    {pm.payment_method} ({pm.count} txns)
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(pm.total)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Top Dishes & Recent Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Performing Dishes</h3>
              <p className="text-xs text-slate-500">Highest volume items by orders placed</p>
            </div>
            <button
              onClick={() => setActiveTab('menu')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              View Menu &rarr;
            </button>
          </div>

          <div className="h-60 w-full">
            {data?.top_items && data.top_items.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.top_items} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                    formatter={(val: any) => [`${val} plates sold`, 'Quantity']}
                  />
                  <Bar dataKey="total_sold" fill="#ea580c" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No dishes sold yet.
              </div>
            )}
          </div>
        </div>

        {/* Live Orders Ticker */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Orders Stream</h3>
              <p className="text-xs text-slate-500">Latest tickets from dining room and online</p>
            </div>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700"
            >
              All Orders &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recent_orders && data.recent_orders.length > 0 ? (
              data.recent_orders.map((o) => (
                <div
                  key={o.id}
                  onClick={() => setActiveTab('orders')}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:border-orange-300 dark:hover:border-orange-800 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-xs">
                      {o.order_type === 'dine_in' ? 'T' : o.order_type === 'takeaway' ? 'TO' : 'DEL'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{o.order_number}</span>
                        {o.table_number && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                            {o.table_number}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[200px]">
                        {o.customer_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white block">
                      {formatCurrency(o.final_amount)}
                    </span>
                    <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                      o.status === 'completed'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                        : o.status === 'preparing'
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                        : o.status === 'confirmed'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">No recent orders found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
