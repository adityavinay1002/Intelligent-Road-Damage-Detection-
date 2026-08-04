import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Download, Search, Filter, Eye, MapPin, Calendar, ShieldAlert, X } from 'lucide-react';
import { api, formatMediaUrl } from '../services/api';

export default function ReportsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getRecords({ limit: 100, severity: severityFilter || undefined });
      setRecords(data);
    } catch (err) {
      console.error("Failed to load report records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [severityFilter]);

  const filteredRecords = records.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      (r.road_name || '').toLowerCase().includes(query) ||
      (r.detection_id || '').toLowerCase().includes(query) ||
      (r.location || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Page Header & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Commercial PDF Reports</h2>
          <p className="text-xs text-slate-400 mt-1">Generated engineering reports, executive summaries, and itemized damage inventories.</p>
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
              className="glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((rec, idx) => (
            <motion.div
              key={rec.detection_id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="glass-card p-5 rounded-2xl border border-white/[0.08] flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">
                        RoadVision Report
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        #{rec.detection_id.substring(0, 8)}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    rec.overall_severity === 'Critical' ? 'severity-badge-critical' :
                    rec.overall_severity === 'High' ? 'severity-badge-high' :
                    rec.overall_severity === 'Medium' ? 'severity-badge-medium' :
                    'severity-badge-low'
                  }`}>
                    {rec.overall_severity}
                  </span>
                </div>

                {/* Report Metadata */}
                <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">Road Sector:</span>
                    <span className="text-white font-bold truncate max-w-[160px]">{rec.road_name || 'Highway Sector'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Defects Found:</span>
                    <span className="text-cyan-400 font-extrabold">{rec.total_defects} defect(s)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Timestamp:</span>
                    <span>{new Date(rec.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center space-x-2">
                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <a
                  href={api.getPdfReportUrl(rec.detection_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 hover:brightness-110 transition-all shadow-md shadow-cyan-500/20"
                >
                  <Download className="w-3.5 h-3.5 text-slate-950" />
                  <span>Download PDF</span>
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center glass-panel rounded-2xl border border-white/[0.08]">
            <p className="text-xs text-slate-400 italic">
              {loading ? 'Loading report database...' : 'No reports found.'}
            </p>
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="glass-panel max-w-3xl w-full rounded-2xl border border-white/10 overflow-hidden"
            >
              <div className="p-5 bg-slate-950 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Report Preview Summary</h3>
                  <span className="text-xs text-cyan-400 font-mono">#{selectedRecord.detection_id}</span>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs text-slate-300">
                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-white/[0.06]">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Road Sector</span>
                    <span className="text-white font-bold text-sm">{selectedRecord.road_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Defects Detected</span>
                    <span className="text-cyan-400 font-black text-sm">{selectedRecord.total_defects} Defect(s)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Highest Severity</span>
                    <span className="text-rose-400 font-bold">{selectedRecord.overall_severity}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scan Date</span>
                    <span>{new Date(selectedRecord.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950 h-56 flex items-center justify-center">
                  <img src={formatMediaUrl(selectedRecord.annotated_output_path)} alt="Annotated Scan" className="w-full h-full object-contain" />
                </div>
              </div>

              <div className="p-4 bg-slate-950 border-t border-white/[0.08] flex items-center justify-between">
                <a
                  href={api.getPdfReportUrl(selectedRecord.detection_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full PDF Report</span>
                </a>
                <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-semibold text-xs">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
