import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Invoice } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  Receipt,
  Search,
  Filter,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  DollarSign,
  PlusCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BillingInvoicesProps {
  onOpenReceipt: (invoiceId: number) => void;
}

export const BillingInvoices: React.FC<BillingInvoicesProps> = ({ onOpenReceipt }) => {
  const { formatCurrency } = useSettings();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'bank_transfer'>('card');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Refund Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInvoice, setRefundInvoice] = useState<Invoice | null>(null);
  const [refundPaymentId, setRefundPaymentId] = useState<number>(0);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Customer request / satisfaction');

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.getInvoices({
        payment_status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search,
      });
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [selectedStatus, search]);

  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const balance = inv.total_amount - inv.paid_amount;
    setPaymentAmount(String(Math.max(0, balance)));
    setPaymentMethod('card');
    setTransactionRef(`AUTH_${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmount) return;

    try {
      setSubmittingPayment(true);
      await api.recordPayment({
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        transaction_reference: transactionRef,
        notes: paymentNotes,
      });
      setShowPaymentModal(false);
      await loadInvoices();
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openRefundModal = async (inv: Invoice) => {
    const detailed = await api.getInvoice(inv.id);
    setRefundInvoice(detailed);
    if (detailed.payments && detailed.payments.length > 0) {
      const activePay = detailed.payments.find((p) => p.status === 'completed') || detailed.payments[0];
      setRefundPaymentId(activePay.id);
      setRefundAmount(String(activePay.amount));
    }
    setShowRefundModal(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPaymentId || !refundAmount || !refundReason) return;

    try {
      await api.processRefund({
        payment_id: refundPaymentId,
        amount: parseFloat(refundAmount),
        reason: refundReason,
      });
      setShowRefundModal(false);
      await loadInvoices();
    } catch (err: any) {
      alert(`Refund failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Billing & Invoices
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              POS Integrated
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate itemized tax invoices, record split/partial payments, issue refunds, and print thermal receipts.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Bills' },
            { id: 'unpaid', label: 'Unpaid Due' },
            { id: 'partially_paid', label: 'Partially Paid' },
            { id: 'paid', label: 'Fully Settled' },
            { id: 'refunded', label: 'Refunded' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedStatus === tab.id
                  ? 'bg-orange-600 text-white shadow-orange-600/25'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by invoice or order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Order & Guest</th>
                <th className="py-3.5 px-4">Subtotal</th>
                <th className="py-3.5 px-4">Tax & Service</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Paid</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => {
                const balance = inv.total_amount - inv.paid_amount;
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {inv.invoice_number}
                      <div className="text-[10px] font-normal text-slate-400">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {inv.order_number}
                      </span>
                      <div className="text-[11px] text-slate-500">{inv.customer_name}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {formatCurrency(inv.subtotal)}
                      {inv.discount_amount > 0 && (
                        <span className="text-[10px] text-emerald-600 block">
                          -{formatCurrency(inv.discount_amount)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">
                      +{formatCurrency(inv.tax_amount + (inv.service_charge || 0))}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {formatCurrency(inv.total_amount)}
                    </td>

                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatCurrency(inv.paid_amount)}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      <span className={balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                        {formatCurrency(Math.max(0, balance))}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.payment_status === 'paid'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : inv.payment_status === 'partially_paid'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                            : inv.payment_status === 'refunded'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {inv.payment_status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.payment_status !== 'paid' && inv.payment_status !== 'refunded' && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1 transition-all"
                            title="Process Payment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Collect</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenReceipt(inv.id)}
                          className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Print Thermal Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {inv.paid_amount > 0 && inv.payment_status !== 'refunded' && (
                          <button
                            onClick={() => openRefundModal(inv)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Process Refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Settle Bill: {selectedInvoice.invoice_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Bill: {formatCurrency(selectedInvoice.total_amount)} &bull; Balance Due:{' '}
                  <strong className="text-rose-600">
                    {formatCurrency(selectedInvoice.total_amount - selectedInvoice.paid_amount)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'card', label: 'Credit Card' },
                { id: 'upi', label: 'UPI / QR' },
                { id: 'bank_transfer', label: 'Bank wire' },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as any)}
                  className={`py-2 px-1 rounded-xl text-center font-semibold border transition-all ${
                    paymentMethod === pm.id
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  max={selectedInvoice.total_amount - selectedInvoice.paid_amount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction / Auth Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. AUTH_VISA_8812 or Cash Till 1"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional memo (e.g. split between 2 cards)..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Payment ({formatCurrency(parseFloat(paymentAmount) || 0)})</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Process Refund Modal */}
      {showRefundModal && refundInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleProcessRefund}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Process Payment Refund
              </h3>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Completed Payment Transaction *
                </label>
                <select
                  value={refundPaymentId}
                  onChange={(e) => setRefundPaymentId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {refundInvoice.payments?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.payment_method.toUpperCase()} &bull; {formatCurrency(p.amount)} ({p.transaction_reference})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Refund Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Refund *
                </label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Execute Refund
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
