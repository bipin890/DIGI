import React, { useState, useEffect } from 'react';
import { Camera, PlusCircle, CheckCircle2, Clock } from 'lucide-react';
import { PhotoOrder } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const PhotoServices: React.FC = () => {
  const { fetchApi } = useAuth();
  const [orders, setOrders] = useState<PhotoOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [photoType, setPhotoType] = useState('Passport Size Photo');
  const [quantity, setQuantity] = useState('4');
  const [size, setSize] = useState('35x45 mm');
  const [rate, setRate] = useState('150');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/orders/photo');
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Failed to load photo orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    if (photoType === 'Passport Size Photo') {
      setSize('35x45 mm');
      setRate('150');
      setQuantity('4');
    } else if (photoType === 'Visa Size Photo') {
      setSize('2x2 inch (50x50 mm)');
      setRate('200');
      setQuantity('2');
    } else if (photoType === 'Digital Photo Print') {
      setSize('4R Glossy');
      setRate('50');
      setQuantity('1');
    }
  }, [photoType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/orders/photo', {
        method: 'POST',
        body: JSON.stringify({
          customerName,
          customerMobile,
          photoType,
          quantity: parseInt(quantity, 10),
          size,
          rate: parseFloat(rate),
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setCustomerName('');
        setCustomerMobile('');
        setNotes('');
        await loadOrders();
      }
    } catch (err) {
      console.error('Failed to create photo order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetchApi(`/api/orders/photo/${id}/status`, {
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
            <Camera className="w-5 h-5 text-amber-600" />
            <span>Studio Photo Services Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Passport size photos, US/Schengen visa photos, and digital print processing
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Photo Order</span>
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
                <th className="py-3 px-4">Photo Specification</th>
                <th className="py-3 px-4 text-center">Copies</th>
                <th className="py-3 px-4 text-right">Price (NPR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">Loading photo orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">No photo orders recorded.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{o.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{o.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">{o.photoType}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{o.size}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">
                      {o.quantity} pcs
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      Rs. {parseFloat(o.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white focus:outline-none"
                      >
                        {['Pending', 'Processing', 'Completed', 'Delivered', 'Cancelled'].map((s) => (
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

      {/* New Photo Order Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Create Studio Photo Order</h3>
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

              <div>
                <label className="block text-xs font-semibold text-slate-700">Photo Type</label>
                <select
                  value={photoType}
                  onChange={(e) => setPhotoType(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Passport Size Photo">Passport Size Photo (White/Blue bg)</option>
                  <option value="Visa Size Photo">Visa Size Photo (US / Schengen 2x2")</option>
                  <option value="Digital Photo Print">Digital Photo Print (4R / Glossy)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Price (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes / Background</label>
                <input
                  type="text"
                  placeholder="e.g. White background for Canada visa, softcopy to email..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
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
