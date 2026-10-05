import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Topbar } from './components/Topbar.tsx';
import { POSBillingModal } from './components/POSBillingModal.tsx';
import { RecordPaymentModal } from './components/RecordPaymentModal.tsx';

// Pages
import { Dashboard } from './pages/Dashboard.tsx';
import { BillingPOS } from './pages/BillingPOS.tsx';
import { DueManagement } from './pages/DueManagement.tsx';
import { Customers } from './pages/Customers.tsx';
import { ServicesCatalog } from './pages/ServicesCatalog.tsx';
import { OnlineApplications } from './pages/OnlineApplications.tsx';
import { PrintingOrders } from './pages/PrintingOrders.tsx';
import { PhotoServices } from './pages/PhotoServices.tsx';
import { DesignServices } from './pages/DesignServices.tsx';
import { StudentServices } from './pages/StudentServices.tsx';
import { Expenses } from './pages/Expenses.tsx';
import { Inventory } from './pages/Inventory.tsx';
import { StaffManagement } from './pages/StaffManagement.tsx';
import { Reports } from './pages/Reports.tsx';
import { ActivityLogs } from './pages/ActivityLogs.tsx';
import { Settings } from './pages/Settings.tsx';
import { BackupRestore } from './pages/BackupRestore.tsx';

import { Customer, Invoice } from './types/index.ts';
import { LoginScreen } from './components/LoginScreen.tsx';

function AuthenticatedApp() {
  const { fetchApi } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Modals
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [posCustomer, setPosCustomer] = useState<Customer | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

  // Notification badges
  const [notifications, setNotifications] = useState({
    dues: 0,
    apps: 0,
    lowStock: 0,
  });

  const loadNotifications = async () => {
    try {
      const res = await fetchApi('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setNotifications({
          dues: data.summary?.totalDues > 0 ? 1 : 0,
          apps: data.summary?.pendingApplicationsCount || 0,
          lowStock: data.summary?.lowStockCount || 0,
        });
      }
    } catch (e) {
      console.warn('Failed to load notification badges:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30 sec polling
    return () => clearInterval(interval);
  }, []);

  const openPOSWithCustomer = (cust: Customer) => {
    setPosCustomer(cust);
    setIsPOSOpen(true);
  };

  const openRecordPaymentForCustomer = async (cust: Customer) => {
    try {
      // Find latest unpaid invoice for customer
      const res = await fetchApi(`/api/customers/${cust.id}`);
      if (res.ok) {
        const cData = await res.json();
        const dueInv = cData.invoices?.find((i: any) => parseFloat(i.dueAmount || '0') > 0);
        if (dueInv) {
          setPaymentModalInvoice(dueInv);
        } else {
          setCurrentTab('dues');
        }
      }
    } catch (e) {
      setCurrentTab('dues');
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Dashboard Overview';
      case 'billing': return 'POS & Invoices';
      case 'dues': return 'Due Management';
      case 'customers': return 'Customer Management';
      case 'services': return 'Digital Service Catalog';
      case 'applications': return 'Online Application Tracking';
      case 'printing': return 'Printing & Photocopy Orders';
      case 'photos': return 'Studio Photo Services';
      case 'design': return 'Graphic & Design Pipeline';
      case 'students': return 'Academic & Student Services';
      case 'expenses': return 'Shop Expense Register';
      case 'inventory': return 'Inventory & Supplies';
      case 'staff': return 'Staff & Operators';
      case 'reports': return 'Financial Analytics & Profit Reports';
      case 'logs': return 'System Activity Logs';
      case 'settings': return 'Shop Profile & Settings';
      case 'backup': return 'Database Backup & Restore';
      default: return 'DIGI DIGITAL SEWA';
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
        pendingDueCount={notifications.dues}
        pendingAppsCount={notifications.apps}
        lowStockCount={notifications.lowStock}
      />

      {/* Main container offset by sidebar on lg screens */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        {/* Topbar header */}
        <Topbar
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenPOS={() => {
            setPosCustomer(null);
            setIsPOSOpen(true);
          }}
          activeTabTitle={getTabTitle()}
          notifications={notifications}
          onNavigateTab={(tab) => setCurrentTab(tab)}
        />

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              onOpenPOS={() => {
                setPosCustomer(null);
                setIsPOSOpen(true);
              }}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onQuickAction={(action) => {
                if (action === 'newCustomer') setCurrentTab('customers');
              }}
            />
          )}

          {currentTab === 'billing' && (
            <BillingPOS
              onOpenPOS={() => {
                setPosCustomer(null);
                setIsPOSOpen(true);
              }}
              onRecordPaymentForInvoice={(inv) => setPaymentModalInvoice(inv)}
            />
          )}

          {currentTab === 'dues' && <DueManagement />}

          {currentTab === 'customers' && (
            <Customers
              onOpenPOSForCustomer={openPOSWithCustomer}
              onRecordPaymentForCustomer={openRecordPaymentForCustomer}
            />
          )}

          {currentTab === 'services' && (
            <ServicesCatalog
              onOpenPOS={() => {
                setPosCustomer(null);
                setIsPOSOpen(true);
              }}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'applications' && <OnlineApplications />}

          {currentTab === 'printing' && <PrintingOrders />}

          {currentTab === 'photos' && <PhotoServices />}

          {currentTab === 'design' && <DesignServices />}

          {currentTab === 'students' && <StudentServices />}

          {currentTab === 'expenses' && <Expenses />}

          {currentTab === 'inventory' && <Inventory />}

          {currentTab === 'staff' && <StaffManagement />}

          {currentTab === 'reports' && <Reports />}

          {currentTab === 'logs' && <ActivityLogs />}

          {currentTab === 'settings' && <Settings />}

          {currentTab === 'backup' && <BackupRestore />}
        </main>
      </div>

      {/* Global POS Billing Modal */}
      <POSBillingModal
        isOpen={isPOSOpen}
        onClose={() => {
          setIsPOSOpen(false);
          setPosCustomer(null);
        }}
        initialCustomer={posCustomer}
        onSuccess={() => {
          loadNotifications();
        }}
      />

      {/* Global Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentModalInvoice}
        onClose={() => setPaymentModalInvoice(null)}
        invoice={paymentModalInvoice}
        onSuccess={() => {
          loadNotifications();
        }}
      />
    </div>
  );
}

function AppContent() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-xl animate-pulse mb-3">
          DS
        </div>
        <p className="text-sm font-bold tracking-wide">DIGI DIGITAL SEWA</p>
        <p className="text-xs text-slate-400 mt-1">Starting secure shop terminal...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen />;
  }

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
