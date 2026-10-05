import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';
import { Invoice } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const { fetchApi } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !invoice) return null;

  const currentDue = parseFloat(invoice.dueAmount || '0');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const payNum = parseFloat(amount);
    if (isNaN(payNum) || payNum <= 0) {
      setErrorMsg('Please enter a valid payment amount.');
      return;
    }

    if (payNum > currentDue) {
      setErrorMsg(`Amount cannot exceed the current due of Rs. ${currentDue.toFixed(2)}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        body: JSON.stringify({
          amount: payNum,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record payment');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Record Due Clearance Payment</h3>
              <p className="text-[11px] text-slate-400">Invoice: {invoice.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Bill:</span>
              <span className="font-mono font-bold">Rs. {parseFloat(invoice.grandTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Already Paid:</span>
              <span className="font-mono text-emerald-700 font-bold">Rs. {parseFloat(invoice.paidAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-rose-700">
              <span>Pending Due:</span>
              <span className="font-mono">Rs. {currentDue.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Payment Amount (NPR) *</label>
              <button
                type="button"
                onClick={() => setAmount(currentDue.toString())}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Pay Full Due (Rs. {currentDue})
              </button>
            </div>
            <input
              type="number"
              step="any"
              min="1"
              max={currentDue}
              placeholder={currentDue.toString()}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full p-2.5 text-base font-mono font-bold border border-emerald-400 rounded-lg bg-emerald-50/40 text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method *</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {['Cash', 'eSewa', 'Khalti', 'Bank Transfer', 'Card'].map((pm) => (
                <button
                  key={pm}
                  type="button"
                  onClick={() => setPaymentMethod(pm)}
                  className={`py-1.5 px-2 rounded-lg font-semibold border text-center transition-all ${
                    paymentMethod === pm
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Reference / Transaction ID</label>
            <input
              type="text"
              placeholder="e.g. eSewa / Bank txn code (optional)"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all disabled:bg-slate-300"
            >
              {isSubmitting ? 'Recording...' : 'Accept Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
