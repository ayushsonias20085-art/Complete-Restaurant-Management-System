import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TableItem } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Grid,
  Plus,
  Users,
  Utensils,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

interface TablesManagementProps {
  setActiveTab: (tab: string) => void;
}

export const TablesManagement: React.FC<TablesManagementProps> = ({ setActiveTab }) => {
  const { formatCurrency } = useSettings();

  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Table Form
  const [tableNumber, setTableNumber] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [floor, setFloor] = useState('Main Dining Room');

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleStatusToggle = async (table: TableItem, nextStatus: 'available' | 'reserved') => {
    try {
      await api.updateTable(table.id, {
        table_number: table.table_number,
        capacity: table.capacity,
        floor: table.floor,
        status: nextStatus,
      });
      await loadTables();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableNumber) return;

    try {
      await api.createTable({
        table_number: tableNumber,
        capacity: parseInt(capacity) || 4,
        floor,
      });
      setShowAddModal(false);
      setTableNumber('');
      await loadTables();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const floors = Array.from(new Set(tables.map((t) => t.floor)));
  const filteredTables = selectedFloor === 'all' ? tables : tables.filter((t) => t.floor === selectedFloor);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Dining Tables & Floor Plan
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {tables.length} Seating Units
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time floor occupancy, dining capacity, reservation status, and linked tickets.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Dining Table</span>
        </button>
      </div>

      {/* Floor Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFloor('all')}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
            selectedFloor === 'all'
              ? 'bg-orange-600 text-white shadow-orange-600/25'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Entire Restaurant ({tables.length})
        </button>
        {floors.map((fl) => (
          <button
            key={fl}
            onClick={() => setSelectedFloor(fl)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedFloor === fl
                ? 'bg-orange-600 text-white shadow-orange-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {fl} ({tables.filter((t) => t.floor === fl).length})
          </button>
        ))}
      </div>

      {/* Table Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((tbl) => {
          const isOccupied = tbl.status === 'occupied';
          const isReserved = tbl.status === 'reserved';

          return (
            <div
              key={tbl.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 shadow-sm space-y-3 flex flex-col justify-between transition-all ${
                isOccupied
                  ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/10'
                  : isReserved
                  ? 'border-purple-400 dark:border-purple-700'
                  : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-base text-slate-900 dark:text-white">
                      {tbl.table_number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {tbl.capacity} Seats
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isOccupied
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        : isReserved
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {tbl.status}
                  </span>
                </div>

                <div className="mt-2 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Zone / Section:</span>
                  <div className="font-semibold text-slate-700 dark:text-slate-300">{tbl.floor}</div>
                </div>

                {/* If Occupied, show ticket info */}
                {isOccupied && (
                  <div className="mt-3 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-amber-800 dark:text-amber-300 font-bold">
                        Ticket: {tbl.order_number}
                      </span>
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                        {formatCurrency(tbl.final_amount)}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 truncate">
                      Guest: {tbl.customer_name || 'Dine-In Guest'}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                {isOccupied ? (
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-center transition-all"
                  >
                    View Active Ticket
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveTab('pos')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-all"
                    >
                      Seat & Order
                    </button>

                    <button
                      onClick={() => handleStatusToggle(tbl, isReserved ? 'available' : 'reserved')}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                    >
                      {isReserved ? 'Unreserve' : 'Reserve'}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateTable}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Add Dining Table</h3>
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
                  Table Number / Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T-11 or Patio 4"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Guest Seating Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Floor Section / Zone
                </label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Main Dining Room">Main Dining Room</option>
                  <option value="Terrace Patio">Terrace Patio</option>
                  <option value="Private Booths">Private Booths</option>
                  <option value="Window Bar">Window Bar</option>
                  <option value="Mezzanine Lounge">Mezzanine Lounge</option>
                </select>
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
                Create Table
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
