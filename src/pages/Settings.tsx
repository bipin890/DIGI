import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ShopSettings } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const Settings: React.FC = () => {
  const { fetchApi, isAdmin } = useAuth();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [shopName, setShopName] = useState('DIGI DIGITAL SEWA');
  const [tagline, setTagline] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [panVatNumber, setPanVatNumber] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('DGS');
  const [invoiceFooter, setInvoiceFooter] = useState('');
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('Cash');
  const [enableTax, setEnableTax] = useState(false);
  const [taxPercent, setTaxPercent] = useState('13.00');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetchApi('/api/settings');
        if (res.ok) {
          const s: ShopSettings = await res.json();
          setSettings(s);
          setShopName(s.shopName || 'DIGI DIGITAL SEWA');
          setTagline(s.tagline || '');
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setAltPhone(s.altPhone || '');
          setEmail(s.email || '');
          setPanVatNumber(s.panVatNumber || '');
          setInvoicePrefix(s.invoicePrefix || 'DGS');
          setInvoiceFooter(s.invoiceFooter || '');
          setDefaultPaymentMethod(s.defaultPaymentMethod || 'Cash');
          setEnableTax(s.enableTax || false);
          setTaxPercent(s.taxPercent || '13.00');
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setIsSaving(true);
      setSavedSuccess(false);
      const res = await fetchApi('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          shopName,
          tagline,
          address,
          phone,
          altPhone,
          email,
          panVatNumber,
          invoicePrefix,
          invoiceFooter,
          defaultPaymentMethod,
          enableTax,
          taxPercent,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-900">Restricted Module</h3>
        <p className="text-xs text-slate-500 mt-1">Shop configuration is restricted to Admin / Owner.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>Shop Profile & Invoice Settings</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure header branding, PAN registration, invoice numbering, and print format
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        {/* Section 1: Shop details */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Shop Information (Printed on Bills)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Shop Name *</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg font-bold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Tagline / Subheading</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Shop Address *</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Primary Phone *</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Alternative Phone</label>
              <input
                type="text"
                value={altPhone}
                onChange={(e) => setAltPhone(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Shop Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Government PAN / VAT Number</label>
              <input
                type="text"
                value={panVatNumber}
                onChange={(e) => setPanVatNumber(e.target.value)}
                placeholder="e.g. 609876543"
                className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invoice & POS Settings */}
        <div className="pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Invoice Numbering & Receipt Configuration
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Invoice Number Prefix *</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">Example: {invoicePrefix}-2026-0001</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Default Counter Payment Method</label>
              <select
                value={defaultPaymentMethod}
                onChange={(e) => setDefaultPaymentMethod(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Cash">Cash</option>
                <option value="eSewa">eSewa</option>
                <option value="Khalti">Khalti</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">Receipt Footer Greeting (Nepali / English)</label>
              <input
                type="text"
                value={invoiceFooter}
                onChange={(e) => setInvoiceFooter(e.target.value)}
                className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully! Future invoices will reflect these changes.</span>
          </div>
        )}

        <div className="flex items-center justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md active:scale-98 transition-all disabled:bg-slate-300"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
