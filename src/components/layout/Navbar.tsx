import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import { UserRole } from '../../types';
import { api } from '../../services/api';
import {
  Sun,
  Moon,
  Bell,
  ChefHat,
  ShieldCheck,
  Briefcase,
  CreditCard,
  Package,
  Menu,
  ChevronDown,
  AlertTriangle,
  Clock,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const roleConfigs: Record<UserRole, { label: string; icon: any; color: string; bg: string }> = {
  admin: { label: 'Admin / Owner', icon: ShieldCheck, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800' },
  manager: { label: 'Floor Manager', icon: Briefcase, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800' },
  cashier: { label: 'POS Cashier', icon: CreditCard, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800' },
  kitchen: { label: 'Head Chef / KDS', icon: ChefHat, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800' },
  inventory: { label: 'Stock Lead', icon: Package, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200 dark:border-cyan-800' },
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, activeTab, setActiveTab }) => {
  const { user, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [alerts, setAlerts] = useState<{ lowStock: any[]; pendingOrders: number }>({ lowStock: [], pendingOrders: 0 });

  useEffect(() => {
    async function loadAlerts() {
      try {
        const summary = await api.getDashboardSummary();
        setAlerts({
          lowStock: summary.low_stock_items || [],
          pendingOrders: summary.metrics.pending_orders || 0,
        });
      } catch (err) {
        console.error('Failed to load alert badges:', err);
      }
    }
    loadAlerts();
    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const currentRole = user?.role || 'admin';
  const roleInfo = roleConfigs[currentRole];
  const CurrentRoleIcon = roleInfo.icon;

  const totalAlertsCount = alerts.lowStock.length + (alerts.pendingOrders > 0 ? 1 : 0);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            {settings?.name || 'Savoria Bistro & Lounge'}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
              Live Operations
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Switcher for Test Drive */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium shadow-sm transition-all hover:ring-2 hover:ring-orange-500/20 ${roleInfo.bg}`}
          >
            <CurrentRoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
            <span className="hidden md:inline text-slate-700 dark:text-slate-200">{roleInfo.label}</span>
            <span className="md:hidden text-slate-700 dark:text-slate-200 font-semibold">{currentRole.toUpperCase()}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
                  <span>Switch Staff Role</span>
                  <Sparkles className="w-3 h-3 text-orange-500" />
                </div>
                <div className="py-1">
                  {(Object.keys(roleConfigs) as UserRole[]).map((r) => {
                    const cfg = roleConfigs[r];
                    const Icon = cfg.icon;
                    const isActive = currentRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          switchRole(r);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <div className="flex-1">
                          <div>{cfg.label}</div>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Alerts / Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
            title="System Alerts"
          >
            <Bell className="w-5 h-5" />
            {totalAlertsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
            )}
          </button>

          {showNotificationMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotificationMenu(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Operational Alerts</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                    {totalAlertsCount} active
                  </span>
                </div>

                <div className="mt-2 space-y-2 max-h-72 overflow-y-auto">
                  {alerts.pendingOrders > 0 && (
                    <div
                      onClick={() => {
                        setActiveTab('orders');
                        setShowNotificationMenu(false);
                      }}
                      className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span>{alerts.pendingOrders} Pending Kitchen Orders</span>
                      </div>
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                        Orders require chef confirmation and recipe stock deduction.
                      </p>
                    </div>
                  )}

                  {alerts.lowStock.length > 0 ? (
                    alerts.lowStock.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setActiveTab('inventory');
                          setShowNotificationMenu(false);
                        }}
                        className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 font-medium">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            {item.name}
                          </span>
                          <span className="font-bold text-[11px]">
                            {item.current_stock} {item.unit} left
                          </span>
                        </div>
                        <p className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-0.5">
                          Threshold is {item.min_stock_level} {item.unit}. Restock advised.
                        </p>
                      </div>
                    ))
                  ) : (
                    alerts.pendingOrders === 0 && (
                      <div className="py-6 text-center text-slate-400">
                        <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-1 opacity-70" />
                        <p className="text-xs">All systems healthy. No active alerts.</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>

        {/* User Info / Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {user?.name || 'Staff User'}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
              {user?.role || 'Staff'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
