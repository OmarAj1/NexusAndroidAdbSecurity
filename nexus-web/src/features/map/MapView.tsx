import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Ban } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- CUSTOM MARKER ICON ---
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-icon',
    html: `<div style="
      background-color: #6366f1;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      border: 3px solid rgba(255,255,255,0.8);
      box-shadow: 0 0 15px #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// --- COMPONENT TO HANDLE CLICKS ---
const LocationMarker = ({ setPos, setFakeLocation }: any) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setPos(e.latlng);
      setFakeLocation(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon()}>
      <Popup>Spoofing Active</Popup>
    </Marker>
  );
};

// --- MAIN VIEW ---
export const MapView = () => {
  const native = (window as any).AndroidNative;
  const [activePos, setActivePos] = useState<{lat: number, lng: number} | null>(null);
  const [status, setStatus] = useState("Ready");

  const handleSetLocation = (lat: number, lon: number) => {
    setStatus(`Teleporting...`);
    if (native && native.setFakeLocation) {
      native.setFakeLocation(lat, lon);
      setTimeout(() => setStatus("Active: " + lat.toFixed(4) + ", " + lon.toFixed(4)), 500);
    } else {
      console.log('Native Bridge: Set Fake Location', lat, lon);
    }
  };

  const handleStopLocation = () => {
    setActivePos(null);
    setStatus("Stopped");
    if (native && native.stopFakeLocation) {
      native.stopFakeLocation();
    }
  };

  return (
    <div className="relative h-full w-full bg-black">

      {/* MAP LAYER */}
      <div className="absolute inset-0 z-0">
        <MapContainer
          center={[40.7128, -74.0060]}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#020617' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <LocationMarker
            setPos={setActivePos}
            setFakeLocation={handleSetLocation}
          />
        </MapContainer>
      </div>

      {/* OVERLAY UI */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${activePos ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-muted'}`}>
              {activePos ? <Navigation size={20} className="animate-pulse" /> : <MapPin size={20} />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activePos ? "Spoofing Active" : "Select Location"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS - Lifted to bottom-24 to clear the TabBar */}
      <div className="absolute bottom-24 left-6 right-6 z-[1000] pointer-events-auto flex justify-center">
        {activePos && (
          <button
            onClick={handleStopLocation}
            className="flex items-center gap-2 px-6 py-3 bg-red-500/90 hover:bg-red-600 text-white rounded-full font-bold shadow-lg backdrop-blur transition-all active:scale-95"
          >
            <Ban size={18} />
            Stop Spoofing
          </button>
        )}

        {!activePos && (
          <div className="bg-black/50 text-white/50 text-xs px-4 py-2 rounded-full backdrop-blur border border-white/5">
            Tap map to teleport
          </div>
        )}
      </div>

    </div>
  );
};