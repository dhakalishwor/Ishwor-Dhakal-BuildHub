import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix for default Leaflet icon not showing correctly in some builds
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ProjectMap({ latitude, longitude, title, height = "200px" }) {
  if (!latitude || !longitude) return null;

  const position = [parseFloat(latitude), parseFloat(longitude)];

  return (
    <div className="rounded-xl overflow-hidden border mt-3" style={{ height }}>
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {title && (
            <Popup>
              <div className="text-xs font-bold text-emerald-900">{title}</div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
