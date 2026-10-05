import React, { useState } from 'react';
import { LogIn, Key, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await login(username.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to authentication service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-800/20 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 bg-slate-900 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-2xl shadow-lg shadow-blue-500/30 mb-3">
            DS
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-extrabold tracking-wide text-white">DIGI DIGITAL SEWA</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white uppercase">
              Nepal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Digital Service Center & Cyber Cafe Management System
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-98 shadow-md shadow-blue-600/30 transition-all disabled:bg-slate-300"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmitting ? 'Authenticating...' : 'Sign In to DIGI DIGITAL SEWA'}</span>
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-400">
            Authorized operators only • Secure Single Shop Portal
          </div>
        </div>
      </div>
    </div>
  );
};
