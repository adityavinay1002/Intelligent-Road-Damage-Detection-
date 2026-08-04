import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom Map Marker Icons based on severity
const createCustomIcon = (severity) => {
  const colorMap = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#eab308',
    Low: '#22c55e',
  };
  const color = colorMap[severity] || '#06b6d4';

  const svgMarker = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svgMarker,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function MapView({ records = [] }) {
  // Sample geotagged sample points on road networks
  const sampleLocations = [
    { id: 'loc-1', lat: 28.6139, lng: 77.2090, road: 'Highway Sector A-1', damage: 'Pothole', severity: 'Critical' },
    { id: 'loc-2', lat: 28.6250, lng: 77.2180, road: 'Metropolitan Expressway B-4', damage: 'Alligator Crack', severity: 'High' },
    { id: 'loc-3', lat: 28.6050, lng: 77.2250, road: 'Suburban Avenue C-9', damage: 'Longitudinal Crack', severity: 'Medium' },
    { id: 'loc-4', lat: 28.6320, lng: 77.1990, road: 'Ring Road Interchange', damage: 'Transverse Crack', severity: 'Low' },
    { id: 'loc-5', lat: 28.5980, lng: 77.2110, road: 'Highway Sector A-1', damage: 'Pothole', severity: 'High' },
  ];

  return (
    <div className="glass-panel p-4 rounded-2xl border border-slate-800 h-[520px] relative overflow-hidden">
      <MapContainer
        center={[28.6139, 77.2090]}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full rounded-xl z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {sampleLocations.map((loc) => (
          <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={createCustomIcon(loc.severity)}>
            <Popup className="custom-leaflet-popup">
              <div className="p-1">
                <h4 className="font-bold text-slate-900 text-sm">{loc.road}</h4>
                <p className="text-xs text-slate-700 mt-0.5"><b>Damage:</b> {loc.damage}</p>
                <p className="text-xs text-slate-700"><b>Severity:</b> <span className="font-bold">{loc.severity}</span></p>
                <p className="text-[10px] text-slate-500 mt-1">Coordinates: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 right-6 z-10 glass-panel p-3 rounded-xl border border-slate-700/80 bg-slate-950/90 text-xs flex items-center space-x-4">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
          <span className="text-slate-300">Critical</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
          <span className="text-slate-300">High</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
          <span className="text-slate-300">Medium</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
          <span className="text-slate-300">Low</span>
        </div>
      </div>
    </div>
  );
}
