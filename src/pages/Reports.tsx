import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Wallet, FileSpreadsheet, Printer, Calendar, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const Reports: React.FC = () => {
  const { fetchApi, isAdmin } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetchApi(`/api/reports?${params.toString()}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [startDate, endDate, isAdmin]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Restricted Module</h3>
        <p className="text-xs text-slate-500 mt-1">Financial analytics and profit reports are restricted to Owner / Admin.</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalSales: 0,
    totalPaid: 0,
    totalDue: 0,
    totalExpenses: 0,
    totalRefunds: 0,
    netProfit: 0,
    invoiceCount: 0,
  };

  const paymentMethods: Record<string, number> = data?.paymentMethods || {};
  const serviceRevenue: Record<string, { category: string; amount: number; count: number }> = data?.serviceRevenue || {};
  const staffSales: Record<string, number> = data?.staffSales || {};

  const exportCSV = () => {
    const csvRows = [
      ['Metric', 'Amount (NPR)'],
      ['Total Sales', summary.totalSales.toFixed(2)],
      ['Total Collected (Paid)', summary.totalPaid.toFixed(2)],
      ['Total Outstanding (Due)', summary.totalDue.toFixed(2)],
      ['Total Shop Expenses', summary.totalExpenses.toFixed(2)],
      ['Net Profit (Income - Expense)', summary.netProfit.toFixed(2)],
      ['Total Invoices', summary.invoiceCount],
      [],
      ['Payment Method', 'Volume (NPR)'],
      ...Object.entries(paymentMethods).map(([pm, amt]) => [pm, amt.toFixed(2)]),
      [],
      ['Service Name', 'Category', 'Volume (NPR)', 'Qty Sold'],
      ...Object.entries(serviceRevenue).map(([name, obj]) => [
        `"${name}"`,
        `"${obj.category}"`,
        obj.amount.toFixed(2),
        obj.count
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(r => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGS_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Financial Analytics & Profit Reports</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time balance sheet: Profit = Income - Expenses, service-wise revenue, and staff sales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-bold text-slate-600">Select Date Range:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="p-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Clear Range (Show All Time)
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500">Total Sales</span>
          <p className="text-lg sm:text-2xl font-black font-mono text-slate-900 mt-1">
            Rs. {summary.totalSales.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{summary.invoiceCount} invoices generated</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-emerald-700">Collected Income</span>
          <p className="text-lg sm:text-2xl font-black font-mono text-emerald-700 mt-1">
            Rs. {summary.totalPaid.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cash in bank & register</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-rose-700">Total Expenses</span>
          <p className="text-lg sm:text-2xl font-black font-mono text-rose-700 mt-1">
            Rs. {summary.totalExpenses.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Shop operational costs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-blue-700">Net Profit</span>
          <p className="text-lg sm:text-2xl font-black font-mono text-blue-700 mt-1">
            Rs. {summary.netProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Income - Expenses</p>
        </div>
      </div>

      {/* Grid: Payment Method Breakdown & Staff Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Payment Method Breakdown
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(paymentMethods).map(([pm, amt]) => {
              const pct = summary.totalSales > 0 ? (amt / summary.totalSales) * 100 : 0;
              return (
                <div key={pm} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{pm}</span>
                    <span className="font-mono text-slate-900">
                      Rs. {amt.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="bg-blue-600 h-full rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Staff Sales Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
            Counter Staff Performance
          </h3>
          <div className="space-y-2 text-xs">
            {Object.entries(staffSales).map(([sName, amt]) => (
              <div key={sName} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <span className="font-bold text-slate-800">{sName}</span>
                <span className="font-black font-mono text-slate-900 text-sm">
                  Rs. {amt.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Service-wise Revenue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Service-wise Revenue Breakdown
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Service Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Qty / Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(serviceRevenue).map(([name, obj]) => (
                <tr key={name} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-bold text-slate-900">{name}</td>
                  <td className="py-2.5 px-4 text-slate-600">{obj.category}</td>
                  <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-700">{obj.count}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-800">
                    Rs. {obj.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
