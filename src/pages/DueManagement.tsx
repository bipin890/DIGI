import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Receipt
} from 'lucide-react';
import { Invoice } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { RecordPaymentModal } from '../components/RecordPaymentModal.tsx';

export const DueManagement: React.FC = () => {
  const { fetchApi } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState<Invoice | null>(null);

  const loadDueInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/invoices');
      if (res.ok) {
        const all: Invoice[] = await res.json();
        // Filter only invoices with due amount > 0 and not cancelled
        const dueList = all.filter(
          (inv) => parseFloat(inv.dueAmount || '0') > 0 && inv.status !== 'Cancelled'
        );
        setInvoices(dueList);
      }
    } catch (err) {
      console.error('Failed to load dues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDueInvoices();
  }, []);

  const filtered = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      inv.customerName.toLowerCase().includes(q) ||
      inv.customerMobile.includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q)
    );
  });

  const totalOutstandingDue = invoices.reduce(
    (sum, i) => sum + parseFloat(i.dueAmount || '0'),
    0
  );

  return (
    <div className="space-y-4">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <span>Customer Due & Credit Tracking</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track unpaid balances, record partial/full collections and print receipts
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500 text-white">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-800">Total Outstanding</span>
            <p className="text-lg font-black font-mono text-amber-950">
              Rs. {totalOutstandingDue.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile number or invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Due Invoices List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Date Issued</th>
                <th className="py-3 px-4 text-right">Total Bill</th>
                <th className="py-3 px-4 text-right">Already Paid</th>
                <th className="py-3 px-4 text-right text-rose-700">Due Amount</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Loading pending dues...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No Pending Customer Dues!</p>
                    <p className="text-[11px] text-slate-400">All invoices are fully paid.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {inv.customerMobile}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      Rs. {parseFloat(inv.grandTotal).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      Rs. {parseFloat(inv.paidAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600 text-sm">
                      Rs. {parseFloat(inv.dueAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {inv.staffName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForPay(inv)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs active:scale-98 transition-all inline-flex items-center gap-1"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedInvoiceForPay}
        onClose={() => setSelectedInvoiceForPay(null)}
        invoice={selectedInvoiceForPay}
        onSuccess={() => {
          loadDueInvoices();
        }}
      />
    </div>
  );
};
