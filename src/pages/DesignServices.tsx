import React, { useState, useEffect } from 'react';
import { Palette, PlusCircle, Clock, CheckCircle2 } from 'lucide-react';
import { DesignOrder } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const DesignServices: React.FC = () => {
  const { fetchApi } = useAuth();
  const [orders, setOrders] = useState<DesignOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [designType, setDesignType] = useState('Visiting Card');
  const [requirements, setRequirements] = useState('');
  const [price, setPrice] = useState('300');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/orders/design');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load design orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !requirements) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/orders/design', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerMobile,
          designType,
          requirements,
          price,
          deliveryDate,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setCustomerName('');
        setRequirements('');
        setNotes('');
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to create design order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetchApi(`/api/orders/design/${id}/status`, {
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
            <Palette className="w-5 h-5 text-indigo-600" />
            <span>Graphic & Design Services Pipeline</span>
          </h2>
          <p className="text-xs text-slate-500">
            Visiting cards, employee ID cards, certificates, letterheads and invitations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Design Order</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Design Type</th>
                <th className="py-3 px-4">Requirements</th>
                <th className="py-3 px-4">Target Delivery</th>
                <th className="py-3 px-4 text-right">Price (NPR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Assigned Designer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">Loading design orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">No design orders active.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{o.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{o.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-900">{o.designType}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-56 truncate" title={o.requirements}>
                      {o.requirements}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {o.deliveryDate || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      Rs. {parseFloat(o.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white focus:outline-none"
                      >
                        {['Pending', 'Designing', 'Review', 'Completed', 'Delivered', 'Cancelled'].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{o.assignedStaffName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Design Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Create Graphic Design Order</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Customer Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Design Type</label>
                  <select
                    value={designType}
                    onChange={(e) => setDesignType(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Visiting Card">Visiting Card</option>
                    <option value="ID Card">ID Card</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Letterhead">Letterhead</option>
                    <option value="Invitation Card">Invitation Card</option>
                    <option value="Banner/Flyer">Flex Banner / Flyer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Price (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Design Requirements & Copy *</label>
                <textarea
                  rows={3}
                  placeholder="Details for design: Business name, slogans, colors, phone, QR code requirements..."
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Expected Delivery Date</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Design Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
