import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../API/axios";

// Fix for Leaflet default icon issue with Webpack/Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const initialForm = {
  title: "",
  category: "CIVIL",
  location: "",
  description: "",
  budget: "",
  startDate: "",
  endDate: "",
  latitude: null,
  longitude: null,
};

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function PostProject({ onCreated, onDone }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mapPosition, setMapPosition] = useState(null);

  // Default center for Nepal (approximate)
  const defaultCenter = [27.7172, 85.3240];

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const handleMapClick = (latlng) => {
    setMapPosition(latlng);
    setForm({ ...form, latitude: latlng.lat, longitude: latlng.lng });
  };

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const title = form.title.trim();
      const location = form.location.trim();
      const description = form.description.trim();

      const budgetNum = Number(form.budget);
      if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
        setError("Budget must be a valid number greater than 0.");
        setSaving(false);
        return;
      }

      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        setError("End date cannot be earlier than start date.");
        setSaving(false);
        return;
      }

      const payload = {
        title,
        category: form.category,
        location,
        description,
        budget: budgetNum,
        latitude: form.latitude ? parseFloat(form.latitude.toFixed(9)) : null,
        longitude: form.longitude ? parseFloat(form.longitude.toFixed(9)) : null,
      };

      if (form.startDate) payload.start_date = form.startDate;
      if (form.endDate) payload.end_date = form.endDate;

      const res = await api.post("/api/projects/", payload);

      onCreated?.(res.data);
      onDone?.();
      setForm(initialForm);
      setMapPosition(null);
    } catch (err) {
      const data = err?.response?.data;
      console.log("POST /api/projects/ error:", data);

      let msg = "Failed to post project. Please try again.";

      if (typeof data === "string") {
        msg = data;
      } else if (data?.detail) {
        msg = data.detail;
      } else if (data && typeof data === "object") {
        msg = Object.entries(data)
          .map(([key, val]) => {
            if (Array.isArray(val)) return `${key}: ${val[0]}`;
            if (val && typeof val === "object") return `${key}: ${JSON.stringify(val)}`;
            return `${key}: ${String(val)}`;
          })
          .join(" | ");
      } else if (err?.message) {
        msg = err.message;
      }

      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Post New Project</h1>
          <p className="text-sm text-slate-600">
            Create a project so contractors can bid and you can choose the best one.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDone?.()}
          className="text-sm rounded-lg border px-3 py-2 hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 border">
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            name="title"
            placeholder="Project Title"
            value={form.title}
            onChange={onChange}
            className="w-full border rounded-xl px-4 py-2"
            required
          />

          <select
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full border rounded-xl px-4 py-2"
          >
            <option value="CIVIL">Civil</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="INTERIOR">Interior</option>
            <option value="PAINTING">Painting</option>
            <option value="OTHER">Other</option>
          </select>

          <input
            name="location"
            placeholder="Location (City, Area)"
            value={form.location}
            onChange={onChange}
            className="w-full border rounded-xl px-4 py-2"
            required
          />

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Pick location on map (Optional)
            </label>
            <div className="h-[300px] w-full rounded-xl overflow-hidden border">
              <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationMarker position={mapPosition} setPosition={handleMapClick} />
              </MapContainer>
            </div>
            {form.latitude && (
              <p className="text-xs text-slate-500">
                Coordinates: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <textarea
            name="description"
            placeholder="Project Description"
            value={form.description}
            onChange={onChange}
            rows={4}
            className="w-full border rounded-xl px-4 py-2"
            required
          />

          <input
            name="budget"
            placeholder="Budget"
            value={form.budget}
            onChange={onChange}
            className="w-full border rounded-xl px-4 py-2"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
            />
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 text-white px-6 py-2 rounded-xl hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Posting..." : "Post Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
