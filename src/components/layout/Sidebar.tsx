import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  ListOrdered,
  ChefHat,
  Grid,
  UtensilsCrossed,
  Boxes,
  BookOpen,
  Truck,
  Receipt,
  BarChart3,
  DollarSign,
  Users,
  Settings,
  History,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onToggle }) => {
  const { user } = useAuth();
  const role = user?.role || 'admin';

  // Define nav sections and permission filters
  const navSections = [
    {
      title: 'Operations',
      items: [
        { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'kitchen', 'inventory'] },
        { id: 'pos', label: 'Point of Sale (POS)', icon: ShoppingBag, roles: ['admin', 'manager', 'cashier'] },
        { id: 'orders', label: 'Orders Management', icon: ListOrdered, roles: ['admin', 'manager', 'cashier', 'kitchen'] },
        { id: 'kds', label: 'Kitchen Display (KDS)', icon: ChefHat, badge: 'Live', roles: ['admin', 'manager', 'kitchen'] },
        { id: 'tables', label: 'Dining Tables', icon: Grid, roles: ['admin', 'manager', 'cashier'] },
      ],
    },
    {
      title: 'Menu & Stock Control',
      items: [
        { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed, roles: ['admin', 'manager', 'kitchen'] },
        { id: 'inventory', label: 'Inventory & Stock', icon: Boxes, roles: ['admin', 'manager', 'inventory'] },
        { id: 'recipes', label: 'Recipe Formulation', icon: BookOpen, roles: ['admin', 'manager', 'kitchen', 'inventory'] },
        { id: 'suppliers', label: 'Suppliers & POs', icon: Truck, roles: ['admin', 'manager', 'inventory'] },
      ],
    },
    {
      title: 'Billing & Financials',
      items: [
        { id: 'billing', label: 'Invoices & Payments', icon: Receipt, roles: ['admin', 'manager', 'cashier'] },
        { id: 'reports', label: 'P&L Sales Analytics', icon: BarChart3, roles: ['admin', 'manager'] },
        { id: 'expenses', label: 'Operating Expenses', icon: DollarSign, roles: ['admin', 'manager'] },
      ],
    },
    {
      title: 'System & Security',
      items: [
        { id: 'users', label: 'Staff & Roles', icon: Users, roles: ['admin'] },
        { id: 'settings', label: 'Restaurant Settings', icon: Settings, roles: ['admin', 'manager'] },
        { id: 'audit', label: 'Audit Trail Logs', icon: History, roles: ['admin'] },
      ],
    },
  ];

  return (
    <aside
      className={`fixed lg:static top-0 bottom-0 left-0 z-40 bg-slate-900 text-slate-100 border-r border-slate-800 transition-all duration-300 flex flex-col ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          {isOpen && (
            <div className="truncate">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent font-serif">
                SAVORIA
              </span>
              <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                RMS Enterprise
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section) => {
          // Filter items allowed for user role
          const allowedItems = section.items.filter((item) => item.roles.includes(role));
          if (allowedItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {isOpen && (
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-1">
                  {section.title}
                </div>
              )}
              {allowedItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title={!isOpen ? item.label : undefined}
                  >
                    <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                    {isOpen && <span className="truncate flex-1 text-left">{item.label}</span>}
                    {isOpen && item.badge && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Active pip */}
                    {isActive && !isOpen && (
                      <span className="absolute right-1 w-1.5 h-1.5 rounded-full bg-orange-400" />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer System Status */}
      {isOpen && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/20 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              DB Synced & Active
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v2.4.0</span>
          </div>
        </div>
      )}
    </aside>
  );
};
