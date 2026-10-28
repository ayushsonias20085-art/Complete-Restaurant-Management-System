import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FinancialReport } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  RotateCcw,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const FinancialReports: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [report, setReport] = useState<FinancialReport | null>(null);
  const [rangePreset, setRangePreset] = useState<'today' | '7days' | 'month' | 'custom'>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      let sDate = startDate;
      let eDate = endDate;

      const now = new Date();
      if (rangePreset === 'today') {
        sDate = now.toISOString().split('T')[0];
        eDate = sDate;
      } else if (rangePreset === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        sDate = d.toISOString().split('T')[0];
        eDate = now.toISOString().split('T')[0];
      } else if (rangePreset === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        sDate = d.toISOString().split('T')[0];
        eDate = now.toISOString().split('T')[0];
      }

      const res = await api.getFinancialReport({
        start_date: sDate || undefined,
        end_date: eDate || undefined,
      });
      setReport(res);
    } catch (err) {
      console.error('Failed to load financial report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [rangePreset]);

  const handleExportCSV = () => {
    if (!report) return;

    const rows = [
      ['METRIC', 'AMOUNT'],
      ['Gross Sales', report.gross_sales],
      ['Total Discounts', report.total_discounts],
      ['Taxes Collected', report.total_taxes],
      ['Service Charges', report.total_service_charges],
      ['Total Orders', report.total_orders],
      ['Refunds Issued', report.total_refunds],
      ['Actual Net Sales Revenue', report.actual_revenue],
      ['Cost of Goods Sold (COGS)', report.estimated_cogs],
      ['Operating Expenses', report.operating_expenses],
      ['Estimated Net Profit', report.estimated_profit],
      [],
      ['DATE', 'DAILY REVENUE', 'ORDERS COUNT'],
      ...report.daily_trends.map((t) => [t.date, t.revenue, t.orders_count]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Savoria_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const profitMargin =
    report && report.actual_revenue > 0
      ? ((report.estimated_profit / report.actual_revenue) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Financial & P&L Statement
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
              Audit Grade
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Realized revenue, ingredient recipe costs (COGS), operating overhead, and estimated net profit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-2xl text-xs font-semibold shadow-md transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: '7days', label: 'Last 7 Days' },
            { id: 'month', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setRangePreset(preset.id as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                rangePreset === preset.id
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {rangePreset === 'custom' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <span className="text-slate-400">&rarr;</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <button
              onClick={loadReport}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-semibold"
            >
              Filter
            </button>
          </div>
        )}
      </div>

      {/* Key Metric Highlights */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gross Sales */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Gross Sales (Menu Value)
            </span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
              {formatCurrency(report.gross_sales)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              From {report.total_orders} total orders placed
            </div>
          </div>

          {/* Actual Net Revenue */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Sales Revenue
            </span>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 font-mono">
              {formatCurrency(report.actual_revenue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              After {formatCurrency(report.total_discounts)} discounts & refunds
            </div>
          </div>

          {/* Total Costs (COGS + Expenses) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              COGS & Operating Expenses
            </span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {formatCurrency(report.estimated_cogs + report.operating_expenses)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Food: {formatCurrency(report.estimated_cogs)} | Ops: {formatCurrency(report.operating_expenses)}
            </div>
          </div>

          {/* Estimated Net Profit */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Estimated Net Profit
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {profitMargin}% margin
              </span>
            </div>
            <div className={`text-2xl font-bold mt-1 font-mono ${
              report.estimated_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
            }`}>
              {formatCurrency(report.estimated_profit)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Actual Net Revenue - (COGS + Expenses)
            </div>
          </div>
        </div>
      )}

      {/* Revenue Trend Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
          Historical Daily Sales Volume
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Committed final payments and order totals across selected timeline
        </p>

        <div className="h-64 sm:h-72 w-full">
          {report?.daily_trends && report.daily_trends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={report.daily_trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                  formatter={(val: any) => [`$${val}`, 'Sales Total']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No sales recorded for this date range.
            </div>
          )}
        </div>
      </div>

      {/* Detailed P&L Financial Ledger Table */}
      {report && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Profit & Loss Summary Breakdown
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Gross Menu Sales</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(report.gross_sales)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-rose-600">
              <span>Less: Customer Discounts & Vouchers</span>
              <span className="font-mono font-semibold">-{formatCurrency(report.total_discounts)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400">
              <span>Plus: Sales Taxes Collected ({report.total_taxes > 0 ? 'State/GST' : 'Standard'})</span>
              <span className="font-mono">+{formatCurrency(report.total_taxes)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-slate-600 dark:text-slate-400">
              <span>Plus: Service Charges (Dine-In Hospitality)</span>
              <span className="font-mono">+{formatCurrency(report.total_service_charges)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-rose-600">
              <span>Less: Processed Refunds & Chargebacks</span>
              <span className="font-mono font-semibold">-{formatCurrency(report.total_refunds)}</span>
            </div>

            <div className="py-3 flex justify-between text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 px-2 rounded-xl">
              <span>Actual Net Sales Collected:</span>
              <span className="font-mono">{formatCurrency(report.actual_revenue)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-amber-700 dark:text-amber-400">
              <span>Cost of Goods Sold (Recipe Ingredient Consumption)</span>
              <span className="font-mono font-semibold">-{formatCurrency(report.estimated_cogs)}</span>
            </div>

            <div className="py-2.5 flex justify-between text-amber-700 dark:text-amber-400">
              <span>Operating Expenses (Rent, Payroll, Utilities, Supplies)</span>
              <span className="font-mono font-semibold">-{formatCurrency(report.operating_expenses)}</span>
            </div>

            <div className="py-3.5 flex justify-between text-base font-extrabold text-slate-900 dark:text-white bg-emerald-50/60 dark:bg-emerald-950/30 px-3 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <span>ESTIMATED NET OPERATING PROFIT:</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(report.estimated_profit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
