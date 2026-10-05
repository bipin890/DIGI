import React, { useState, useEffect } from 'react';
import {
  Layers,
  Search,
  PlusCircle,
  Edit3,
  Receipt,
  CheckCircle2,
  FileText,
  CreditCard,
  Printer,
  Camera,
  Monitor,
  Building2,
  Palette,
  GraduationCap
} from 'lucide-react';
import { Service, ServiceCategory } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ServicesCatalogProps {
  onOpenPOS: () => void;
  onNavigateTab: (tab: string) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({
  onOpenPOS,
  onNavigateTab,
}) => {
  const { fetchApi, isAdmin } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [srvRes, catRes] = await Promise.all([
          fetchApi('/api/services'),
          fetchApi('/api/categories'),
        ]);
        if (srvRes.ok) setServices(await srvRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'online-forms': return FileText;
      case 'bill-payment': return CreditCard;
      case 'printing-document': return Printer;
      case 'photo-services': return Camera;
      case 'computer-services': return Monitor;
      case 'financial-assistance': return Building2;
      case 'design-services': return Palette;
      case 'student-services': return GraduationCap;
      default: return Layers;
    }
  };

  const filtered = services.filter((s) => {
    const matchesCat = selectedCat === 'all' || s.categoryId.toString() === selectedCat;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Centralized Digital Service Catalog</span>
          </h2>
          <p className="text-xs text-slate-500">
            Browse services across 8 categories. In POS Billing, operators enter custom prices, service charges, discounts, and auto-calculate totals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPOS}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition-all"
          >
            <Receipt className="w-4 h-4" />
            <span>Open POS Counter</span>
          </button>
        </div>
      </div>

      {/* Filter and Categories Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search service name, code, or description (e.g. Passport, Typing, A4, NEA...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCat === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.map((c) => {
            const Icon = getCategoryIcon(c.slug);
            const count = services.filter((s) => s.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id.toString())}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCat === c.id.toString()
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{c.name} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Service Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-xs text-slate-400">No services match your search.</div>
        ) : (
          filtered.map((s) => {
            const Icon = getCategoryIcon(s.categorySlug);
            return (
              <div
                key={s.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                        {s.code}
                      </span>
                    </div>
                    <span className="text-sm font-black font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Rs. {parseFloat(s.defaultPrice).toFixed(2)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 leading-tight">
                    {s.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Category: <span className="font-semibold text-slate-700">{s.categoryName}</span> • per {s.unit}
                  </p>
                  {s.description && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {s.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {s.status === 'active' ? 'Active in POS' : 'Disabled'}
                  </span>
                  <button
                    onClick={onOpenPOS}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <span>Bill in POS &rarr;</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
