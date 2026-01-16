import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../API/axios";

export default function MyProjects() {
  const navigate = useNavigate();
  const location = useLocation();

  const highlightId = location.state?.highlightId;
  const recommended = location.state?.recommended || [];

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function loadProjects() {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/api/projects/");
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load projects.");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }

  async function markCompleted(projectId) {
    setActionLoadingId(projectId);
    try {
      await api.patch(`/api/projects/${projectId}/complete/`);
      await loadProjects();
      alert("Project marked as completed!");
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to complete project.");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-emerald-50">
      <aside className="bg-emerald-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">Client Menu</h2>

        <button
          onClick={() => navigate("/clientdashboard")}
          className="w-full mb-3 rounded-xl px-4 py-2 bg-emerald-700 hover:bg-emerald-800"
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/client/postproject")}
          className="w-full rounded-xl px-4 py-2 bg-emerald-800 hover:bg-emerald-700"
        >
          Post Project
        </button>
      </aside>

      <main className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl font-bold text-emerald-900">My Projects</h1>

            <button
              onClick={loadProjects}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-white"
            >
              Refresh
            </button>
          </div>

          {recommended.length > 0 && (
            <div className="mb-6 rounded-2xl border bg-emerald-100/60 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-emerald-900">
                    Recommended Contractors
                  </h2>
                  <p className="text-sm text-emerald-900/80">
                    Based on your posted project category
                  </p>
                </div>

                <button
                  onClick={() => navigate("/clientdashboard")}
                  className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {recommended.map((c) => (
                  <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <p className="font-semibold text-emerald-900">{c.fullName}</p>
                    <p className="text-sm text-slate-600">
                      Experience: {c.experienceYears} years
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Project Types: {(c.projectTypes || []).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white p-6 rounded-xl shadow text-sm text-emerald-900">
              Loading projects...
            </div>
          )}

          {err && !loading && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
              {err}
            </div>
          )}

          {!loading && !err && projects.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow">
              No projects posted yet.
            </div>
          ) : (
            !loading &&
            !err && (
              <div className="grid gap-4">
                {projects.map((p) => {
                  const alreadyRated = !!p.rating;
                  return (
                    <div
                      key={p.id}
                      className={[
                        "bg-white rounded-xl shadow p-5 border",
                        highlightId === p.id ? "ring-2 ring-emerald-300" : "",
                      ].join(" ")}
                    >
                      <div className="flex justify-between items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-emerald-900">{p.title}</h3>
                          <p className="text-sm text-slate-500">
                            {p.category} • {p.location}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                            {p.status}
                          </span>

                          {p.status === "ACTIVE" && (
                            <button
                              onClick={() => markCompleted(p.id)}
                              disabled={actionLoadingId === p.id}
                              className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                              {actionLoadingId === p.id ? "Completing..." : "Mark Completed"}
                            </button>
                          )}

                          {p.status === "COMPLETED" && alreadyRated && (
                            <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                              Already Rated
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-700">{p.description}</p>

                      <p className="mt-2 text-sm">
                        Budget: <b>{p.budget}</b>
                      </p>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
