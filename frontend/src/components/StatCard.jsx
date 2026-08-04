import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = 'cyan', subtitle }) {
  const colorMap = {
    cyan: {
      border: 'border-cyan-500/20',
      bgIcon: 'bg-cyan-500/10',
      textIcon: 'text-cyan-400',
      glow: 'shadow-cyan-500/10',
    },
    red: {
      border: 'border-red-500/20',
      bgIcon: 'bg-red-500/10',
      textIcon: 'text-red-400',
      glow: 'shadow-red-500/10',
    },
    amber: {
      border: 'border-amber-500/20',
      bgIcon: 'bg-amber-500/10',
      textIcon: 'text-amber-400',
      glow: 'shadow-amber-500/10',
    },
    emerald: {
      border: 'border-emerald-500/20',
      bgIcon: 'bg-emerald-500/10',
      textIcon: 'text-emerald-400',
      glow: 'shadow-emerald-500/10',
    },
    blue: {
      border: 'border-blue-500/20',
      bgIcon: 'bg-blue-500/10',
      textIcon: 'text-blue-400',
      glow: 'shadow-blue-500/10',
    }
  };

  const current = colorMap[color] || colorMap.cyan;

  return (
    <div className={`glass-panel p-5 rounded-2xl border ${current.border} shadow-lg ${current.glow} flex items-center justify-between transition-transform duration-200 hover:-translate-y-1`}>
      <div>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-white mt-1">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-xl ${current.bgIcon} flex items-center justify-center border border-white/5`}>
        <Icon className={`w-6 h-6 ${current.textIcon}`} />
      </div>
    </div>
  );
}
