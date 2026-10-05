import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Wallet,
  Users,
  CreditCard,
  FileText,
  Printer,
  Camera,
  Palette,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardProps {
  onOpenPOS: () => void;
  onNavigateTab: (tab: string) => void;
  onQuickAction: (action: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenPOS,
  onNavigateTab,
  onQuickAction,
}) => {
  const { fetchApi, isAdmin } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/dashboard/stats');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const summary = data?.summary || {
    todaySales: 0,
    todayPaid: 0,
    todayExpenses: 0,
    todayProfit: 0,
    totalSales: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalDues: 0,
    customersToday: 0,
    totalCustomers: 0,
    pendingApplicationsCount: 0,
    pendingOrdersCount: 0,
    lowStockCount: 0,
  };

  const chartDays = data?.charts?.last7Days || [];
  const maxSaleInChart = Math.max(...chartDays.map((d: any) => d.sales), 100);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              DIGI DIGITAL SEWA Overview
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Live Operations
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time daily POS, application tracking & cyber service metrics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onOpenPOS}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Bill (POS)</span>
          </button>
        </div>
      </div>

      {/* 8 Primary Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Today's Sales</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-2">
            Rs. {summary.todaySales.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Collected: <span className="font-semibold text-emerald-600">Rs. {summary.todayPaid.toFixed(2)}</span>
          </p>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Today's Expenses</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-2">
            Rs. {summary.todayExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Paper, tea, bills</p>
        </div>

        {/* Today's Net Profit */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Today's Profit</span>
            <div className={`p-1.5 rounded-lg ${summary.todayProfit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg sm:text-2xl font-black font-mono mt-2 ${
            summary.todayProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
          }`}>
            Rs. {summary.todayProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Income - Expenses</p>
        </div>

        {/* Pending Customer Dues */}
        <div
          onClick={() => onNavigateTab('dues')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold group-hover:text-amber-700">Total Dues</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-amber-700 font-mono mt-2">
            Rs. {summary.totalDues.toFixed(2)}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1 flex items-center gap-1">
            <span>View Due List</span>
            <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

        {/* Customers Today */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Customers Today</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-slate-900 font-mono mt-2">
            {summary.customersToday}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Total in system: <span className="font-semibold">{summary.totalCustomers}</span>
          </p>
        </div>

        {/* Pending Applications */}
        <div
          onClick={() => onNavigateTab('applications')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Pending Apps</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-blue-700 font-mono mt-2">
            {summary.pendingApplicationsCount}
          </p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            Passport, DOTM, Lok Sewa
          </p>
        </div>

        {/* Pending Orders (Print, Photo, Design, Student) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Pending Orders</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Printer className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-2xl font-black text-purple-700 font-mono mt-2">
            {summary.pendingOrdersCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">In printing & design pipeline</p>
        </div>

        {/* Inventory Stock Status */}
        <div
          onClick={() => onNavigateTab('inventory')}
          className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Low Stock Items</span>
            <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg sm:text-2xl font-black font-mono mt-2 ${
            summary.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {summary.lowStockCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {summary.lowStockCount > 0 ? 'Reorder needed immediately' : 'Inventory healthy'}
          </p>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Shop Counter Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            onClick={() => onQuickAction('newCustomer')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">New Customer</span>
          </button>
          <button
            onClick={onOpenPOS}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-800">Create Invoice</span>
          </button>
          <button
            onClick={() => onNavigateTab('applications')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800">New Application</span>
          </button>
          <button
            onClick={() => onNavigateTab('printing')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <Printer className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-semibold text-slate-800">Printing Order</span>
          </button>
          <button
            onClick={() => onNavigateTab('photos')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <Camera className="w-5 h-5 text-amber-600" />
            <span className="text-xs font-semibold text-slate-800">Photo Service</span>
          </button>
          <button
            onClick={() => onNavigateTab('design')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <Palette className="w-5 h-5 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800">New Design</span>
          </button>
          <button
            onClick={() => onNavigateTab('dues')}
            className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 flex flex-col items-center text-center gap-1.5 transition-all"
          >
            <CreditCard className="w-5 h-5 text-rose-600" />
            <span className="text-xs font-semibold text-slate-800">Collect Due</span>
          </button>
        </div>
      </div>

      {/* Analytics Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Chart (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales & Expense Trend</h3>
              <p className="text-xs text-slate-500">Daily financial performance</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Sales
              </span>
              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
            {chartDays.map((item: any, idx: number) => {
              const salesHeight = Math.min(100, Math.round((item.sales / maxSaleInChart) * 100));
              const expHeight = Math.min(100, Math.round((item.expenses / maxSaleInChart) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    {/* Sales bar */}
                    <div
                      style={{ height: `${Math.max(8, salesHeight)}%` }}
                      className="w-1/2 max-w-4 bg-blue-600 rounded-t-sm group-hover:bg-blue-700 transition-all relative"
                      title={`Sales: Rs. ${item.sales}`}
                    />
                    {/* Expense bar */}
                    <div
                      style={{ height: `${Math.max(6, expHeight)}%` }}
                      className="w-1/2 max-w-4 bg-rose-400 rounded-t-sm group-hover:bg-rose-500 transition-all relative"
                      title={`Expenses: Rs. ${item.expenses}`}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">
                    {item.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-slate-600">
            <span>Overall Shop Revenue: <strong className="text-slate-900 font-mono">Rs. {summary.totalSales.toFixed(2)}</strong></span>
            <span>Overall Profit: <strong className="text-emerald-700 font-mono">Rs. {summary.totalProfit.toFixed(2)}</strong></span>
          </div>
        </div>

        {/* Recent Invoices & Orders (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Transactions</h3>
              <button
                onClick={() => onNavigateTab('billing')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {data?.recent?.invoices?.map((inv: any) => (
                <div
                  key={inv.id}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 font-mono">{inv.invoiceNumber}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                        inv.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {inv.customerName} • {inv.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 font-mono">Rs. {parseFloat(inv.grandTotal).toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {(!data?.recent?.invoices || data.recent.invoices.length === 0) && (
                <p className="py-6 text-center text-xs text-slate-400">No invoices recorded yet.</p>
              )}
            </div>
          </div>

          {/* Pending Applications Box */}
          {data?.recent?.applications?.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-800">Pending Govt Applications</span>
                <button
                  onClick={() => onNavigateTab('applications')}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  Track ({data.recent.applications.length})
                </button>
              </div>
              <div className="space-y-1 text-xs">
                {data.recent.applications.slice(0, 2).map((app: any) => (
                  <div key={app.id} className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-blue-950 text-[11px]">{app.customerName}</p>
                      <p className="text-[10px] text-blue-700">{app.serviceName}</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
