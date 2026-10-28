import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import {
  Settings,
  Save,
  CheckCircle2,
  Building,
  DollarSign,
  Percent,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const RestaurantSettings: React.FC = () => {
  const { settings, refreshSettings } = useSettings();

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [taxRate, setTaxRate] = useState('8.5');
  const [serviceCharge, setServiceCharge] = useState('5.0');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [lowStockDefault, setLowStockDefault] = useState('10');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setName(settings.name || '');
      setTagline(settings.tagline || '');
      setAddress(settings.address || '');
      setPhone(settings.phone || '');
      setEmail(settings.email || '');
      setCurrencySymbol(settings.currency_symbol || '$');
      setTaxRate(String(settings.tax_rate_percent || 8.5));
      setServiceCharge(String(settings.service_charge_percent || 5.0));
      setReceiptFooter(settings.receipt_footer || '');
      setLowStockDefault(String(settings.low_stock_threshold_default || 10));
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSettings({
        name,
        tagline,
        address,
        phone,
        email,
        currency_symbol: currencySymbol,
        tax_rate_percent: parseFloat(taxRate) || 0,
        service_charge_percent: parseFloat(serviceCharge) || 0,
        receipt_footer: receiptFooter,
        low_stock_threshold_default: parseInt(lowStockDefault) || 10,
      });
      await refreshSettings();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Settings save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Restaurant Configuration
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              Tax & Policy
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure restaurant legal branding, tax percentages, hospitality service rates, and currency symbols.
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Entity Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-orange-500" />
            <span>Brand & Legal Entity Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Restaurant Trade Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tagline / Subheading
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Physical Street Address (Appears on Receipts)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Contact Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Taxes & Financial Policies */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-emerald-500" />
            <span>Configurable Tax & Billing Calculations</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency Symbol
              </label>
              <input
                type="text"
                maxLength={4}
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">e.g. $, €, £, ₹, ¥</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Configurable Sales Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Applied to all orders automatically</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dine-in Service Charge (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="30"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Applied only to Dine-in seating</span>
            </div>
          </div>
        </div>

        {/* Receipt & Inventory Defaults */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-500" />
            <span>Thermal Receipt Customization</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Receipt Footer Memo / Thank You Note
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="Thank you for dining with us!..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Default Low-Stock Alert Warning Level (Units)
              </label>
              <input
                type="number"
                min="1"
                value={lowStockDefault}
                onChange={(e) => setLowStockDefault(e.target.value)}
                className="w-48 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-orange-600/30 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Configuration...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
