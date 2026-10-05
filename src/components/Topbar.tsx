import React, { useState } from 'react';
import {
  Menu,
  Bell,
  PlusCircle,
  LogOut,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  onOpenPOS: () => void;
  activeTabTitle: string;
  notifications?: {
    dues: number;
    apps: number;
    lowStock: number;
  };
  onNavigateTab: (tab: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  onOpenPOS,
  activeTabTitle,
  notifications = { dues: 0, apps: 0, lowStock: 0 },
  onNavigateTab,
}) => {
  const { currentUser, logout, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const totalNotifs = notifications.dues + notifications.apps + notifications.lowStock;

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{activeTabTitle}</span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-500 font-medium">{todayStr}</p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick POS New Invoice Action */}
        <button
          onClick={onOpenPOS}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs shadow-blue-500/20 active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Bill (POS)</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {totalNotifs > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full">
                {totalNotifs}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Alerts & Reminders</span>
                <span className="text-[10px] font-medium text-slate-500">{totalNotifs} active</span>
              </div>
              <div className="py-2 space-y-2">
                {notifications.dues > 0 && (
                  <button
                    onClick={() => {
                      onNavigateTab('dues');
                      setShowNotifications(false);
                    }}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-900">{notifications.dues} Customers with Due</p>
                      <p className="text-[11px] text-amber-700">Follow up and collect pending balances</p>
                    </div>
                  </button>
                )}
                {notifications.apps > 0 && (
                  <button
                    onClick={() => {
                      onNavigateTab('applications');
                      setShowNotifications(false);
                    }}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">{notifications.apps} Pending Applications</p>
                      <p className="text-[11px] text-blue-700">DOTM, Passport or Lok Sewa submissions</p>
                    </div>
                  </button>
                )}
                {notifications.lowStock > 0 && (
                  <button
                    onClick={() => {
                      onNavigateTab('inventory');
                      setShowNotifications(false);
                    }}
                    className="w-full text-left flex items-start gap-2 p-2 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-rose-900">{notifications.lowStock} Items Low Stock</p>
                      <p className="text-[11px] text-rose-700">Reorder printing paper or ink refills</p>
                    </div>
                  </button>
                )}
                {totalNotifs === 0 && (
                  <div className="py-4 text-center text-xs text-slate-500 flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <span>All operational tasks are up to date!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold ${
              isAdmin ? 'bg-amber-600' : 'bg-blue-600'
            }`}>
              {currentUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono leading-none">
                @{currentUser?.username} • {isAdmin ? 'Owner' : 'Staff'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
