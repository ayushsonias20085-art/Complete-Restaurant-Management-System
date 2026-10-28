import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { ReceiptModal } from './components/layout/ReceiptModal';
import { api } from './services/api';
import { Invoice } from './types';

// Pages
import { Dashboard } from './pages/Dashboard';
import { PosCreateOrder } from './pages/PosCreateOrder';
import { OrdersList } from './pages/OrdersList';
import { KitchenDisplay } from './pages/KitchenDisplay';
import { MenuManagement } from './pages/MenuManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { RecipeManagement } from './pages/RecipeManagement';
import { SupplierManagement } from './pages/SupplierManagement';
import { BillingInvoices } from './pages/BillingInvoices';
import { FinancialReports } from './pages/FinancialReports';
import { ExpenseManagement } from './pages/ExpenseManagement';
import { TablesManagement } from './pages/TablesManagement';
import { UserManagement } from './pages/UserManagement';
import { RestaurantSettings } from './pages/RestaurantSettings';
import { AuditLogs } from './pages/AuditLogs';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Receipt Modal state
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const handleOpenReceipt = async (invoiceId: number) => {
    try {
      const detailed = await api.getInvoice(invoiceId);
      setReceiptInvoice(detailed);
      setIsReceiptOpen(true);
    } catch (err) {
      console.error('Failed to load invoice receipt:', err);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'pos':
        return <PosCreateOrder setActiveTab={setActiveTab} onOpenReceipt={handleOpenReceipt} />;
      case 'orders':
        return <OrdersList setActiveTab={setActiveTab} onOpenReceipt={handleOpenReceipt} />;
      case 'kds':
        return <KitchenDisplay />;
      case 'tables':
        return <TablesManagement setActiveTab={setActiveTab} />;
      case 'menu':
        return <MenuManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'recipes':
        return <RecipeManagement />;
      case 'suppliers':
        return <SupplierManagement />;
      case 'billing':
        return <BillingInvoices onOpenReceipt={handleOpenReceipt} />;
      case 'reports':
        return <FinancialReports />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <RestaurantSettings />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Collapsible Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        invoice={receiptInvoice}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
