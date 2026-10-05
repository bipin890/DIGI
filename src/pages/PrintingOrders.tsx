import React, { useState, useEffect } from 'react';
import {
  Printer,
  PlusCircle,
  Clock,
  CheckCircle2,
  Edit2,
  FileText,
  Search,
  Filter
} from 'lucide-react';
import { PrintingOrder } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const PrintingOrders: React.FC = () => {
  const { fetchApi } = useAuth();
  const [orders, setOrders] = useState<PrintingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  // New order form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [printType, setPrintType] = useState<'B/W' | 'Color' | 'Photocopy' | 'Scanning' | 'Lamination'>('B/W');
  const [pages, setPages] = useState('1');
  const [copies, setCopies] = useState('1');
  const [paperSize, setPaperSize] = useState('A4');
  const [rate, setRate] = useState('5');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi(`/api/orders/printing?status=${statusFilter}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load printing orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  // Adjust rate default when print type changes
  useEffect(() => {
    if (printType === 'B/W' || printType === 'Photocopy') setRate('5');
    else if (printType === 'Color') setRate('15');
    else if (printType === 'Scanning') setRate('10');
    else if (printType === 'Lamination') setRate('30');
  }, [printType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !documentName) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/orders/printing', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerMobile,
          documentName,
          printType,
          pages: parseInt(pages || '1', 10),
          copies: parseInt(copies || '1', 10),
          paperSize,
          rate: parseFloat(rate || '5'),
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setCustomerName('');
        setDocumentName('');
        setNotes('');
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to create order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      const res = await fetchApi(`/api/orders/printing/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-purple-600" />
            <span>Printing & Document Job Orders</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track laser B/W, Color print jobs, photocopying, scanning & lamination
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Printing Order</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600">Filter Status:</span>
        <div className="flex gap-1.5">
          {['all', 'Pending', 'Printing', 'Completed', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Pages & Copies</th>
                <th className="py-3 px-4 text-right">Total (NPR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">No printing orders recorded.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{o.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{o.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">{o.documentName}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {o.printType} ({o.paperSize})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {o.pages} pgs x {o.copies} copies @ Rs. {o.rate}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      Rs. {parseFloat(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none ${
                          o.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          o.status === 'Delivered' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          o.status === 'Printing' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                      >
                        {['Pending', 'Printing', 'Completed', 'Delivered', 'Cancelled'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{o.staffName}</td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Printing Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Create Printing Order</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Document Name / File *</label>
                <input
                  type="text"
                  placeholder="e.g. Citizenship_Copy.pdf, Report_Final.docx"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Print Type</label>
                  <select
                    value={printType}
                    onChange={(e) => setPrintType(e.target.value as any)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="B/W">B/W Laser</option>
                    <option value="Color">Color Inkjet</option>
                    <option value="Photocopy">Photocopy</option>
                    <option value="Scanning">Document Scan</option>
                    <option value="Lamination">Lamination</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Paper Size</label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="A4">A4</option>
                    <option value="Legal">Legal</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Pages</label>
                  <input
                    type="number"
                    min="1"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Rate (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-bold">
                <span>Calculated Total:</span>
                <span className="text-base text-purple-700 font-mono">
                  Rs. {(parseInt(pages || '1', 10) * parseInt(copies || '1', 10) * parseFloat(rate || '5')).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
