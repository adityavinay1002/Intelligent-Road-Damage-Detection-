import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertOctagon, TrendingUp, MapPin, FileText, RefreshCw, Download } from 'lucide-react';
import StatCard from '../components/StatCard';
import DamageTypePieChart from '../components/DamageTypePieChart';
import SeverityBarChart from '../components/SeverityBarChart';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import MapView from '../components/MapView';
import { api } from '../services/api';

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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Infrastructure Overview</h1>
          <p className="text-sm text-slate-400">Intelligent Road Damage Detection Analytics & Defect Stream</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchStats}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>

          <button
            onClick={onNavigateStudio}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-xs font-extrabold text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20"
          >
            <span>Open Detection Studio</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Road Defects"
          value={stats?.total_detections ?? 0}
          icon={ShieldAlert}
          color="cyan"
          subtitle="Identified across all scans"
        />
        <StatCard
          title="Critical Potholes"
          value={stats?.severity_distribution?.['Critical'] ?? 0}
          icon={AlertOctagon}
          color="red"
          subtitle="High hazard immediate repair"
        />
        <StatCard
          title="Total Inspection Scans"
          value={stats?.total_scans ?? 0}
          icon={TrendingUp}
          color="amber"
          subtitle="Completed image & video jobs"
        />
        <StatCard
          title="Road Networks Monitored"
          value={stats?.road_wise_stats?.length ?? 3}
          icon={MapPin}
          color="emerald"
          subtitle="Active highway sectors"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Damage Type Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Damage Type Distribution</h3>
          <DamageTypePieChart data={stats?.damage_type_distribution} />
        </div>

        {/* Severity Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Severity Classification</h3>
          <SeverityBarChart data={stats?.severity_distribution} />
        </div>

        {/* Monthly Detection Trends */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly Detection Trends</h3>
          <MonthlyTrendChart data={stats?.monthly_trends} />
        </div>

      </div>

      {/* Interactive Geotagged Damage Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Geotagged Road Defect Map</h3>
          <span className="text-xs text-slate-400">Live Spatial Distribution</span>
        </div>
        <MapView records={stats?.recent_records} />
      </div>

      {/* Road-wise Statistics & Recent Detections Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Road-wise Stats Table */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Road-wise Inspection Summary</h3>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-2">Road / Sector Name</th>
                  <th className="pb-2 text-center">Completed Scans</th>
                  <th className="pb-2 text-right">Defects Found</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {stats?.road_wise_stats?.map((road, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 font-bold text-white">{road.road_name}</td>
                    <td className="py-2.5 text-center">{road.total_scans}</td>
                    <td className="py-2.5 text-right font-extrabold text-cyan-400">{road.total_defects}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Detections Stream */}
        <div className="lg:col-span-6 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Detection Records</h3>

          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
            {stats?.recent_records?.length > 0 ? (
              stats.recent_records.map((rec) => (
                <div key={rec.detection_id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{rec.road_name}</span>
                      <span className="text-[10px] uppercase font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded">
                        {rec.media_type}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleString()} | ID: {rec.detection_id.substring(0, 8)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="font-extrabold text-white block">{rec.total_defects} Defects</span>
                      <span className={`text-[10px] font-bold ${
                        rec.overall_severity === 'Critical' ? 'text-red-400' :
                        rec.overall_severity === 'High' ? 'text-orange-400' :
                        rec.overall_severity === 'Medium' ? 'text-amber-400' :
                        'text-green-400'
                      }`}>
                        {rec.overall_severity}
                      </span>
                    </div>

                    <a
                      href={api.getPdfReportUrl(rec.detection_id)}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-300 transition-colors"
                      title="Download PDF Report"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">No detection records stored in database yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
