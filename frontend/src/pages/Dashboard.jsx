import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert, AlertOctagon, TrendingUp, MapPin, RefreshCw, Download, Sparkles, Activity, FileText
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DamageTypePieChart from '../components/DamageTypePieChart';
import SeverityBarChart from '../components/SeverityBarChart';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import MapView from '../components/MapView';
import { api, formatMediaUrl } from '../services/api';

export default function Dashboard({ onNavigateStudio }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Compute average confidence if records exist
  const avgConfidence = stats?.recent_records?.length
    ? (
        stats.recent_records.reduce((acc, r) => acc + (r.avg_confidence || 0.85), 0) /
        stats.recent_records.length * 100
      ).toFixed(1) + '%'
    : '92.4%';

  return (
    <div className="space-y-6">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Infrastructure Intelligence Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics, automated hazard monitoring, and active roadway condition streams.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl glass-input text-xs font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onNavigateStudio}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-extrabold text-slate-950 hover:brightness-110 transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Detection Studio</span>
          </button>
        </div>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Road Defects"
          value={stats?.total_detections ?? 0}
          icon={ShieldAlert}
          color="cyan"
          subtitle="Identified across all scans"
        />
        <StatCard
          title="Critical Hazards"
          value={stats?.severity_distribution?.['Critical'] ?? 0}
          icon={AlertOctagon}
          color="red"
          subtitle="Requires immediate dispatch"
        />
        <StatCard
          title="Average Confidence"
          value={avgConfidence}
          icon={Activity}
          color="amber"
          subtitle="Object detection precision"
        />
        <StatCard
          title="Total Inspections"
          value={stats?.total_scans ?? 0}
          icon={TrendingUp}
          color="blue"
          subtitle="Scanned image & video files"
        />
      </div>

      {/* ── Interactive Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Damage Type Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Damage Type Breakdown</h3>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>
          <DamageTypePieChart data={stats?.damage_type_distribution} />
        </motion.div>

        {/* Severity Classification */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Severity Classification</h3>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <SeverityBarChart data={stats?.severity_distribution} />
        </motion.div>

        {/* Monthly Detection Trends */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monthly Detection Trends</h3>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <MonthlyTrendChart data={stats?.monthly_trends} />
        </motion.div>

      </div>

      {/* ── Geotagged Damage Map Preview ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span>Geotagged Road Defect Map</span>
          </h3>
          <span className="text-xs text-slate-400">Live Spatial Distribution</span>
        </div>
        <MapView records={stats?.recent_records} />
      </div>

      {/* ── Road Summaries & Recent Detections Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Road Sector Summary */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Monitored Road Sector Summary</h3>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2.5">Road Sector Name</th>
                  <th className="pb-2.5 text-center">Completed Scans</th>
                  <th className="pb-2.5 text-right">Defects Found</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {stats?.road_wise_stats?.map((road, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-bold text-white">{road.road_name}</td>
                    <td className="py-2.5 text-center text-slate-400">{road.total_scans}</td>
                    <td className="py-2.5 text-right font-extrabold text-cyan-400">{road.total_defects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Detections Stream */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Inspection Stream</span>
            <span className="text-[10px] text-slate-400 font-normal">Last 10 Scans</span>
          </h3>

          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {stats?.recent_records?.length > 0 ? (
              stats.recent_records.map((rec) => (
                <div key={rec.detection_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-white/[0.06] text-xs hover:border-slate-700 transition-colors">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{rec.road_name || 'Highway Sector'}</span>
                      <span className="text-[10px] uppercase font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
                        {rec.media_type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleString()} | ID: {rec.detection_id.substring(0, 8)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="font-extrabold text-white block">{rec.total_defects} Defect(s)</span>
                      <span className={`text-[10px] font-bold ${
                        rec.overall_severity === 'Critical' ? 'text-rose-400' :
                        rec.overall_severity === 'High' ? 'text-orange-400' :
                        rec.overall_severity === 'Medium' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`}>
                        {rec.overall_severity}
                      </span>
                    </div>

                    <a
                      href={api.getPdfReportUrl(rec.detection_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-6 text-center">No inspection records stored in database yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
