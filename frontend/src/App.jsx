import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import DetectionStudio from './components/DetectionStudio';
import MapView from './components/MapView';
import ReportsPage from './pages/ReportsPage';
import TrainingSpecsPage from './pages/TrainingSpecsPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard onNavigateStudio={() => setActiveTab('studio')} />
        )}

        {activeTab === 'studio' && (
          <DetectionStudio />
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Geotagged Road Defect Map</h2>
              <p className="text-sm text-slate-400">Spatial Location Breakdown of Potholes and Cracks on Highway Sector A-1</p>
            </div>
            <MapView />
          </div>
        )}

        {activeTab === 'reports' && (
          <ReportsPage />
        )}

        {activeTab === 'training' && (
          <TrainingSpecsPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Intelligent Road Damage Detection System &copy; {new Date().getFullYear()} — Powered by YOLO11 & PyTorch
      </footer>

    </div>
  );
}
