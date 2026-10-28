import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Order } from '../types';
import {
  ChefHat,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Check,
  RefreshCw,
  Flame,
  Volume2,
  VolumeX,
  Utensils,
  ShoppingBag,
  Truck,
} from 'lucide-react';

export const KitchenDisplay: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadKitchenOrders = async () => {
    try {
      const data = await api.getKitchenOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load KDS tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenOrders();
    if (!autoRefresh) return;
    const interval = setInterval(loadKitchenOrders, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleUpdateStatus = async (orderId: number, nextStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      await loadKitchenOrders();
    } catch (err: any) {
      alert(`Failed to update kitchen status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* KDS Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <ChefHat className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              Kitchen Display System (KDS)
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE LINE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time ticket queue with delay threshold alerts and inventory recipe depletion.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span>{autoRefresh ? 'Auto-Sync (5s)' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={soundEnabled ? 'Kitchen Bell Enabled' : 'Kitchen Bell Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Ticket Grid */}
      {orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((o) => {
            const isDelayed = o.is_delayed;
            const elapsed = o.elapsed_minutes || 0;

            let cardBorder = 'border-slate-800';
            let headerBg = 'bg-slate-800/80';

            if (o.status === 'preparing') {
              headerBg = 'bg-amber-950/50 border-b border-amber-800/60';
              cardBorder = isDelayed ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-amber-500/60';
            } else if (o.status === 'ready') {
              headerBg = 'bg-purple-950/50 border-b border-purple-800/60';
              cardBorder = 'border-purple-500/60';
            } else if (isDelayed) {
              cardBorder = 'border-rose-500 ring-2 ring-rose-500/30';
            }

            return (
              <div
                key={o.id}
                className={`bg-slate-900 rounded-3xl border ${cardBorder} shadow-lg overflow-hidden flex flex-col justify-between transition-all`}
              >
                {/* Ticket Header */}
                <div className={`p-4 ${headerBg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-base text-white">
                        {o.order_number}
                      </span>
                      {o.table_number && (
                        <span className="px-2 py-0.5 rounded-lg bg-orange-600 text-white font-bold text-xs">
                          Table {o.table_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isDelayed && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          DELAYED
                        </span>
                      )}
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 text-slate-300 font-mono text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {elapsed}m
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-300 mt-2">
                    <span className="capitalize flex items-center gap-1 font-medium">
                      {o.order_type === 'dine_in' && <Utensils className="w-3.5 h-3.5 text-orange-400" />}
                      {o.order_type === 'takeaway' && <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />}
                      {o.order_type === 'delivery' && <Truck className="w-3.5 h-3.5 text-emerald-400" />}
                      {o.order_type.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[150px]">
                      {o.customer_name}
                    </span>
                  </div>
                </div>

                {/* Items Checklist */}
                <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-72">
                  {o.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl bg-slate-800/40 border border-slate-800/80 space-y-1"
                    >
                      <div className="flex items-start justify-between text-sm">
                        <span className="font-bold text-white leading-tight">
                          <span className="text-orange-400 font-mono text-base mr-2 font-black">
                            {item.quantity}x
                          </span>
                          {item.item_name}
                        </span>
                        {item.prep_time_minutes && (
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            ~{item.prep_time_minutes}m
                          </span>
                        )}
                      </div>

                      {item.special_requests && (
                        <div className="text-[11px] font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-800/50">
                          &bull; {item.special_requests}
                        </div>
                      )}
                    </div>
                  ))}

                  {o.special_instructions && (
                    <div className="p-2 rounded-xl bg-orange-950/30 border border-orange-800/40 text-[11px] text-orange-300">
                      <span className="font-bold">Order Note:</span> {o.special_instructions}
                    </div>
                  )}
                </div>

                {/* Status Advancement CTA */}
                <div className="p-4 pt-2 border-t border-slate-800/80 bg-slate-950/30">
                  {o.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'preparing')}
                      className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Cooking (Prep)</span>
                    </button>
                  )}

                  {o.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'ready')}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Mark Ready to Serve</span>
                    </button>
                  )}

                  {o.status === 'ready' && (
                    <button
                      onClick={() => handleUpdateStatus(o.id, 'completed')}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Served &bull; Clear Ticket</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <ChefHat className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Kitchen Rail is Clear!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All active orders have been prepped and served. Incoming orders from POS will display here automatically.
          </p>
        </div>
      )}
    </div>
  );
};
