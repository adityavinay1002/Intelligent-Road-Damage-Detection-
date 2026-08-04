import React from 'react';
import { Cpu, CheckCircle2, AlertCircle, Layers, FileCode, ShieldAlert } from 'lucide-react';

export default function TrainingSpecsPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">YOLO11 Model Architecture & Phase 0 Specifications</h2>
        <p className="text-sm text-slate-400">Road Damage Detection Class Mappings, Training Hyperparameters & Pipeline Setup</p>
      </div>

      {/* Model Spec Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Hyperparameters */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Phase 0 Training Parameters</h3>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Model Backbone:</span>
              <span className="font-bold text-white">YOLO11m (yolo11m.pt)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Dataset Format:</span>
              <span className="font-bold text-white">RDD2022 (Road Damage Detection)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Image Resolution:</span>
              <span className="font-bold text-white">640 x 640 px</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Training Epochs:</span>
              <span className="font-bold text-white">100 Epochs</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Optimizer:</span>
              <span className="font-bold text-cyan-400">AdamW</span>
            </li>
            <li className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Early Stopping:</span>
              <span className="font-bold text-green-400">Enabled (patience=20)</span>
            </li>
            <li className="flex justify-between py-1">
              <span className="text-slate-400">Weight Storage:</span>
              <span className="font-bold text-white">backend/trained_models/best.pt</span>
            </li>
          </ul>
        </div>

        {/* Card 2: Defect Class Mappings */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">RDD2022 Class Taxonomy</h3>
          </div>

          <div className="space-y-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <b className="text-white block">D00 — Longitudinal Crack</b>
                <span className="text-[10px] text-slate-400">Parallel to traffic flow direction</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-800">Class 0</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <b className="text-white block">D10 — Transverse Crack</b>
                <span className="text-[10px] text-slate-400">Perpendicular to traffic flow</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800">Class 1</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <b className="text-white block">D20 — Alligator Crack</b>
                <span className="text-[10px] text-slate-400">Interconnected mesh-like fatigue cracking</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">Class 2</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex justify-between items-center">
              <div>
                <b className="text-white block">D40 — Pothole</b>
                <span className="text-[10px] text-slate-400">Bowl-shaped depression in pavement surface</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800">Class 3</span>
            </div>
          </div>
        </div>

      </div>

      {/* Model Performance Note */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10 space-y-2">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-cyan-400" />
          <h4 className="font-bold text-white text-sm">Evaluation Policy & Metrics Notice</h4>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In strict accordance with system policy, empirical performance metrics (Precision, Recall, F1 Score, mAP50, and mAP50-95) will be benchmarked and populated once Phase 0 training on the complete RDD2022 dataset is completed using <code className="text-cyan-300">python training/evaluate.py</code>.
        </p>
      </div>

    </div>
  );
}
