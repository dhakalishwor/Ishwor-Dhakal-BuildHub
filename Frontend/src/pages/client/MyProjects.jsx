import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import api from "../../API/axios";
import DashboardLayout from "../../components/DashboardLayout";

export default function MyProjects({
    embedded = false,
    projects: propsProjects,
    loading: propsLoading,
    error: propsError,
    onRefresh: propsOnRefresh,
    onMarkCompleted: propsOnMarkCompleted,
    actionLoadingId: propsActionLoadingId,
    recommended: propsRecommended = []
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Internal state for standalone mode
  const [internalProjects, setInternalProjects] = useState([]);
  const [internalLoading, setInternalLoading] = useState(true);
  const [internalErr, setInternalErr] = useState("");
  const [internalActionLoadingId, setInternalActionLoadingId] = useState(null);

  const projects = embedded ? propsProjects : internalProjects;
  const loading = embedded ? propsLoading : internalLoading;
  const err = embedded ? propsError : internalErr;
  const actionLoadingId = embedded ? propsActionLoadingId : internalActionLoadingId;
  const recommended = embedded ? propsRecommended : (location.state?.recommended || []);

  const highlightIdString = searchParams.get("project");
  const highlightId = highlightIdString ? parseInt(highlightIdString) : location.state?.highlightId;

  const loadProjects = useCallback(async () => {
    if (embedded) return;
    setInternalLoading(true);
    setInternalErr("");
    try {
      const res = await api.get("/api/projects/");
      setInternalProjects(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setInternalErr(e?.response?.data?.detail || "Failed to load projects.");
      setInternalProjects([]);
    } finally {
      setInternalLoading(false);
    }
  }, [embedded]);

  async function markCompleted(projectId) {
    if (embedded && propsOnMarkCompleted) {
      propsOnMarkCompleted(projectId);
      return;
    }
    setInternalActionLoadingId(projectId);
    try {
      await api.patch(`/api/projects/${projectId}/complete/`);
      await loadProjects();
      alert("Project marked as completed!");
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to complete project.");
    } finally {
      setInternalActionLoadingId(null);
    }
  }

  const onRefresh = embedded ? propsOnRefresh : loadProjects;

  useEffect(() => {
    if (!embedded) {
      loadProjects();
    }
  }, [embedded, loadProjects]);

  const HEADER_H = 64;

  const content = (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-emerald-900">My Projects</h1>
        <button
          onClick={onRefresh}
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
            {!embedded && (
              <button
                onClick={() => navigate("/clientdashboard")}
                className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                Back to Dashboard
              </button>
            )}
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
                    highlightId === p.id ? "ring-2 ring-emerald-500 bg-emerald-50" : "",
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
  );

  if (embedded) return content;

  return (
    <DashboardLayout role="client" activeMenu="my-projects">
      {content}
    </DashboardLayout>
  );
}
