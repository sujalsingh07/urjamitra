import { useState } from 'react';

const neighbors = [
  { id: 1, name: 'Sunita Sharma', house: 'House #7', units: 5, price: 18, status: 'selling', top: '35%', left: '45%', color: 'bg-green-500' },
  { id: 2, name: 'Anil Mehta', house: 'Flat 4B', units: 3, price: 16, status: 'selling', top: '55%', left: '65%', color: 'bg-green-500' },
  { id: 3, name: 'Priya Patel', house: 'House #12', units: 8, price: 20, status: 'selling', top: '25%', left: '70%', color: 'bg-green-500' },
  { id: 4, name: 'Rajesh Kumar', house: 'Flat 2A', units: 0, price: 0, status: 'buying', top: '65%', left: '30%', color: 'bg-red-500' },
  { id: 5, name: 'Meera Joshi', house: 'House #3', units: 2, price: 17, status: 'selling', top: '45%', left: '20%', color: 'bg-yellow-500' },
];

function MapView() {
  const [selected, setSelected] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleConnect = () => {
    setShowSuccess(true);
    setSelected(null);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🗺️ Neighborhood Map</h1>
        <p className="text-gray-500 text-sm mt-1">
          Tap any marker to see energy details and connect
        </p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-gray-600">Selling Energy</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Needs Energy</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600">Low Stock</span>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-100 text-sm">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">You</span>
        </div>
      </div>

      {/* Success Toast */}
      {showSuccess && (
        <div className="bg-green-500 text-white rounded-xl px-5 py-3 mb-4 flex items-center gap-2">
          ✅ Connection request sent! You'll be notified when confirmed.
        </div>
      )}

      {/* Map Container */}
      <div className="relative bg-gradient-to-br from-green-50 via-blue-50 to-yellow-50 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-inner"
        style={{ height: '480px' }}>

        {/* Grid lines to simulate map */}
        <div className="absolute inset-0 opacity-20">
          {[20, 40, 60, 80].map(p => (
            <div key={`h${p}`} className="absolute w-full border-t border-gray-400" style={{ top: `${p}%` }}></div>
          ))}
          {[20, 40, 60, 80].map(p => (
            <div key={`v${p}`} className="absolute h-full border-l border-gray-400" style={{ left: `${p}%` }}></div>
          ))}
        </div>

        {/* Road lines */}
        <div className="absolute bg-gray-200 opacity-60" style={{ top: '50%', left: 0, right: 0, height: '12px', transform: 'translateY(-50%)' }}></div>
        <div className="absolute bg-gray-200 opacity-60" style={{ left: '50%', top: 0, bottom: 0, width: '12px', transform: 'translateX(-50%)' }}></div>

        {/* Area labels */}
        <div className="absolute top-3 left-3 text-xs text-gray-400 font-medium">Maple Lane</div>
        <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">Green Residency</div>
        <div className="absolute top-3 right-3 text-xs text-gray-400 font-medium">Rose Garden</div>

        {/* YOU marker */}
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20" style={{ top: '50%', left: '50%' }}>
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold">
              YOU
            </div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rotate-45"></div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
          </div>
        </div>

        {/* Neighbor markers */}
        {neighbors.map((n) => (
          <div
            key={n.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ top: n.top, left: n.left }}
            onClick={() => setSelected(selected?.id === n.id ? null : n)}
          >
            <div className="relative group">
              <div className={`w-9 h-9 ${n.color} rounded-full border-3 border-white shadow-md flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform`}
                style={{ border: '3px solid white' }}>
                {n.name.charAt(0)}
              </div>
              {/* Name tooltip */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {n.name}
              </div>
            </div>
          </div>
        ))}

        {/* Range circle around YOU */}
        <div className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-300 border-dashed opacity-30"
          style={{ top: '50%', left: '50%', width: '200px', height: '200px' }}>
        </div>

        {/* Selected popup */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-xl shadow-xl p-4 border border-gray-100 z-30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${selected.color} rounded-full flex items-center justify-center text-white font-bold`}>
                  {selected.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{selected.name}</h3>
                  <p className="text-xs text-gray-500">🏠 {selected.house}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>

            {selected.status === 'selling' ? (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="font-bold text-gray-800">₹{selected.price}/kWh</div>
                    <div className="text-xs text-gray-400">Price</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-800">{selected.units} kWh</div>
                    <div className="text-xs text-gray-400">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">● Selling</div>
                    <div className="text-xs text-gray-400">Status</div>
                  </div>
                </div>
                <button
                  onClick={handleConnect}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
                >
                  Connect ⚡
                </button>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <div className="text-red-500 font-medium text-sm">🔴 Needs Energy</div>
                <button
                  onClick={handleConnect}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
                >
                  Offer Energy ⚡
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats below map */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">4</div>
          <div className="text-xs text-gray-500 mt-1">Sellers Nearby</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">1.1 km</div>
          <div className="text-xs text-gray-500 mt-1">Max Distance</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">18 kWh</div>
          <div className="text-xs text-gray-500 mt-1">Total Available</div>
        </div>
      </div>
    </div>
  );
}

export default MapView;