import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  Eye,
  Edit2,
  X,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Customer } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { CustomerHistoryDrawer } from '../components/CustomerHistoryDrawer.tsx';

interface CustomersProps {
  onOpenPOSForCustomer: (cust: Customer) => void;
  onRecordPaymentForCustomer: (cust: Customer) => void;
}

export const Customers: React.FC<CustomersProps> = ({
  onOpenPOSForCustomer,
  onRecordPaymentForCustomer,
}) => {
  const { fetchApi } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Selected customer for history drawer
  const [drawerCustomerId, setDrawerCustomerId] = useState<number | null>(null);

  // Add / Edit Modal
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterType !== 'all') params.append('filter', filterType);

      const res = await fetchApi(`/api/customers?${params.toString()}`);
      if (res.ok) {
        setCustomers(await res.json());
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, filterType]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingCustomer(null);
    setFormName('');
    setFormMobile('');
    setFormAddress('');
    setFormEmail('');
    setFormNotes('');
    setFormError('');
  };

  const openEditModal = (cust: Customer) => {
    setModalMode('edit');
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormMobile(cust.mobile);
    setFormAddress(cust.address || '');
    setFormEmail(cust.email || '');
    setFormNotes(cust.notes || '');
    setFormError('');
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formMobile.trim()) {
      setFormError('Name and mobile number are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: formName.trim(),
        mobile: formMobile.trim(),
        address: formAddress.trim() || undefined,
        email: formEmail.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };

      let res: Response;
      if (modalMode === 'edit' && editingCustomer) {
        res = await fetchApi(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchApi('/api/customers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save customer');
      }

      setModalMode(null);
      await loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Error saving customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportCustomersCSV = () => {
    const headers = ['Customer Code', 'Name', 'Mobile', 'Address', 'Email', 'Total Spent', 'Paid', 'Due', 'Visits'];
    const rows = customers.map(c => [
      c.customerCode,
      `"${c.name}"`,
      c.mobile,
      `"${c.address || ''}"`,
      c.email || '',
      c.totalSpending,
      c.paidAmount,
      c.dueAmount,
      c.visitCount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGS_Customers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">Customer Management</h2>
          <p className="text-xs text-slate-500">
            View profiles, track spending, check previous visits and orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCustomersCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-98"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, mobile, address, or customer ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Customers' },
            { id: 'due', label: 'Due Balances' },
            { id: 'frequent', label: 'Frequent (2+ visits)' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === btn.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Visits</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Total Paid</th>
                <th className="py-3 px-4 text-right">Due Balance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      {c.customerCode}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <button
                        onClick={() => setDrawerCustomerId(c.id)}
                        className="hover:text-blue-600 hover:underline text-left"
                      >
                        {c.name}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {c.mobile}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-48 truncate">
                      {c.address || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {c.visitCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      Rs. {parseFloat(c.totalSpending || '0').toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      Rs. {parseFloat(c.paidAmount || '0').toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {parseFloat(c.dueAmount || '0') > 0 ? (
                        <span className="text-rose-600">Rs. {parseFloat(c.dueAmount).toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View History Drawer */}
                        <button
                          onClick={() => setDrawerCustomerId(c.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="View Customer Profile & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Fast Bill */}
                        <button
                          onClick={() => onOpenPOSForCustomer(c)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                          title="Create Bill for this Customer"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Edit Profile */}
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                          title="Edit Customer Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Audit Drawer */}
      <CustomerHistoryDrawer
        customerId={drawerCustomerId}
        onClose={() => setDrawerCustomerId(null)}
        onOpenPOSForCustomer={onOpenPOSForCustomer}
        onRecordPayment={onRecordPaymentForCustomer}
      />

      {/* Add / Edit Customer Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                {modalMode === 'create' ? 'Add New Customer Record' : `Edit Customer: ${editingCustomer?.customerCode}`}
              </h3>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={formMobile}
                  onChange={(e) => setFormMobile(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Address</label>
                <input
                  type="text"
                  placeholder="Enter your address"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes / Preferences</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Regular passport applicant, needs stamp on receipts..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {formError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded-lg">{formError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Create Customer' : 'Update Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
