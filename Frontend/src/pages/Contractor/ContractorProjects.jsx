import React, { useEffect, useState, useCallback } from "react";
import api from "../../API/axios";

export default function ContractorProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/projects/");

      const filtered = res.data.filter(p => p.status !== "BIDDING");
      setProjects(filtered);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (loading) return <div className="p-6">Loading projects...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">My Accepted Projects</h1>
          <p className="text-slate-500">Overview of your active and completed contracts.</p>
        </div>
        <button 
          onClick={fetchProjects}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-6">
        {projects.map((p) => (
          <div key={p.id} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-emerald-900">{p.title}</h3>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {p.status}
                  </span>
                  {p.advance_paid && (
                    <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                      Advance Paid
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-4">{p.category} • {p.location}</p>
                <p className="text-slate-700 line-clamp-3 mb-4">{p.description}</p>
              </div>

              <div className="md:w-64 bg-slate-50 rounded-xl p-4 border border-slate-100 h-fit">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Project Financials</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Budget:</span>
                    <span className="font-bold">Rs. {p.budget}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-bold text-emerald-700">{p.payment_status}</span>
                  </div>
                  {p.final_amount && (
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-slate-500">Received:</span>
                      <span className="font-bold text-emerald-900">Rs. {p.final_amount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8 border-t pt-6">
              {/* Milestones Section */}
              <div>
                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>Standard Milestones</span>
                  <span className="h-px bg-emerald-100 flex-1"></span>
                </h4>
                <div className="space-y-3">
                  {(p.milestones || []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 group">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{m.title}</p>
                        <p className="text-xs text-slate-500">Rs. {m.amount}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                        m.status === "PAID" ? "bg-emerald-100 text-emerald-700" :
                        m.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  ))}
                  {(!p.milestones || p.milestones.length === 0) && (
                    <p className="text-xs italic text-slate-400">No milestones generated for this project.</p>
                  )}
                </div>
              </div>

              {/* Team Section */}
              <div>
                <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span>Assigned Team</span>
                  <span className="h-px bg-emerald-100 flex-1"></span>
                </h4>
                <div className="space-y-3">
                  {(p.assigned_workers || []).map((w) => (
                    <div key={w.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                      <div className="h-8 w-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {w.fullName?.[0] || w.username?.[0] || "W"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{w.fullName || w.username}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{w.hiring_type?.replace("_", " ").toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                  {(!p.assigned_workers || p.assigned_workers.length === 0) && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-dashed text-center">
                      <p className="text-xs text-slate-400">No workers assigned yet.</p>
                      <button 
                        onClick={() => window.location.hash = "hire-workers"} 
                        className="text-emerald-700 text-[10px] font-bold hover:underline mt-1"
                      >
                        Hire Workers Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border border-dashed">
            <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <span className="text-4xl text-emerald-200">🏗️</span>
            </div>
            <h3 className="text-lg font-bold text-emerald-900">No projects yet</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2">
              Browse available projects and submit bids to start your journey with BuildHub.
            </p>
            <button 
               onClick={() => window.location.hash = "projects"}
               className="mt-6 rounded-xl bg-emerald-700 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 shadow-lg shadow-emerald-700/20"
            >
              Browse Projects
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
