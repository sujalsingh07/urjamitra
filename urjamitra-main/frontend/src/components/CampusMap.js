import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const greenIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
  iconSize: [32, 32],
});

const blueIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
  iconSize: [32, 32],
});

const redIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32],
});

const devices = [
  {
    id: 1,
    name: "House #14B",
    energy: "Selling 2 kWh",
    position: [18.5204, 73.8567],
    type: "seller",
  },
  {
    id: 2,
    name: "Flat 4B",
    energy: "Buying 1 kWh",
    position: [18.5212, 73.8574],
    type: "buyer",
  },
  {
    id: 3,
    name: "Sunita's Home",
    energy: "High demand area",
    position: [18.5198, 73.8559],
    type: "demand",
  },
];

function CampusMap() {
  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={[18.5204, 73.8567]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {devices.map((device) => {
          let icon;

          if (device.type === "seller") icon = greenIcon;
          else if (device.type === "buyer") icon = blueIcon;
          else icon = redIcon;

          return (
            <Marker key={device.id} position={device.position} icon={icon}>
              <Popup>
                <strong>{device.name}</strong>
                <br />
                {device.energy}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default CampusMap;