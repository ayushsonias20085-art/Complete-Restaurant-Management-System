import React from 'react';
import { Invoice } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { Printer, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  const { formatCurrency, settings } = useSettings();

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const restSettings = invoice.settings || settings;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 print:hidden">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
            <Printer className="w-4 h-4 text-orange-500" />
            <span>Official Dining Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 print:p-0 print:m-0 print:w-full">
          {/* Logo / Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300 dark:border-slate-700">
            <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white font-serif">
              {restSettings?.name || 'Savoria Bistro & Lounge'}
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {restSettings?.tagline || 'Artisanal Woodfire & Seasonal Dining'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {restSettings?.address}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Tel: {restSettings?.phone} | {restSettings?.email}
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">INVOICE:</span>
              <span className="font-bold">{invoice.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ORDER NO:</span>
              <span>{invoice.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">DATE & TIME:</span>
              <span>{new Date(invoice.created_at || invoice.invoice_date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">SERVICE TYPE:</span>
              <span className="uppercase font-semibold text-orange-600 dark:text-orange-400">
                {invoice.order_type === 'dine_in' ? `Dine-In (${invoice.table_number || 'Table'})` : invoice.order_type}
              </span>
            </div>
            {invoice.customer_name && (
              <div className="flex justify-between">
                <span className="text-slate-500">GUEST:</span>
                <span>{invoice.customer_name}</span>
              </div>
            )}
          </div>

          {/* Items Header */}
          <div className="py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
            <div className="grid grid-cols-12 font-bold text-slate-400 uppercase text-[10px]">
              <span className="col-span-6">ITEM</span>
              <span className="col-span-2 text-center">QTY</span>
              <span className="col-span-2 text-right">PRICE</span>
              <span className="col-span-2 text-right">TOTAL</span>
            </div>
          </div>

          {/* Items List */}
          <div className="py-2 space-y-2 border-b border-dashed border-slate-300 dark:border-slate-700">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[11px] leading-tight">
                  <div className="col-span-6">
                    <span className="font-semibold">{item.item_name}</span>
                    {item.special_requests && (
                      <span className="block text-[9px] text-slate-400 italic">
                        * {item.special_requests}
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</div>
                  <div className="col-span-2 text-right text-slate-600 dark:text-slate-400">{formatCurrency(item.unit_price)}</div>
                  <div className="col-span-2 text-right font-semibold">{formatCurrency(item.subtotal)}</div>
                </div>
              ))
            ) : (
              <div className="py-2 text-center text-slate-400">Items recorded in system</div>
            )}
          </div>

          {/* Subtotal & Calculations */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>

            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount Applied:</span>
                <span>-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-slate-500">Sales Tax ({restSettings?.tax_rate_percent || 8.5}%):</span>
              <span>{formatCurrency(invoice.tax_amount)}</span>
            </div>

            {invoice.service_charge > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Service Charge ({restSettings?.service_charge_percent || 5}%):</span>
                <span>{formatCurrency(invoice.service_charge)}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
              <span>FINAL TOTAL:</span>
              <span className="text-base text-orange-600 dark:text-orange-400">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>
          </div>

          {/* Payments Section */}
          <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 space-y-1">
            <div className="text-[10px] font-bold uppercase text-slate-400">Payment Breakdown:</div>
            {invoice.payments && invoice.payments.length > 0 ? (
              invoice.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px]">
                  <span className="capitalize flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    {p.payment_method} ({p.transaction_reference || 'REF-OK'})
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-rose-500 font-semibold">
                <span>Payment Status:</span>
                <span className="uppercase">{invoice.payment_status}</span>
              </div>
            )}

            <div className="flex justify-between pt-1 font-semibold">
              <span className="text-slate-500">Balance Due:</span>
              <span className={invoice.total_amount - invoice.paid_amount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatCurrency(Math.max(0, invoice.total_amount - invoice.paid_amount))}
              </span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center text-[10px] text-slate-400 space-y-1">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {restSettings?.receipt_footer || 'Thank you for dining with us! Please visit again.'}
            </p>
            <p>Certified Tax Invoice • GST/VAT Registered</p>
            <div className="pt-2 flex items-center justify-center gap-1 text-[9px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Authentic Database Record • Savoria RMS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
