import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const sellerIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
});

const buyerIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const youIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [36, 36],
});

const neighbors = [
  {
    id: 1,
    name: "Sunita Sharma",
    house: "House #7",
    units: 5,
    price: 18,
    type: "seller",
    position: [18.5208, 73.857],
  },
  {
    id: 2,
    name: "Anil Mehta",
    house: "Flat 4B",
    units: 3,
    price: 16,
    type: "seller",
    position: [18.5212, 73.858],
  },
  {
    id: 3,
    name: "Priya Patel",
    house: "House #12",
    units: 8,
    price: 20,
    type: "seller",
    position: [18.5197, 73.8559],
  },
  {
    id: 4,
    name: "Rajesh Kumar",
    house: "Flat 2A",
    units: 0,
    price: 0,
    type: "buyer",
    position: [18.5201, 73.8548],
  },
];

function MapView() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleConnect = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const yourLocation = [18.5204, 73.8567];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#fffdf5', minHeight:'100vh' }}>
      <style>{CSS}</style>

      <h1 className="text-2xl font-bold text-gray-800 mb-4">
        🗺️ Neighborhood Energy Map
      </h1>

      {showSuccess && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg mb-4">
          ⚡ Connection request sent successfully!
        </div>
      )}

      <div className="rounded-xl overflow-hidden border shadow-md">
        <MapContainer
          center={yourLocation}
          zoom={15}
          style={{ height: "500px", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* YOU marker */}
          <Marker position={yourLocation} icon={youIcon}>
            <Popup>
              <strong>You</strong>
              <br />
              Your Solar System
            </Popup>
          </Marker>

          {/* Range circle */}
          <Circle
            center={yourLocation}
            radius={600}
            pathOptions={{ color: "blue", fillOpacity: 0.1 }}
          />

          {/* Neighbor markers */}
          {neighbors.map((n) => (
            <Marker
              key={n.id}
              position={n.position}
              icon={n.type === "seller" ? sellerIcon : buyerIcon}
            >
              <Popup>
                <strong>{n.name}</strong>
                <br />
                {n.house}
                <br />
                {n.type === "seller" ? (
                  <>
                    Selling {n.units} kWh <br />
                    Price ₹{n.price}/kWh <br />
                    <button
                      onClick={handleConnect}
                      style={{
                        marginTop: "6px",
                        background: "#22c55e",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Connect ⚡
                    </button>
                  </>
                ) : (
                  <>
                    Needs Energy <br />
                    <button
                      onClick={handleConnect}
                      style={{
                        marginTop: "6px",
                        background: "#f59e0b",
                        color: "white",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Offer Energy ⚡
                    </button>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-xs text-gray-500">Sellers Nearby</div>
        </div>

        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">600 m</div>
          <div className="text-xs text-gray-500">Trading Radius</div>
        </div>

        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">16 kWh</div>
          <div className="text-xs text-gray-500">Available Energy</div>
        </div>
      </div>
    </div>
  );
}