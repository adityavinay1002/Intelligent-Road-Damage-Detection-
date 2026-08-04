import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Sliders, Image as ImageIcon, Film, Download, FileText,
  Eye, EyeOff, Layers, RefreshCw, Sparkles, ChevronLeft, ChevronRight,
  ShieldAlert, Maximize2, ZoomIn, ZoomOut, X, AlertOctagon, MapPin, CheckCircle2
} from 'lucide-react';
import { api, formatMediaUrl } from '../services/api';

export default function DetectionStudio() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [roadName, setRoadName] = useState('Highway Sector A-1');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectionResults, setDetectionResults] = useState(null);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  // Fullscreen Zoom Modal State
  const [zoomModalImage, setZoomModalImage] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const fileInputRef = useRef(null);

  const handleFiles = (filesList) => {
    const files = Array.from(filesList);
    if (!files.length) return;

    setSelectedFiles(files);
    const firstFile = files[0];
    if (firstFile.type.startsWith('video/')) {
      setFileType('video');
    } else {
      setFileType('image');
    }

    setDetectionResults(null);
    setActivePreviewIndex(0);
  };

  const loadSampleImage = async (e) => {
    if (e) e.stopPropagation();
    const sampleUUIDs = [
      '38b0e68a-6aab-41b7-bc70-bd05adcb828a',
      'd1710dab-3f94-44a4-813c-9ac29db85426',
      '9ca03f32-d593-4ca4-8259-626332e5c849',
    ];
    for (const uid of sampleUUIDs) {
      try {
        const response = await fetch(`/uploads/${uid}.jpg`);
        if (!response.ok) continue;
        const blob = await response.blob();
        const file = new File([blob], `sample_road_${uid.substring(0, 8)}.jpg`, { type: 'image/jpeg' });
        handleFiles([file]);
        return;
      } catch (err) {
        // Continue
      }
    }
    alert('No local sample images found. Please upload a road image from your device.');
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const runDetection = async () => {
    if (!selectedFiles.length) return;
    setIsProcessing(true);
    setProgress(15);

    try {
      if (fileType === 'video') {
        const result = await api.uploadVideo(selectedFiles[0], confThreshold, roadName, (prog) => setProgress(prog));
        setDetectionResults([result]);
      } else {
        setProgress(45);
        const results = await api.uploadImages(selectedFiles, confThreshold, roadName);
        setProgress(90);
        setDetectionResults(results);
      }
      setActivePreviewIndex(0);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.message || 'Unknown error';
      console.error('[Detection Error]', err);
      alert(`Detection failed: ${detail}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const resetStudio = () => {
    setSelectedFiles([]);
    setFileType(null);
    setDetectionResults(null);
    setActivePreviewIndex(0);
  };

  const activeRecord = detectionResults ? detectionResults[activePreviewIndex] : null;

  return (
    <div className="space-y-6">
      
      {/* ── Studio Header Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-black text-white tracking-tight">Detection Studio</h2>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1.5 shadow-sm shadow-cyan-500/10">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>AI Vision Pipeline</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload high-resolution road surface media for instant AI classification & defect extraction.
          </p>
        </div>

        {/* Confidence Threshold & Reset Controls */}
        <div className="flex items-center space-x-3">
          {activeRecord && (
            <button
              onClick={resetStudio}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>New Scan</span>
            </button>
          )}

          <div className="glass-panel p-2.5 rounded-xl border border-white/[0.08] flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Confidence Threshold:</span>
              <span className="text-xs font-bold text-cyan-400 min-w-[38px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/80 text-center">
                {(confThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.90"
              step="0.05"
              value={confThreshold}
              onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
              className="w-24 sm:w-32 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Studio Body Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Left Column: File Upload & Parameter Controls ── */}
        <div className="lg:col-span-5 space-y-4">
          <motion.div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 glass-panel ${
              dragActive
                ? 'border-cyan-400 bg-cyan-950/30 shadow-xl shadow-cyan-500/20'
                : 'border-white/10 hover:border-cyan-500/40 hover:bg-slate-900/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>

            <h3 className="text-base font-extrabold text-white mb-1">
              Drag & Drop Road Inspection Media
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              Upload High-Resolution Images (JPG, PNG) or Video Files (MP4)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-4 py-2 text-xs font-bold text-cyan-300 bg-cyan-500/20 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors inline-block">
                Browse Media Files
              </span>
              <button
                type="button"
                onClick={loadSampleImage}
                className="px-4 py-2 text-xs font-bold text-purple-300 bg-purple-500/20 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-colors inline-flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Load Sample Road Image</span>
              </button>
            </div>
          </motion.div>

          {/* Selected File Details & Run Inference Panel */}
          {selectedFiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-4 rounded-2xl border border-white/[0.08] space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-slate-300 border-b border-white/[0.08] pb-3">
                <span className="font-bold flex items-center space-x-2">
                  {fileType === 'video' ? <Film className="w-4 h-4 text-purple-400" /> : <ImageIcon className="w-4 h-4 text-cyan-400" />}
                  <span>{selectedFiles.length} {fileType === 'video' ? 'Video File' : 'Image File(s)'} Loaded</span>
                </span>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-black bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {fileType}
                </span>
              </div>

              {/* Selected Files List Chips */}
              <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar text-[11px]">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-950/80 border border-white/[0.06] text-slate-300">
                    <span className="truncate max-w-[220px] font-semibold">{f.name}</span>
                    <span className="text-slate-400 text-[10px]">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>

              {/* Road Sector Tag */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 mb-1 block">Road / Highway Sector Tag</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={roadName}
                    onChange={(e) => setRoadName(e.target.value)}
                    placeholder="e.g. Highway Sector A-1"
                    className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Run Inference Action Button */}
              <button
                onClick={runDetection}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center space-x-2 active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processing Media... {progress > 0 ? `${progress}%` : ''}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Run AI Road Damage Analysis</span>
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Right Column: Side-by-Side Media Comparison & Results ── */}
        <div className="lg:col-span-7 space-y-4">
          {isProcessing ? (
            /* AI Processing Scanning Animation */
            <div className="glass-panel p-12 rounded-2xl border border-white/[0.08] text-center flex flex-col items-center justify-center min-h-[420px] relative overflow-hidden">
              <div className="laser-scanner-line" />
              <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 animate-bounce">
                <Sparkles className="w-10 h-10 text-cyan-400" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">AI Vision Engine Processing...</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-6">
                Executing object detection, calculating severity indices, and extracting high-resolution evidence crops.
              </p>
              
              <div className="w-full max-w-md bg-slate-900 h-2.5 rounded-full overflow-hidden border border-white/10">
                <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300" style={{ width: `${progress || 50}%` }} />
              </div>
            </div>
          ) : activeRecord ? (
            /* Active Record Detection Results */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-5"
            >
              
              {/* Header & Controls Toolbar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <div>
                    <h3 className="font-bold text-white text-sm">Inspection Scan & Bounding Layer</h3>
                    <span className="text-[10px] text-slate-400">ID: {activeRecord.detection_id.substring(0, 8)} | Road: {activeRecord.road_name || 'Highway Sector'}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Bounding Box Toggle */}
                  <button
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {showBoundingBoxes ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{showBoundingBoxes ? 'Boxes ON' : 'Boxes OFF'}</span>
                  </button>

                  {/* Fullscreen Zoom */}
                  <button
                    onClick={() => {
                      setZoomModalImage(formatMediaUrl(activeRecord.annotated_output_path || activeRecord.source_path));
                      setZoomLevel(1);
                    }}
                    className="p-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-cyan-400 transition-colors"
                    title="Fullscreen Zoom"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  {/* PDF Download Link */}
                  <a
                    href={api.getPdfReportUrl(activeRecord.detection_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-xs text-cyan-300 hover:bg-cyan-500/30 font-bold transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download PDF</span>
                  </a>
                </div>
              </div>

              {/* Side-by-Side Image Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Original Source Media */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center justify-between">
                    <span>Original Source Image</span>
                    <span className="text-[10px] text-slate-500">{activeRecord.media_type}</span>
                  </span>
                  <div className="rounded-xl border border-white/10 bg-slate-950 overflow-hidden h-60 flex items-center justify-center relative group">
                    {activeRecord.media_type === 'video' ? (
                      <video src={formatMediaUrl(activeRecord.source_path)} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        src={formatMediaUrl(activeRecord.source_path)}
                        alt="Original Upload"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>

                {/* AI Annotated Detection Media */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block flex items-center justify-between">
                    <span>Annotated Output</span>
                    <span className="text-[10px] text-cyan-400 font-extrabold">{activeRecord.total_defects} Defect(s)</span>
                  </span>
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-950 overflow-hidden h-60 flex items-center justify-center relative shadow-inner">
                    {activeRecord.media_type === 'video' ? (
                      <video src={formatMediaUrl(activeRecord.annotated_output_path)} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        src={showBoundingBoxes ? formatMediaUrl(activeRecord.annotated_output_path) : formatMediaUrl(activeRecord.source_path)}
                        alt="Annotated Detection"
                        className="w-full h-full object-contain cursor-pointer"
                        onClick={() => {
                          setZoomModalImage(formatMediaUrl(activeRecord.annotated_output_path));
                          setZoomLevel(1);
                        }}
                      />
                    )}
                  </div>
                </div>

              </div>

              {/* ── Detection Results Cards Section ── */}
              <div className="bg-slate-950/80 rounded-2xl p-4 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Itemized Defect Cards & Recommendations</h4>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                    activeRecord.overall_severity === 'Critical' ? 'severity-badge-critical' :
                    activeRecord.overall_severity === 'High' ? 'severity-badge-high' :
                    activeRecord.overall_severity === 'Medium' ? 'severity-badge-medium' :
                    'severity-badge-low'
                  }`}>
                    {activeRecord.overall_severity} Highest Severity
                  </span>
                </div>

                {/* Per-Object Itemized Animated Cards */}
                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {activeRecord.damage_items && activeRecord.damage_items.length > 0 ? (
                    activeRecord.damage_items.map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-white/[0.08] hover:border-cyan-500/40 transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3.5">
                          {/* High-Res Evidence Crop Preview */}
                          {item.evidence_image_path ? (
                            <img
                              src={formatMediaUrl(item.evidence_image_path)}
                              alt={item.damage_class}
                              className="w-14 h-14 object-cover rounded-xl border border-white/10 hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => {
                                setZoomModalImage(formatMediaUrl(item.evidence_image_path));
                                setZoomLevel(1.5);
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                              <Layers className="w-5 h-5" />
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white text-sm">{item.damage_class}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                item.severity === 'Critical' ? 'severity-badge-critical' :
                                item.severity === 'High' ? 'severity-badge-high' :
                                item.severity === 'Medium' ? 'severity-badge-medium' :
                                'severity-badge-low'
                              }`}>
                                {item.severity}
                              </span>
                            </div>

                            {item.recommendation && (
                              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                                {item.recommendation}
                              </p>
                            )}

                            <span className="text-[10px] text-slate-500 font-mono block">
                              BBox: {Array.isArray(item.bbox_coordinates) ? item.bbox_coordinates.join(', ') : item.bbox_coordinates}
                            </span>
                          </div>
                        </div>

                        {/* Confidence Score Pill */}
                        <div className="sm:text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Confidence</span>
                          <span className="text-sm font-black text-cyan-400">
                            {(item.confidence_score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-6 text-center border border-dashed border-white/10 rounded-xl">
                      <p className="text-xs text-slate-400 italic">No defects detected above {(confThreshold * 100).toFixed(0)}% confidence threshold.</p>
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            /* Empty State Placeholder */
            <div className="glass-panel p-12 rounded-2xl border border-white/[0.08] text-center flex flex-col items-center justify-center min-h-[420px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-4 text-slate-500">
                <Layers className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-white text-base">No Media Analyzed Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 mb-5">
                Upload a road surface image or drone inspection video on the left panel to execute real-time AI damage classification.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ── Fullscreen Image Zoom Modal ── */}
      <AnimatePresence>
        {zoomModalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-5xl w-full h-[85vh] flex flex-col items-center justify-center">
              {/* Modal Controls Bar */}
              <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-slate-900/90 p-2 rounded-xl border border-white/10">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-1.5 text-slate-300 hover:text-cyan-400"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                  className="p-1.5 text-slate-300 hover:text-cyan-400"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZoomModalImage(null)}
                  className="p-1.5 text-slate-300 hover:text-rose-400 ml-2"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fullscreen Image Container */}
              <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar p-4">
                <img
                  src={zoomModalImage}
                  alt="High Resolution Zoom"
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
