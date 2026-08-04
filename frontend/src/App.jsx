import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import DetectionStudio from './components/DetectionStudio';
import MapView from './components/MapView';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans relative bg-[#050811]">
      {/* Background Ambient Gradient Layer */}
      <div className="bg-ambient-glow" />

      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard onNavigateStudio={() => setActiveTab('studio')} />
            )}

            {activeTab === 'studio' && (
              <DetectionStudio />
            )}

            {activeTab === 'map' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Geotagged Damage Map</h2>
                  <p className="text-xs text-slate-400 mt-1">Spatial breakdown of potholes and road hazards across monitored road networks.</p>
                </div>
                <MapView />
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryPage />
            )}

            {activeTab === 'reports' && (
              <ReportsPage />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Commercial SaaS Footer */}
      <footer className="border-t border-white/[0.08] py-5 text-center text-xs text-slate-400 relative z-10 bg-slate-950/80 backdrop-blur-md">
        <span className="font-extrabold text-white">RoadVision AI</span>
        {' '}— Commercial Road Infrastructure Intelligence &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Enterprise Autonomous Inspection Platform
      </footer>
    </div>
  );
}
