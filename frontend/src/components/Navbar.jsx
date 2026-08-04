import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, ScanSearch, MapPin, History, FileText, ShieldAlert, Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Detection Studio', icon: ScanSearch, primary: true },
    { id: 'map', label: 'Damage Map', icon: MapPin },
    { id: 'history', label: 'Inspection History', icon: History },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 navbar-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Brand Logo ── */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 shrink-0 group text-left focus:outline-none"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105">
              <ShieldAlert className="w-5 h-5 text-white relative z-10" />
              <span className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-pulse" />
            </div>

            <div>
              <div className="text-lg font-black tracking-tight leading-none">
                <span className="gradient-text-brand">ROADVISION</span>
                <span className="text-cyan-400 font-extrabold ml-1">AI</span>
              </div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
                Infrastructure Intelligence
              </div>
            </div>
          </button>

          {/* ── Navigation Tabs ── */}
          <nav className="flex items-center gap-1 bg-slate-950/60 p-1.5 rounded-2xl border border-white/[0.08] overflow-x-auto no-scrollbar">
            {navItems.map(({ id, label, icon: Icon, primary }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabPill"
                      className={`absolute inset-0 rounded-xl ${
                        primary
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25'
                          : 'bg-slate-800 border border-white/10'
                      }`}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : primary ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{label}</span>
                    {primary && !isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* ── Action Shortcut ── */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('studio')}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-xs font-extrabold text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Inspection</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
