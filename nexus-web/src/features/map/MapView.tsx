import React from 'react';

export const MapView = () => {
  // Use "as any" to access the global we defined in useNativeBridge
  const native = (window as any).AndroidNative;

  const handleSetLocation = (lat: number, lon: number) => {
    if (native && native.setFakeLocation) {
      native.setFakeLocation(lat, lon);
    } else {
      console.log('Native Bridge: Set Fake Location', lat, lon);
    }
  };

  const handleStopLocation = () => {
    if (native && native.stopFakeLocation) {
      native.stopFakeLocation();
    } else {
      console.log('Native Bridge: Stop Fake Location');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-black text-white p-6">
      <h2 className="text-2xl font-bold mb-8">GPS Spoofing</h2>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <button
          onClick={() => handleSetLocation(40.7128, -74.0060)}
          className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Teleport to New York
        </button>

        <button
          onClick={() => handleSetLocation(35.6762, 139.6503)}
          className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Teleport to Tokyo
        </button>

        <button
          onClick={handleStopLocation}
          className="p-4 bg-red-600 rounded-lg hover:bg-red-500 transition font-bold mt-4"
        >
          Stop Spoofing
        </button>
      </div>
    </div>
  );
};