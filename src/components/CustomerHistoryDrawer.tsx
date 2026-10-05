import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  CreditCard,
  Receipt,
  FileText,
  Printer,
  Camera,
  Palette,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { Customer } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CustomerHistoryDrawerProps {
  customerId: number | null;
  onClose: () => void;
  onOpenPOSForCustomer: (cust: Customer) => void;
  onRecordPayment: (cust: Customer) => void;
}

export const CustomerHistoryDrawer: React.FC<CustomerHistoryDrawerProps> = ({
  customerId,
  onClose,
  onOpenPOSForCustomer,
  onRecordPayment,
}) => {
  const { fetchApi } = useAuth();
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'invoices' | 'applications' | 'orders' | 'payments'>('invoices');

  useEffect(() => {
    if (!customerId) {
      setData(null);
      return;
    }

    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetchApi(`/api/customers/${customerId}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to load customer history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [customerId]);

  if (!customerId) return null;

  const customer: Customer | undefined = data?.customer;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 font-bold text-base">
              {customer?.name?.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{customer?.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300">
                  {customer?.customerCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">Customer Profile & Audit History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading || !customer ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
            Loading customer history...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Quick summary cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500">Total Spent</span>
                <p className="text-sm sm:text-base font-extrabold text-slate-900 font-mono mt-0.5">
                  Rs. {parseFloat(customer.totalSpending || '0').toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-700">Total Paid</span>
                <p className="text-sm sm:text-base font-extrabold text-emerald-800 font-mono mt-0.5">
                  Rs. {parseFloat(customer.paidAmount || '0').toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-xl text-center border ${
                parseFloat(customer.dueAmount || '0') > 0
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-[10px] font-bold uppercase">Pending Due</span>
                <p className="text-sm sm:text-base font-extrabold font-mono mt-0.5">
                  Rs. {parseFloat(customer.dueAmount || '0').toFixed(2)}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{customer.mobile}</span>
              </div>
              {customer.address && (
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.address}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.notes && (
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mt-1">
                  <strong>Notes:</strong> {customer.notes}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenPOSForCustomer(customer);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Bill for Customer</span>
              </button>
              {parseFloat(customer.dueAmount || '0') > 0 && (
                <button
                  onClick={() => {
                    onClose();
                    onRecordPayment(customer);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Clear Due Payment</span>
                </button>
              )}
            </div>

            {/* Tab navigation */}
            <div className="flex border-b border-slate-200 text-xs">
              {[
                { id: 'invoices', label: `Invoices (${data.invoices?.length || 0})` },
                { id: 'applications', label: `Applications (${data.applications?.length || 0})` },
                { id: 'orders', label: 'Other Orders' },
                { id: 'payments', label: `Payments (${data.payments?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 font-semibold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-2 text-xs">
              {activeTab === 'invoices' && (
                <div className="space-y-2">
                  {data.invoices?.map((inv: any) => (
                    <div key={inv.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-slate-900">{inv.invoiceNumber}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'Partial' ? 'bg-amber-100 text-amber-800' :
                          inv.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>{new Date(inv.createdAt).toLocaleString()}</span>
                        <span>Staff: {inv.staffName}</span>
                      </div>
                      <div className="flex justify-between font-mono pt-1 border-t border-slate-100 font-bold">
                        <span>Total: Rs. {parseFloat(inv.grandTotal).toFixed(2)}</span>
                        {parseFloat(inv.dueAmount) > 0 ? (
                          <span className="text-rose-600">Due: Rs. {parseFloat(inv.dueAmount).toFixed(2)}</span>
                        ) : (
                          <span className="text-emerald-600">Paid: Rs. {parseFloat(inv.paidAmount).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!data.invoices || data.invoices.length === 0) && (
                    <p className="text-center py-6 text-slate-400">No invoices generated yet.</p>
                  )}
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="space-y-2">
                  {data.applications?.map((app: any) => (
                    <div key={app.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{app.serviceName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>Ref / Token: {app.referenceCode || 'N/A'}</span>
                        <span>Fee: Rs. {parseFloat(app.totalFee).toFixed(2)}</span>
                      </div>
                      {app.remarks && <p className="text-[11px] text-slate-600 italic">"{app.remarks}"</p>}
                    </div>
                  ))}
                  {(!data.applications || data.applications.length === 0) && (
                    <p className="text-center py-6 text-slate-400">No online applications recorded.</p>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-700 mb-1 text-[11px] uppercase">Printing Orders</h4>
                    {data.printingOrders?.map((po: any) => (
                      <div key={po.id} className="p-2 mb-1 rounded-lg border border-slate-200 bg-slate-50 flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{po.documentName}</p>
                          <p className="text-[10px] text-slate-500">{po.printType} • {po.pages} pgs x {po.copies} copies</p>
                        </div>
                        <span className="font-bold font-mono">Rs. {po.totalAmount}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-700 mb-1 text-[11px] uppercase">Photo Orders</h4>
                    {data.photoOrders?.map((pho: any) => (
                      <div key={pho.id} className="p-2 mb-1 rounded-lg border border-slate-200 bg-slate-50 flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{pho.photoType}</p>
                          <p className="text-[10px] text-slate-500">{pho.quantity} pcs ({pho.size})</p>
                        </div>
                        <span className="font-bold font-mono">Rs. {pho.totalAmount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'payments' && (
                <div className="space-y-2">
                  {data.payments?.map((pay: any) => (
                    <div key={pay.id} className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Rs. {parseFloat(pay.amount).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500">
                          {pay.paymentMethod} • Received by {pay.receivedByStaffName}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {(!data.payments || data.payments.length === 0) && (
                    <p className="text-center py-6 text-slate-400">No payment records found.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
