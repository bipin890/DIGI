import React, { useState, useEffect } from 'react';
import { GraduationCap, PlusCircle, CheckCircle2, Clock, Search } from 'lucide-react';
import { StudentService } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const StudentServices: React.FC = () => {
  const { fetchApi } = useAuth();
  const [services, setServices] = useState<StudentService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [studentName, setStudentName] = useState('');
  const [contact, setContact] = useState('');
  const [institution, setInstitution] = useState('');
  const [serviceType, setServiceType] = useState('Entrance Form');
  const [fee, setFee] = useState('200');
  const [paidAmount, setPaidAmount] = useState('200');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/services/student');
      if (res.ok) {
        setServices(await res.json());
      }
    } catch (err) {
      console.error('Failed to load student services:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/services/student', {
        method: 'POST',
        body: JSON.stringify({
          studentName,
          contact,
          institution,
          serviceType,
          fee: parseFloat(fee),
          paidAmount: parseFloat(paidAmount),
          notes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setStudentName('');
        setContact('');
        setInstitution('');
        setNotes('');
        await loadServices();
      }
    } catch (err) {
      console.error('Failed to create student service:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await fetchApi(`/api/services/student/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadServices();
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
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <span>Academic & Student Services Corner</span>
          </h2>
          <p className="text-xs text-slate-500">
            Admissions, scholarship applications, exam registrations, marksheet downloads & project typing
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ New Student Service</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">College / School</th>
                <th className="py-3 px-4">Service Required</th>
                <th className="py-3 px-4 text-right">Fee (NPR)</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">Loading student requests...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">No student services registered.</td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.orderNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{s.studentName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{s.contact}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{s.institution}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-900">{s.serviceType}</td>
                    <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                      Rs. {parseFloat(s.fee).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 font-semibold">
                      Rs. {parseFloat(s.paidAmount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border bg-white focus:outline-none"
                      >
                        {['Pending', 'Processing', 'Completed', 'Cancelled'].map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{s.staffName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Student Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Student Service Order</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Student Name *</label>
                  <input
                    type="text"
                    placeholder="Student Name"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Mobile / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Institution / Campus</label>
                <input
                  type="text"
                  placeholder="e.g. Pulchowk Campus, Kathmandu University, TU"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Entrance Form">IOE / IOM / CEE Entrance Form</option>
                  <option value="Online Admission">University Online Admission</option>
                  <option value="Scholarship Application">Scholarship Application Form</option>
                  <option value="Exam Form">Board / Semester Exam Form</option>
                  <option value="Result Check">SEE / +2 / Bachelor Result Check</option>
                  <option value="Marksheet / Certificate Download">Marksheet / Certificate Print</option>
                  <option value="Assignment Typing">Assignment / Lab Typing</option>
                  <option value="Project Report Typing">Project Report Formatting & Print</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Service Fee (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={fee}
                    onChange={(e) => {
                      setFee(e.target.value);
                      setPaidAmount(e.target.value);
                    }}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Paid Amount (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes</label>
                <input
                  type="text"
                  placeholder="Roll number, subject or portal login..."
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
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Add Student Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
