import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Users,
  Layers,
  DollarSign,
  FileText,
  Printer,
  Camera,
  Palette,
  GraduationCap,
  Wallet,
  Package,
  UserCog,
  BarChart3,
  History,
  Settings,
  DatabaseBackup,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  X,
  CreditCard,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  pendingDueCount?: number;
  pendingAppsCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen,
  pendingDueCount = 0,
  pendingAppsCount = 0,
  lowStockCount = 0,
}) => {
  const { currentUser, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'billing', label: 'POS & Billing', icon: Receipt, adminOnly: false, badge: null },
    { id: 'dues', label: 'Due Management', icon: CreditCard, adminOnly: false, badge: pendingDueCount > 0 ? `${pendingDueCount}` : null, badgeColor: 'bg-amber-500' },
    { id: 'customers', label: 'Customers', icon: Users, adminOnly: false },
    { id: 'services', label: 'Service Catalog', icon: Layers, adminOnly: false },
    { id: 'applications', label: 'Online Applications', icon: FileText, adminOnly: false, badge: pendingAppsCount > 0 ? `${pendingAppsCount}` : null, badgeColor: 'bg-blue-600' },
    { id: 'printing', label: 'Printing Orders', icon: Printer, adminOnly: false },
    { id: 'photos', label: 'Photo Services', icon: Camera, adminOnly: false },
    { id: 'design', label: 'Design Services', icon: Palette, adminOnly: false },
    { id: 'students', label: 'Student Services', icon: GraduationCap, adminOnly: false },
    { id: 'expenses', label: 'Expenses', icon: Wallet, adminOnly: false },
    { id: 'inventory', label: 'Inventory', icon: Package, adminOnly: false, badge: lowStockCount > 0 ? `${lowStockCount} low` : null, badgeColor: 'bg-rose-500' },
    { id: 'staff', label: 'Staff Management', icon: UserCog, adminOnly: true },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, adminOnly: true },
    { id: 'logs', label: 'Activity Logs', icon: History, adminOnly: true },
    { id: 'settings', label: 'Shop Settings', icon: Settings, adminOnly: true },
    { id: 'backup', label: 'Backup & Restore', icon: DatabaseBackup, adminOnly: true },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-lg shadow-md shadow-blue-500/20">
              DS
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-wide text-white">DIGI DIGITAL SEWA</span>
                <span className="text-[10px] font-semibold uppercase px-1 py-0.2 rounded bg-red-600 text-white leading-none">
                  NP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">Cyber & Online Services</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Authenticated User (No switch dropdown) */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white ${
                isAdmin ? 'bg-amber-600' : 'bg-blue-600'
              }`}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">@{currentUser?.username}</p>
              </div>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
              isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {isAdmin ? '👑 Owner' : '👨💼 Staff'}
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 scrollbar-thin">
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operations
          </div>
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs shadow-blue-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">DIGI DIGITAL SEWA</span>
            <p className="text-[10px] text-slate-500">Kathmandu, Nepal</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
            title="Sign out of system"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
