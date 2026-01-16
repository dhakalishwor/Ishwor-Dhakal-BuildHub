import React, { useEffect, useState } from "react";
import api from "../../API/axios";
import RateProject from "./RateProject";

export default function CompletedProjects() {
  const [projects, setProjects] = useState([]);
  const [openProjectId, setOpenProjectId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/projects/me/");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const completed = projects.filter((p) => p.status === "COMPLETED");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-emerald-900">Completed Projects</h2>
        <button
          onClick={fetchProjects}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading...</p>}
      {errMsg && <p className="text-red-600">{errMsg}</p>}

      {!loading && !errMsg && completed.length === 0 && (
        <p className="text-slate-500">No completed projects yet.</p>
      )}

      <div className="space-y-3">
        {completed.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{p.title}</h3>
                <p className="text-sm text-slate-600">
                  {p.category} • {p.location}
                </p>
                <p className="mt-2 text-sm">{p.description}</p>
                <p className="mt-2 text-sm font-semibold">Budget: {p.budget}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {p.status}</p>
              </div>

              <button
                onClick={() => setOpenProjectId(openProjectId === p.id ? null : p.id)}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold"
              >
                {openProjectId === p.id ? "Close" : "Rate"}
              </button>
            </div>

            {openProjectId === p.id && (
              <div className="mt-4">
                <RateProject
                  projectId={p.id}
                  onCancel={() => setOpenProjectId(null)}
                  onSuccess={() => {
                    setOpenProjectId(null);
                    fetchProjects();
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
