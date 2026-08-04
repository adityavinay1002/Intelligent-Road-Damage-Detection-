import React from 'react';
import { LayoutDashboard, ScanSearch, MapPin, FileText, Cpu, ShieldAlert } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'studio', label: 'Detection Studio', icon: ScanSearch },
    { id: 'map', label: 'Damage Map', icon: MapPin },
    { id: 'reports', label: 'Reports & Logs', icon: FileText },
    { id: 'training', label: 'YOLO11 Specs', icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-cyan-400">
                ROAD<span className="text-cyan-400">VISION</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded-full">
                YOLO11 ENGINE
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>
      </div>
    </header>
  );
}
