import React, { useEffect, useState } from 'react';
import { FileText, Download, Trash2, Search, Filter, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getRecords({ severity: severityFilter || undefined });
      setRecords(data);
    } catch (err) {
      console.error("Failed to load records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [severityFilter]);

  const filteredRecords = records.filter(r => 
    r.road_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.detection_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Inspection Reports & History Log</h2>
          <p className="text-sm text-slate-400">Database Records, Evidence Snapshots, and PDF Downloads</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search road or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Main Records Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Inspection ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Road Name</th>
                <th className="py-3 px-4">Media Type</th>
                <th className="py-3 px-4 text-center">Defects</th>
                <th className="py-3 px-4 text-center">Overall Severity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => (
                  <tr key={rec.detection_id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {rec.detection_id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(rec.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {rec.road_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {rec.media_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-extrabold text-white">
                      {rec.total_defects}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        rec.overall_severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        rec.overall_severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                        rec.overall_severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {rec.overall_severity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <a
                        href={api.getPdfReportUrl(rec.detection_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF Report</span>
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    {loading ? 'Loading inspection records...' : 'No inspection records found in database.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
