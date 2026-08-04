import React, { useState, useRef } from 'react';
import { Upload, Sliders, Image as ImageIcon, Film, Download, FileText, CheckCircle, AlertTriangle, Eye, EyeOff, Layers, RefreshCw, Sparkles, ChevronLeft, ChevronRight, AlertOctagon, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

export default function DetectionStudio() {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [roadName, setRoadName] = useState('Highway Sector A-1');
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [detectionResults, setDetectionResults] = useState(null); // Record(s) from backend
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);

  const fileInputRef = useRef(null);

  const formatUrl = (pathStr) => {
    if (!pathStr) return '';
    const cleanPath = pathStr.replace(/^\/+/, '');
    return `/${cleanPath}`;
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList);
    if (!files.length) return;

    setSelectedFiles(files);
    
    // Auto-detect whether uploaded files are images or video
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
    try {
      const response = await fetch('/uploads/9ca03f32-d593-4ca4-8259-626332e5c849.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'sample_pothole_road.jpg', { type: 'image/jpeg' });
      handleFiles([file]);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
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
    setProgress(0);

    try {
      if (fileType === 'video') {
        const result = await api.uploadVideo(selectedFiles[0], confThreshold, roadName, (prog) => setProgress(prog));
        setDetectionResults([result]);
      } else {
        const results = await api.uploadImages(selectedFiles, confThreshold, roadName);
        setDetectionResults(results);
      }
      setActivePreviewIndex(0);
    } catch (err) {
      alert(`Detection failed: ${err?.response?.data?.detail || err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeRecord = detectionResults ? detectionResults[activePreviewIndex] : null;

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Detection Studio</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>YOLO11 AI Engine</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-Time Road Surface Inspection & Media Defect Classifier</p>
        </div>

        {/* Confidence Threshold Control */}
        <div className="glass-panel p-3 rounded-xl border border-slate-800 flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">Conf Threshold:</span>
            <span className="text-xs font-bold text-cyan-400 min-w-[36px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
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
            className="w-28 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Studio Main Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Media Upload Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 glass-panel ${
              dragActive ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/20' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
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

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8 text-cyan-400" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">
              Drag & Drop Road Inspection Media
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4">
              Supports High-Resolution Road Images (JPG, PNG) & Drone Surveillance Video (MP4)
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-4 py-2 text-xs font-bold text-cyan-300 bg-cyan-500/20 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors inline-block">
                Browse Files from Computer
              </span>
              <button
                id="load-sample-btn"
                type="button"
                onClick={loadSampleImage}
                className="px-4 py-2 text-xs font-bold text-purple-300 bg-purple-500/20 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition-colors inline-flex items-center space-x-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Load Sample Road Image</span>
              </button>
            </div>
          </div>

          {/* Selected File Details & Control Panel */}
          {selectedFiles.length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-300 border-b border-slate-800 pb-2.5">
                <span className="font-semibold flex items-center space-x-2">
                  {fileType === 'video' ? <Film className="w-4 h-4 text-purple-400" /> : <ImageIcon className="w-4 h-4 text-cyan-400" />}
                  <span>{selectedFiles.length} {fileType === 'video' ? 'Video File' : 'Image(s)'} Selected</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-slate-800 text-cyan-400 border border-slate-700">
                  {fileType}
                </span>
              </div>

              {/* Selected Files List Preview */}
              <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar text-[11px]">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 rounded bg-slate-900 text-slate-300">
                    <span className="truncate max-w-[200px]">{f.name}</span>
                    <span className="text-slate-500 text-[10px]">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>

              {/* Road Sector Tag */}
              <div>
                <label className="text-[11px] font-medium text-slate-400 mb-1 block">Road / Highway Sector Tag</label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Run Inference Button */}
              <button
                id="run-detection-btn"
                onClick={runDetection}
                disabled={isProcessing}
                className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analyzing Media... {progress > 0 ? `${progress}%` : ''}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run YOLO11 Detection</span>
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                  <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300" style={{ width: `${progress || 45}%` }}></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Side-by-Side Media Preview & Object Summary */}
        <div className="lg:col-span-7 space-y-4">
          {activeRecord ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">
              
              {/* Header & Controls Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <div>
                    <h3 className="font-bold text-white text-sm">Inspection Result & Bounding Layer</h3>
                    <span className="text-[10px] text-slate-400">ID: {activeRecord.detection_id.substring(0, 8)} | Road: {activeRecord.road_name}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Bounding Box Toggle */}
                  <button
                    id="toggle-boxes-btn"
                    onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    {showBoundingBoxes ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{showBoundingBoxes ? 'Boxes ON' : 'Boxes OFF'}</span>
                  </button>

                  {/* PDF Download Link */}
                  <a
                    id="download-pdf-btn"
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

              {/* Pagination control if multiple records */}
              {detectionResults && detectionResults.length > 1 && (
                <div className="flex items-center justify-between bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    disabled={activePreviewIndex === 0}
                    onClick={() => setActivePreviewIndex(prev => prev - 1)}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 text-cyan-400" />
                  </button>
                  <span className="text-slate-300 font-semibold">
                    File {activePreviewIndex + 1} of {detectionResults.length}
                  </span>
                  <button
                    disabled={activePreviewIndex === detectionResults.length - 1}
                    onClick={() => setActivePreviewIndex(prev => prev + 1)}
                    className="p-1 rounded hover:bg-slate-800 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              )}

              {/* Side-by-Side Image Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Original Source Media */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block flex items-center justify-between">
                    <span>Original Input</span>
                    <span className="text-[10px] text-slate-500">{activeRecord.media_type}</span>
                  </span>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden h-56 flex items-center justify-center">
                    {activeRecord.media_type === 'video' ? (
                      <video src={formatUrl(activeRecord.source_path)} controls className="w-full h-full object-contain" />
                    ) : (
                      <img id="original-image-preview" src={formatUrl(activeRecord.source_path)} alt="Original Input" className="w-full h-full object-contain" />
                    )}
                  </div>
                </div>

                {/* YOLO Annotated Media */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block flex items-center justify-between">
                    <span>YOLO11 Detection</span>
                    <span className="text-[10px] text-cyan-400 font-bold">{activeRecord.total_defects} Defect(s)</span>
                  </span>
                  <div className="rounded-xl border border-cyan-500/30 bg-slate-950 overflow-hidden h-56 flex items-center justify-center relative shadow-inner">
                    {activeRecord.media_type === 'video' ? (
                      <video src={formatUrl(activeRecord.annotated_output_path)} controls className="w-full h-full object-contain" />
                    ) : (
                      <img
                        id="annotated-image-preview"
                        src={showBoundingBoxes ? formatUrl(activeRecord.annotated_output_path) : formatUrl(activeRecord.source_path)}
                        alt="Annotated Detection"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Damage Summary Statistics & List */}
              <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Detected Defect List & Severity</h4>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                    activeRecord.overall_severity === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    activeRecord.overall_severity === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    activeRecord.overall_severity === 'Medium' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                    'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}>
                    {activeRecord.overall_severity} Overall Severity
                  </span>
                </div>

                {/* Per-Object Itemized Damage List */}
                <div id="damage-items-container" className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                  {activeRecord.damage_items && activeRecord.damage_items.length > 0 ? (
                    activeRecord.damage_items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/90 text-xs hover:border-slate-700 transition-colors">
                        
                        <div className="flex items-center space-x-3">
                          {/* Evidence crop thumbnail if available */}
                          {item.evidence_image_path ? (
                            <img
                              src={formatUrl(item.evidence_image_path)}
                              alt={item.damage_class}
                              className="w-10 h-10 object-cover rounded border border-slate-700"
                            />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                          )}

                          <div>
                            <span className="font-bold text-white block text-xs">{item.damage_class}</span>
                            <span className="text-[10px] text-slate-400">BBox: {Array.isArray(item.bbox_coordinates) ? item.bbox_coordinates.join(', ') : item.bbox_coordinates}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Confidence</span>
                            <span className="text-xs font-bold text-cyan-400">{(item.confidence_score * 100).toFixed(1)}%</span>
                          </div>

                          <span className={`px-2.5 py-1 rounded font-extrabold text-[10px] uppercase border ${
                            item.severity === 'Critical' ? 'bg-red-950/80 text-red-400 border-red-800' :
                            item.severity === 'High' ? 'bg-orange-950/80 text-orange-400 border-orange-800' :
                            item.severity === 'Medium' ? 'bg-amber-950/80 text-amber-400 border-amber-800' :
                            'bg-green-950/80 text-green-400 border-green-800'
                          }`}>
                            {item.severity}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center border border-dashed border-slate-800 rounded-lg">
                      <p className="text-xs text-slate-400 italic">No defects detected above {(confThreshold * 100).toFixed(0)}% confidence threshold.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center h-full min-h-[380px]">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
                <Layers className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="font-bold text-white text-base">No Media Analyzed Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                Upload a road surface image or inspection video on the left panel, adjust parameters, and run YOLO11 detection to view instant side-by-side analysis.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
