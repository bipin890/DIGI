import React, { useState, useEffect } from 'react';
import { Wallet, PlusCircle, Search, Calendar, FileSpreadsheet } from 'lucide-react';
import { Expense } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const Expenses: React.FC = () => {
  const { fetchApi } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const [category, setCategory] = useState('Printing Paper');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Printing Paper',
    'Ink/Toner',
    'Internet',
    'Electricity',
    'Rent',
    'Stationery',
    'Equipment',
    'Maintenance',
    'Refreshment',
    'Other'
  ];

  const loadExpenses = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/expenses');
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          description,
          amount: parseFloat(amount),
          date,
          paymentMethod,
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setDescription('');
        setAmount('');
        setNotes('');
        await loadExpenses();
      }
    } catch (err) {
      console.error('Failed to create expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = expenses.filter((e) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-600" />
            <span>Shop Expense Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track cyber cafe utility bills, paper reams, printer ink cartridges & daily refreshments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-right">
            <span className="text-[10px] uppercase font-bold text-rose-700">Total Recorded</span>
            <p className="text-base font-black font-mono text-rose-950">
              Rs. {totalExpense.toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-98 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4 text-right">Amount (NPR)</th>
                <th className="py-3 px-4">Added By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">Loading expenses...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">No expense records found.</td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 text-slate-600 font-mono font-semibold">{e.date}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-rose-900 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.description}</td>
                    <td className="py-3 px-4 text-slate-600">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-rose-700 text-sm">
                      Rs. {parseFloat(e.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{e.addedByName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Record Shop Expense</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description *</label>
                <input
                  type="text"
                  placeholder="e.g. Bought 5 reams JK Copier A4 Paper from stationery..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Amount (NPR) *</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    placeholder="2100"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Expense Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Payment Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
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
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Recording...' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
