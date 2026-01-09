import React, { useEffect, useState } from "react";
import api from "../../API/axios";
import SubmitBid from "./SubmitBid"; // adjust path to your SubmitBid.jsx

export default function AvailableProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      // Change this endpoint to your actual one:
      const res = await api.get("/api/projects/");

      const all = Array.isArray(res.data) ? res.data : [];
      // Only show projects open for bids
      const available = all.filter((p) => p.status === "BIDDING");

      setProjects(available);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load available projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Available Projects</h2>
        <button
          onClick={fetchProjects}
          className="px-3 py-2 rounded bg-emerald-700 text-white"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {errMsg && <p className="text-red-600">{errMsg}</p>}

      {!loading && !errMsg && projects.length === 0 && (
        <p className="text-gray-500">No projects available for bidding right now.</p>
      )}

      <div className="grid gap-3">
        {projects.map((p) => (
          <div key={p.id} className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="font-semibold text-lg">{p.title}</h3>
                <p className="text-sm text-gray-600">{p.category} • {p.location}</p>
                <p className="text-sm mt-2">{p.description}</p>
                <p className="text-sm font-semibold mt-2">Budget: {p.budget}</p>
                <p className="text-xs text-gray-500 mt-1">Status: {p.status}</p>
              </div>

              <button
                onClick={() => setSelectedProjectId(p.id)}
                className="px-3 py-2 rounded bg-emerald-700 text-white whitespace-nowrap"
              >
                Place Bid
              </button>
            </div>

            {/* Inline bid form for selected project */}
            {selectedProjectId === p.id && (
              <div className="mt-4">
                <SubmitBid
                  projectId={p.id}
                  onSuccess={() => {
                    setSelectedProjectId(null);
                    fetchProjects();
                  }}
                />
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="mt-2 text-sm text-gray-600 underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
