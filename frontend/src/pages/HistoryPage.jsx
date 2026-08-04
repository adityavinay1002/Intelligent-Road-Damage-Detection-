import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Download, Trash2, Eye, FileText, ChevronLeft, ChevronRight,
  ShieldAlert, MapPin, Calendar, Activity, X, Layers, CheckCircle2
} from 'lucide-react';
import { api, formatMediaUrl } from '../services/api';

export default function HistoryPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getRecords({ limit: 100, severity: severityFilter || undefined });
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

  const handleDeleteRecord = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this inspection record?")) return;
    try {
      await api.deleteRecord(id);
      setRecords(prev => prev.filter(r => r.detection_id !== id));
      if (selectedRecord?.detection_id === id) setSelectedRecord(null);
    } catch (err) {
      alert("Failed to delete record.");
    }
  };

  // Filtering & Sorting
  let processed = records.filter(r => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      (r.road_name || '').toLowerCase().includes(query) ||
      (r.detection_id || '').toLowerCase().includes(query) ||
      (r.location || '').toLowerCase().includes(query) ||
      (r.image_filename || '').toLowerCase().includes(query)
    );
    const matchesMedia = !mediaTypeFilter || r.media_type === mediaTypeFilter;
    return matchesQuery && matchesMedia;
  });

  if (sortBy === 'newest') {
    processed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } else if (sortBy === 'defects') {
    processed.sort((a, b) => (b.total_defects || 0) - (a.total_defects || 0));
  } else if (sortBy === 'confidence') {
    processed.sort((a, b) => (b.avg_confidence || 0) - (a.avg_confidence || 0));
  }

  // Pagination calculation
  const totalPages = Math.ceil(processed.length / pageSize) || 1;
  const paginatedRecords = processed.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      
      {/* Page Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Inspection History Database</h2>
          <p className="text-xs text-slate-400 mt-1">Searchable repository of past road scans, evidence crops, and location logs.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search road name, ID, or location..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setCurrentPage(1); }}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="defects">Sort: Most Defects</option>
            <option value="confidence">Sort: Highest Confidence</option>
          </select>
        </div>
      </div>

      {/* Main Records Data Table */}
      <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-white/[0.08] text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Inspection ID</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Road Sector & Location</th>
                <th className="py-3.5 px-4">Media Type</th>
                <th className="py-3.5 px-4 text-center">Defects</th>
                <th className="py-3.5 px-4 text-center">Highest Severity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-300">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => (
                  <tr
                    key={rec.detection_id}
                    onClick={() => setSelectedRecord(rec)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                      #{rec.detection_id.substring(0, 8)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(rec.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{rec.road_name || 'Highway Sector'}</div>
                      {rec.location && <span className="text-[10px] text-slate-400 truncate max-w-xs block">{rec.location}</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-cyan-800">
                        {rec.media_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-white">
                      {rec.total_defects}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        rec.overall_severity === 'Critical' ? 'severity-badge-critical' :
                        rec.overall_severity === 'High' ? 'severity-badge-high' :
                        rec.overall_severity === 'Medium' ? 'severity-badge-medium' :
                        'severity-badge-low'
                      }`}>
                        {rec.overall_severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedRecord(rec); }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={api.getPdfReportUrl(rec.detection_id)}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 font-semibold"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </a>
                      <button
                        onClick={(e) => handleDeleteRecord(e, rec.detection_id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    {loading ? 'Loading inspection database...' : 'No inspection records match your filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-white/[0.08] text-xs">
            <span className="text-slate-400">
              Showing Page <b>{currentPage}</b> of <b>{totalPages}</b> ({processed.length} Records)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:text-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Record Detail Preview Modal ── */}
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
              className="glass-panel max-w-4xl w-full rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 bg-slate-950 border-b border-white/[0.08] flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-white text-base">Inspection Record Details</h3>
                  <p className="text-xs text-slate-400">ID: {selectedRecord.detection_id} | Scanned {new Date(selectedRecord.timestamp).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                {/* Location Details if available */}
                {selectedRecord.location && (
                  <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white block">Geolocation Metadata</span>
                      <span className="text-slate-300">{selectedRecord.location}</span>
                    </div>
                  </div>
                )}

                {/* Side-by-Side Images */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Source Input</span>
                    <div className="rounded-xl border border-white/10 bg-slate-950 h-52 overflow-hidden flex items-center justify-center">
                      <img src={formatMediaUrl(selectedRecord.source_path)} alt="Source" className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-1">Annotated Output</span>
                    <div className="rounded-xl border border-cyan-500/30 bg-slate-950 h-52 overflow-hidden flex items-center justify-center">
                      <img src={formatMediaUrl(selectedRecord.annotated_output_path)} alt="Annotated" className="w-full h-full object-contain" />
                    </div>
                  </div>
                </div>

                {/* Evidence Items List */}
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Itemized Defect Crops & Repair Recommendations</h4>
                  <div className="space-y-2">
                    {selectedRecord.damage_items?.map((item, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-white/[0.06] text-xs flex items-center space-x-3">
                        {item.evidence_image_path && (
                          <img src={formatMediaUrl(item.evidence_image_path)} alt={item.damage_class} className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{item.damage_class}</span>
                            <span className="text-cyan-400 font-extrabold">{(item.confidence_score * 100).toFixed(1)}%</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">{item.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-950 border-t border-white/[0.08] flex items-center justify-between">
                <a
                  href={api.getPdfReportUrl(selectedRecord.detection_id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Inspection PDF Report</span>
                </a>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 font-semibold text-xs hover:text-white"
                >
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
