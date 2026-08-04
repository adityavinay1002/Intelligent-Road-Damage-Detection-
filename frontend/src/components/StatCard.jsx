import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  cyan: {
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    glow: 'group-hover:border-cyan-500/40 group-hover:shadow-cyan-500/10',
    text: 'text-cyan-400'
  },
  red: {
    iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    glow: 'group-hover:border-rose-500/40 group-hover:shadow-rose-500/10',
    text: 'text-rose-400'
  },
  amber: {
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    glow: 'group-hover:border-amber-500/40 group-hover:shadow-amber-500/10',
    text: 'text-amber-400'
  },
  emerald: {
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    glow: 'group-hover:border-emerald-500/40 group-hover:shadow-emerald-500/10',
    text: 'text-emerald-400'
  },
  blue: {
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    glow: 'group-hover:border-blue-500/40 group-hover:shadow-blue-500/10',
    text: 'text-blue-400'
  }
};

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend }) {
  const theme = COLOR_MAP[color] || COLOR_MAP.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -3 }}
      className={`glass-card p-5 rounded-2xl border border-white/[0.08] relative overflow-hidden group transition-all duration-300 ${theme.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl border ${theme.iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
          <span className="text-slate-400">{trend.label}</span>
          <span className={`font-bold ${theme.text}`}>{trend.value}</span>
        </div>
      )}
    </motion.div>
  );
}
