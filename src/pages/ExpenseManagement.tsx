import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Expense } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  CreditCard,
  Building,
  Users,
  Zap,
  ShoppingBag,
  Wrench,
  Sparkles,
} from 'lucide-react';

export const ExpenseManagement: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'rent' | 'salaries' | 'utilities' | 'supplies' | 'maintenance' | 'marketing' | 'other'>('utilities');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [notes, setNotes] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses({
        category: selectedCat !== 'all' ? selectedCat : undefined,
      });
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCat]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    try {
      await api.createExpense({
        title,
        category,
        amount: parseFloat(amount),
        expense_date: date,
        payment_method: paymentMethod,
        notes,
      });
      setShowModal(false);
      setTitle('');
      setAmount('');
      setNotes('');
      await loadExpenses();
    } catch (err: any) {
      alert(`Error creating expense: ${err.message}`);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      await loadExpenses();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Operating Expenses & Overhead
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {formatCurrency(totalExpenseSum)} Total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track fixed and variable restaurant operating costs to ensure accurate net profit calculations.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Expenses' },
          { id: 'utilities', label: 'Gas & Power' },
          { id: 'rent', label: 'Lease & Rent' },
          { id: 'salaries', label: 'Staff Payroll' },
          { id: 'supplies', label: 'Supplies & Paper' },
          { id: 'maintenance', label: 'Equipment Repair' },
          { id: 'marketing', label: 'Marketing & Ads' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCat(tab.id)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
              selectedCat === tab.id
                ? 'bg-orange-600 text-white shadow-orange-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Expense Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Notes</th>
                <th className="py-3.5 px-4 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {exp.expense_date}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {exp.title}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                    {exp.payment_method.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                    {exp.notes || '-'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateExpense}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Record Operating Expense</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expense Description *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Commercial Electric & Gas"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="utilities">Gas & Utilities</option>
                    <option value="rent">Rent / Property</option>
                    <option value="salaries">Staff Salaries</option>
                    <option value="supplies">Packaging & Supplies</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="marketing">Marketing & Promo</option>
                    <option value="other">Other Operating</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 450.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="bank_transfer">Bank Wire</option>
                    <option value="card">Company Card</option>
                    <option value="cash">Petty Cash</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Receipt number, contractor info, account details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
