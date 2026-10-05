import React, { useState } from 'react';
import { DatabaseBackup, Download, Upload, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const BackupRestore: React.FC = () => {
  const { fetchApi, isAdmin } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownloadBackup = async () => {
    try {
      setIsExporting(true);
      const res = await fetchApi('/api/backup');
      if (!res.ok) throw new Error('Backup failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DIGI_DIGITAL_SEWA_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Backup error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Restricted Module</h3>
        <p className="text-xs text-slate-500 mt-1">Database backup and restore is restricted to Admin / Owner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <DatabaseBackup className="w-5 h-5 text-blue-600" />
          <span>Database Backup & Data Portability</span>
        </h2>
        <p className="text-xs text-slate-500">
          Create complete JSON snapshots of all customer records, invoices, master service prices, and audit logs
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Create Live Cloud SQL Database Snapshot</h3>
          <p className="text-xs text-slate-600 mt-1">
            Exports all 19 PostgreSQL tables into a single structured backup JSON file. You can safely keep
            this on local storage or external drive for disaster recovery.
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Included in backup:</p>
            <p className="mt-0.5 text-blue-800">
              Users, Customers, Master Services, Price Change Logs, Invoices, Payments, Refunds,
              Online Applications, Printing Orders, Photo Orders, Design Orders, Student Services,
              Expenses, Inventory Items, Transactions, and Activity Audit Trails.
            </p>
          </div>
        </div>

        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Database backup downloaded successfully!</span>
          </div>
        )}

        <button
          onClick={handleDownloadBackup}
          disabled={isExporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-98 transition-all disabled:bg-slate-300"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Generating Snapshot...' : 'Download Full Database Backup'}</span>
        </button>
      </div>
    </div>
  );
};
