import React, { useState, useEffect } from 'react';
import { UserCog, PlusCircle, ShieldCheck, UserCheck, ShieldAlert, CheckCircle2, Phone, Mail } from 'lucide-react';
import { User } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const StaffManagement: React.FC = () => {
  const { fetchApi, isAdmin } = useAuth();
  const [staffList, setStaffList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadStaff = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/staff');
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadStaff();
    }
  }, [isAdmin]);

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetchApi(`/api/staff/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await loadStaff();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!name || !email) {
      setFormError('Name and email are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/staff', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          role,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add staff');
      }

      setShowAddModal(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadStaff();
    } catch (err: any) {
      setFormError(err.message || 'Error creating staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Restricted Module</h3>
        <p className="text-xs text-slate-500 mt-1">Staff management is restricted to Admin / Owner accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            <span>Staff & Counter Operator Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Add counter operators, assign roles (Admin / Staff), and monitor cashier activity
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Staff Account</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Username (Login ID)</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">Loading staff accounts...</td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                          s.role === 'admin' ? 'bg-amber-600' : 'bg-blue-600'
                        }`}>
                          {s.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      @{s.username || (s.role === 'admin' ? 'bipin' : 'digistaff')}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.email}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{s.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.role === 'admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {s.role === 'admin' ? '👑 Owner / Admin' : '👨💼 Staff'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                      >
                        {s.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Staff Counter Operator</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Kiran Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  placeholder="staff@digidigitalsewa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Mobile Phone</label>
                <input
                  type="tel"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="staff">Staff (Can bill, process orders, cannot change prices)</option>
                  <option value="admin">Owner / Admin (Full access to prices, finances & settings)</option>
                </select>
              </div>

              {formError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded-lg">{formError}</div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
