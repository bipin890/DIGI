import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  PlusCircle,
  Printer,
  CreditCard,
  Ban,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X
} from 'lucide-react';
import { Invoice } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { InvoicePrintView } from '../components/InvoicePrintView.tsx';

interface BillingPOSProps {
  onOpenPOS: () => void;
  onRecordPaymentForInvoice: (invoice: Invoice) => void;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  onOpenPOS,
  onRecordPaymentForInvoice,
}) => {
  const { fetchApi, isAdmin } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundModalInvoice, setRefundModalInvoice] = useState<Invoice | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (paymentMethodFilter !== 'all') params.append('paymentMethod', paymentMethodFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetchApi(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchTerm, statusFilter, paymentMethodFilter, dateFilter]);

  const viewInvoiceReceipt = async (inv: Invoice) => {
    try {
      const res = await fetchApi(`/api/invoices/${inv.id}`);
      if (res.ok) {
        const fullInv = await res.json();
        setSelectedInvoiceForPrint({
          ...fullInv.invoice,
          items: fullInv.items,
          payments: fullInv.payments,
        });
      }
    } catch (e) {
      console.error('Failed to load invoice receipt:', e);
    }
  };

  const handleCancelInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalInvoice || !cancelReason.trim()) return;

    try {
      setIsProcessing(true);
      setActionError('');
      const res = await fetchApi(`/api/invoices/${cancelModalInvoice.id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ cancelReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to cancel invoice');
      }
      setCancelModalInvoice(null);
      setCancelReason('');
      await loadInvoices();
    } catch (err: any) {
      setActionError(err.message || 'Error cancelling invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefundInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalInvoice) return;

    try {
      setIsProcessing(true);
      setActionError('');
      const res = await fetchApi(`/api/invoices/${refundModalInvoice.id}/refund`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(refundAmount),
          reason: refundReason,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process refund');
      }
      setRefundModalInvoice(null);
      setRefundAmount('');
      setRefundReason('');
      await loadInvoices();
    } catch (err: any) {
      setActionError(err.message || 'Error processing refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Mobile', 'Grand Total', 'Paid', 'Due', 'Payment Method', 'Status', 'Staff'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      new Date(i.createdAt).toISOString().split('T')[0],
      `"${i.customerName}"`,
      i.customerMobile,
      i.grandTotal,
      i.paidAmount,
      i.dueAmount,
      i.paymentMethod,
      i.status,
      `"${i.staffName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGS_Invoices_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Billing & POS Invoices</h2>
          <p className="text-xs text-slate-500">
            Create, search, reprint receipts and manage customer payments
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
            onClick={onOpenPOS}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create New Bill</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, customer name, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial (Has Due)</option>
              <option value="Due">Due</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="eSewa">eSewa</option>
              <option value="Khalti">Khalti</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
              title="Filter by specific invoice date"
            />
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No invoices match your filter criteria.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(inv.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {inv.customerMobile}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="font-semibold">{inv.paymentMethod}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                      Rs. {parseFloat(inv.grandTotal).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      Rs. {parseFloat(inv.paidAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {parseFloat(inv.dueAmount) > 0 ? (
                        <span className="text-rose-600">Rs. {parseFloat(inv.dueAmount).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        inv.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                        inv.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                        inv.status === 'Refunded' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View & Print */}
                        <button
                          onClick={() => viewInvoiceReceipt(inv)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          title="View & Print Bill Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Pay Due */}
                        {parseFloat(inv.dueAmount) > 0 && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => onRecordPaymentForInvoice(inv)}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                            title="Collect Due Payment"
                          >
                            Pay Due
                          </button>
                        )}

                        {/* Admin Cancel / Void */}
                        {isAdmin && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => setCancelModalInvoice(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Admin: Cancel Invoice"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin Refund */}
                        {isAdmin && parseFloat(inv.paidAmount) > 0 && inv.status !== 'Cancelled' && (
                          <button
                            onClick={() => {
                              setRefundModalInvoice(inv);
                              setRefundAmount(inv.paidAmount);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Admin: Process Refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">Printable Customer Bill</span>
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <InvoicePrintView invoice={selectedInvoiceForPrint} />

            <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedInvoiceForPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Cancel Invoice Modal */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <Ban className="w-4 h-4" />
              <span>Cancel Invoice {cancelModalInvoice.invoiceNumber}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Cancelling will reverse customer balances and mark this invoice as void. This action is permanently audited.
            </p>

            <form onSubmit={handleCancelInvoice} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Reason for Cancellation *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Customer changed mind, incorrect service selected by staff..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  required
                />
              </div>

              {actionError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded-lg">{actionError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg"
                >
                  {isProcessing ? 'Cancelling...' : 'Confirm Void Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Refund Modal */}
      {refundModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Process Refund for {refundModalInvoice.invoiceNumber}</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Customer: <strong>{refundModalInvoice.customerName}</strong> • Paid Amount: Rs. {refundModalInvoice.paidAmount}
            </p>

            <form onSubmit={handleRefundInvoice} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Refund Amount (NPR) *</label>
                <input
                  type="number"
                  step="any"
                  max={refundModalInvoice.paidAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="mt-1 w-full p-2 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Reason for Refund *</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Govt portal rejection, service could not be fulfilled..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  required
                />
              </div>

              {actionError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded-lg">{actionError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalInvoice(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-lg"
                >
                  {isProcessing ? 'Refunding...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
