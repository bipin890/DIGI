import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Edit2,
  Calendar,
  Phone,
  User,
  Filter
} from 'lucide-react';
import { Application, Service } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const OnlineApplications: React.FC = () => {
  const { fetchApi } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [totalFee, setTotalFee] = useState('250');
  const [paidFee, setPaidFee] = useState('250');
  const [followUpDate, setFollowUpDate] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status edit modal
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editRefCode, setEditRefCode] = useState('');
  const [editRemarks, setEditRemarks] = useState('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [appRes, srvRes] = await Promise.all([
        fetchApi(`/api/applications?${params.toString()}`),
        fetchApi('/api/services'),
      ]);

      if (appRes.ok) setApplications(await appRes.json());
      if (srvRes.ok) {
        const allSrv: Service[] = await srvRes.json();
        // filter online forms & student services
        const appServices = allSrv.filter(s => s.categorySlug === 'online-forms' || s.categorySlug === 'student-services');
        setServices(appServices);
        if (appServices.length > 0 && !selectedServiceId) {
          setSelectedServiceId(appServices[0].id.toString());
          setTotalFee(appServices[0].defaultPrice);
          setPaidFee(appServices[0].defaultPrice);
        }
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!customerName.trim() || !customerMobile.trim() || !selectedServiceId) {
      setFormError('Customer name, mobile and service are required.');
      return;
    }

    const srv = services.find(s => s.id.toString() === selectedServiceId);

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerMobile: customerMobile.trim(),
          serviceId: parseInt(selectedServiceId, 10),
          serviceName: srv ? srv.name : 'Online Application',
          totalFee,
          paidFee,
          followUpDate: followUpDate || undefined,
          referenceCode: referenceCode.trim() || undefined,
          remarks: remarks.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create application');
      }

      setShowModal(false);
      setCustomerName('');
      setCustomerMobile('');
      setReferenceCode('');
      setRemarks('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error saving application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/api/applications/${editingApp.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: editStatus,
          referenceCode: editRefCode,
          remarks: editRemarks,
        }),
      });

      if (res.ok) {
        setEditingApp(null);
        await loadData();
      }
    } catch (err) {
      console.error('Failed to update application status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses = ['Pending', 'In Progress', 'Submitted', 'Processing', 'Completed', 'Rejected', 'Cancelled'];

  const getStatusColor = (st: string) => {
    switch (st) {
      case 'Completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Processing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'In Progress': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Rejected':
      case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Online Government Applications & Form Fillup</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track Passport, DOTM License, National ID (NID), Lok Sewa, and University Entrance submissions
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Online Application</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by customer name, mobile, service, or Govt ref token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800"
        >
          <option value="all">All Application Statuses</option>
          {statuses.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Application #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Govt Ref / Token</th>
                <th className="py-3 px-4">Follow-up Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Fee (NPR)</th>
                <th className="py-3 px-4">Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Loading applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No online applications found matching search.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {app.applicationNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{app.customerName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{app.customerMobile}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {app.serviceName}
                    </td>
                    <td className="py-3 px-4 font-mono text-blue-700 font-semibold">
                      {app.referenceCode || <span className="text-slate-400 font-normal italic">Pending token</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">
                      {app.followUpDate ? (
                        <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {app.followUpDate}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800">
                      Rs. {parseFloat(app.totalFee).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {app.staffName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setEditingApp(app);
                          setEditStatus(app.status);
                          setEditRefCode(app.referenceCode || '');
                          setEditRemarks(app.remarks || '');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Update Status</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Record Online Application Entry</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Applicant Name *</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Select Online Service *</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const s = services.find(x => x.id.toString() === e.target.value);
                    if (s) {
                      setTotalFee(s.defaultPrice);
                      setPaidFee(s.defaultPrice);
                    }
                  }}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  required
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id.toString()}>
                      {s.name} (Rs. {parseFloat(s.defaultPrice)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Govt Token / Application Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. DOTM-89102, EPP-KTM-01"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Biometric / Exam Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Total Fee (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={totalFee}
                    onChange={(e) => setTotalFee(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Paid Amount (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={paidFee}
                    onChange={(e) => setPaidFee(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Remarks / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Candidate needs to bring citizenship original & voucher on appointment date..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {formError && (
                <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded-lg">{formError}</div>
              )}

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
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Creating...' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Update Status • {editingApp.applicationNumber}
            </h3>
            <p className="text-xs text-slate-500 mb-3">{editingApp.serviceName} for {editingApp.customerName}</p>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Application Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  {statuses.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Govt Token / Application Ref Code</label>
                <input
                  type="text"
                  value={editRefCode}
                  onChange={(e) => setEditRefCode(e.target.value)}
                  placeholder="e.g. DOTM-88912"
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingApp(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  {isSubmitting ? 'Updating...' : 'Save Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
