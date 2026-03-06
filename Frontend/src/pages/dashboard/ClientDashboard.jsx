import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../API/axios";

// utility to combine class names conditionally (mimics common classNames helper)
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

import PostProject from "../client/PostProject";
import ProjectBids from "../client/ProjectBids";
import MyProjects from "../client/MyProjects";
import CostEstimator from "../client/CostEstimator";
import Sidebar from "../../components/Sidebar";
import NotificationBell from "../../components/NotificationBell";

function normalizeProject(p) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    budget: p.budget,
    status: p.status,
    createdAt: p.created_at || "",
    location: p.location || "",
    description: p.description || "",
    rated: !!p.rating,
    payment_status: p.payment_status || "UNPAID",
    final_amount: p.final_amount ?? null,
    hiring_model: p.hiring_model || "PER_PROJECT",
    daily_rate: p.daily_rate || null,
  };
}

function submitEsewaForm(url, payload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function PayWithEsewaButton({ projectId, onStarted }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await api.post(`/api/payments/initiate/${projectId}/`);

      const esewaFormUrl = res.data?.esewa_form_url;
      const payload = res.data?.payload;

      if (!esewaFormUrl) throw new Error("esewa_form_url missing from backend response.");
      if (!payload) throw new Error("payload missing from backend response.");

      if (onStarted) onStarted();

      submitEsewaForm(esewaFormUrl, payload);
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Payment initiation failed.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="mt-2 rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? "Redirecting..." : "Pay with eSewa"}
    </button>
  );
}

function RateProject({ projectId, onDone }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/ratings/", {
        project: projectId,
        rating,
        feedback,
      });
      onDone();
    } catch (e) {
      alert(e?.response?.data?.detail || "Rating failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} Star{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Optional feedback"
      />

      <button
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>
    </form>
  );
}

function MonitoringView({ projects }) {
  const [workLogs, setWorkLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [projectUpdates, setProjectUpdates] = useState([]);
  const [, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
    fetchProjectUpdates();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const [logRes, milRes] = await Promise.all([
        api.get("/api/work-logs/"),
        api.get("/api/milestones/")
      ]);
      setWorkLogs(logRes.data);
      setMilestones(milRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectUpdates() {
    try {
      const res = await api.get("/api/progress-updates/");
      setProjectUpdates(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleApproveProjectUpdate(updateId) {
    try {
      await api.post(`/api/progress-updates/${updateId}/approve/`);
      fetchProjectUpdates();
      alert("Progress update approved!");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to approve update.");
    }
  }

  async function handleRejectProjectUpdate(updateId) {
    const reason = window.prompt("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post(`/api/progress-updates/${updateId}/reject/`, { rejection_reason: reason });
      fetchProjectUpdates();
      alert("Progress update rejected.");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to reject update.");
    }
  }

  async function handleUpdateLogStatus(logId, status) {
    try {
      await api.post(`/api/work-logs/${logId}/${status.toLowerCase()}/`);
      fetchLogs();
      alert(`Work log ${status.toLowerCase()}d!`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to update status.");
    }
  }

  async function handleUpdateMilestoneStatus(milestoneId, status) {
    try {
      await api.patch(`/api/milestones/${milestoneId}/`, { status: status });
      fetchLogs();
      alert(`Milestone ${status.toLowerCase()}!`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      alert("Failed to update milestone.");
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 mb-6">Monitor Progress</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Pending Work Logs (Per Day Basis)</h2>
          <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-500">
              <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Worker</th>
                  <th className="px-6 py-3">Hours</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {workLogs.filter(l => l.status === "PENDING").map((log, idx) => (
                  <tr key={`log-${log.id}-${idx}`}>
                    <td className="px-6 py-4">{log.date}</td>
                    <td className="px-6 py-4">{log.worker_username}</td>
                    <td className="px-6 py-4 font-bold">{log.hours_worked}</td>
                    <td className="px-6 py-4">{log.description}</td>
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={() => handleUpdateLogStatus(log.id, "APPROVE")}
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateLogStatus(log.id, "REJECT")}
                        className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
                {workLogs.filter(l => l.status === "PENDING").length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-slate-400 italic">No pending logs found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Milestones (Fixed Price Project)</h2>
          <div className="grid gap-4">
            {projects.filter(p => p.hiring_model === "PER_PROJECT" && p.status === "ACTIVE").map(p => {
              const projMilestones = milestones.filter(m => m.project === p.id);
              return (
                <div key={`project-${p.id}`} className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-emerald-900">{p.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Status: {p.status}</p>

                  <div className="mt-4 space-y-2">
                    {projMilestones.length === 0 ? (
                      <p className="text-xs italic text-slate-400">No milestones defined for this project.</p>
                    ) : (
                      projMilestones.map((m, idx2) => (
                        <div key={`milestone-${m.id}-${idx2}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed">
                          <div>
                            <p className="text-sm font-semibold">{m.title}</p>
                            <p className="text-xs text-slate-500">NPR {m.amount} • {m.status}</p>
                          </div>
                          {m.status === "COMPLETED" && (
                            <button
                              onClick={() => handleUpdateMilestoneStatus(m.id, "PAID")}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Approve & Pay
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            {projects.filter(p => p.hiring_model === "PER_PROJECT" && p.status === "ACTIVE").length === 0 && (
              <p className="text-slate-400 italic">No active milestones-based projects.</p>
            )}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Project Progress Updates (Review Evidence)</h2>
          <div className="space-y-4">
            {projectUpdates.map((up, idx) => (
              <div key={`update-${up.id}-${idx}`} className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-emerald-900">Project #{up.project}</h3>
                    <p className="text-xs text-slate-500">Posted by {up.posted_by_username} on {new Date(up.created_at).toLocaleString()}</p>
                  </div>
                  <span className={classNames(
                    "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                    up.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                      up.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  )}>
                    {up.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                  <div>
                    <p className="text-sm text-slate-700 whitespace-pre-line italic">"{up.description}"</p>
                    {up.rejection_reason && (
                      <p className="mt-2 text-xs text-red-600"><b>Rejection Reason:</b> {up.rejection_reason}</p>
                    )}

                    {up.status === "PENDING" && (
                      <div className="mt-6 flex gap-3">
                        <button
                          onClick={() => handleApproveProjectUpdate(up.id)}
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800"
                        >
                          Approve Progress
                        </button>
                        <button
                          onClick={() => handleRejectProjectUpdate(up.id)}
                          className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                  {up.photo && (
                    <div className="relative group">
                      <img
                        src={up.photo}
                        alt="Evidence"
                        className="w-full h-40 object-cover rounded-xl border cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(up.photo, '_blank')}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                        <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded">View Full Image</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {projectUpdates.length === 0 && (
              <div className="text-center py-12 rounded-2xl border bg-slate-50 border-dashed">
                <p className="text-slate-400 italic text-sm">No project progress updates to review.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
export default function ClientDashboard() {

  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [ratingProjectId, setRatingProjectId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [recommendedContractors, setRecommendedContractors] = useState([]);

  // NEW: optional state to pass estimate info into PostProject (if you decide to use it there)
  const [prefillEstimate, setPrefillEstimate] = useState(null);

  async function loadProjects() {
    setLoadingProjects(true);
    setProjectsError("");
    try {
      const res = await api.get("/api/projects/");
      const list = Array.isArray(res.data) ? res.data.map(normalizeProject) : [];
      setProjects(list);
    } catch (e) {
      setProjectsError(e?.response?.data?.detail || "Failed to load projects.");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function markCompleted(projectId) {
    setActionLoadingId(projectId);
    try {
      await api.patch(`/api/projects/${projectId}/complete/`);
      await loadProjects();
      alert("Project marked as completed! Now you can pay the accepted bid amount.");
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to complete project.");
    } finally {
      setActionLoadingId(null);
    }
  }

  const location = useLocation();

  useEffect(() => {
    loadProjects();
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }

    if (searchParams.get("paid") === "1") {
      loadProjects();
      setActiveMenu("my-projects");
    }

    const menuParam = searchParams.get("menu");
    if (menuParam) {
      setActiveMenu(menuParam);
    }
  }, [location.state?.activeMenu, searchParams]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.category, p.status, p.location].join(" ").toLowerCase().includes(q)
    );
  }, [search, projects]);

  const stats = useMemo(() => {
    const paidProjects = projects.filter(
      (p) => p.status === "COMPLETED" && p.payment_status === "PAID"
    );

    const totalPaidAmount = paidProjects.reduce(
      (sum, p) => sum + Number(p.final_amount || 0),
      0
    );

    return {
      active: projects.filter((p) => p.status === "ACTIVE").length,
      bidding: projects.filter((p) => p.status === "BIDDING").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      paid: paidProjects.length,
      totalPaidAmount,
    };
  }, [projects]);

  const HEADER_H = 64;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">BuildHub</p>
              <p className="text-xs text-slate-500">Client Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveMenu("postproject")}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Post Project
            </button>
            <NotificationBell />
          </div>
        </div>
      </header>

      <div
        className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]"
        style={{ minHeight: `calc(100vh - ${HEADER_H}px)` }}
      >
        <Sidebar
          role="client"
          activeMenu={activeMenu}
          onItemClick={(key) => {
            if (key === "messages") {
              navigate("/messages");
              return;
            }
            if (key === "report-issue") {
              navigate("/support/report");
              return;
            }
            if (key === "my-issues") {
              navigate("/support/my-issues");
              return;
            }
            // Update URL to match selected menu to prevent useEffect loops
            navigate(`/clientdashboard?menu=${key}`, { replace: true });
            setActiveMenu(key);
            if (key !== "my-projects") setRecommendedContractors([]);
          }}
        />


        <main className="p-6">
          {activeMenu === "dashboard" && (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="mb-4 w-full rounded-xl border px-4 py-2"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                <div className="border p-4 rounded-xl">Active: {stats.active}</div>
                <div className="border p-4 rounded-xl">Bidding: {stats.bidding}</div>
                <div className="border p-4 rounded-xl">Completed: {stats.completed}</div>
                <div className="border p-4 rounded-xl">Paid: {stats.paid}</div>
                <div className="border p-4 rounded-xl bg-emerald-50 text-emerald-900 font-semibold">
                  Total Paid: NPR {stats.totalPaidAmount}
                </div>
              </div>

              {loadingProjects && <p>Loading...</p>}
              {projectsError && <p className="text-red-600">{projectsError}</p>}

              <div className="space-y-4">
                {filteredProjects.map((p) => (
                  <div key={p.id} className="border rounded-xl p-4">
                    <h3 className="font-bold">{p.title}</h3>
                    <p className="text-sm">
                      {p.category} • {p.location}
                    </p>
                    <p className="text-sm mt-1">
                      Status: {p.status} • Payment: {p.payment_status}
                    </p>

                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => markCompleted(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {actionLoadingId === p.id ? "Completing..." : "Mark Completed"}
                      </button>
                    )}

                    {p.status === "COMPLETED" && p.payment_status !== "PAID" && (
                      <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                        <p className="text-sm text-yellow-900 font-semibold">
                          Pay accepted bid amount to finish this project
                        </p>
                        <PayWithEsewaButton projectId={p.id} onStarted={() => { }} />
                      </div>
                    )}

                    {p.status === "COMPLETED" && p.payment_status === "PAID" && (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                        <p className="text-sm text-emerald-900 font-semibold">
                          Paid ✅ {p.final_amount ? `NPR ${p.final_amount}` : ""}
                        </p>
                      </div>
                    )}

                    {p.status === "COMPLETED" && p.payment_status === "PAID" && !p.rated && (
                      <>
                        <button
                          onClick={() => setRatingProjectId(ratingProjectId === p.id ? null : p.id)}
                          className="mt-2 rounded-lg bg-emerald-700 px-3 py-1 text-xs text-white"
                        >
                          Rate Project
                        </button>

                        {ratingProjectId === p.id && (
                          <RateProject
                            projectId={p.id}
                            onDone={() => {
                              setRatingProjectId(null);
                              loadProjects();
                            }}
                          />
                        )}
                      </>
                    )}

                    {p.status === "COMPLETED" && p.payment_status === "PAID" && p.rated && (
                      <p className="mt-2 text-xs text-emerald-700 font-semibold">Already Rated</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeMenu === "estimate" && (
            <CostEstimator
              onUseEstimate={(data) => {
                setPrefillEstimate(data);
                setActiveMenu("postproject");
              }}
            />
          )}

          {activeMenu === "my-projects" && (
            <MyProjects
              embedded={true}
              projects={projects}
              loading={loadingProjects}
              error={projectsError}
              onRefresh={loadProjects}
              onMarkCompleted={markCompleted}
              actionLoadingId={actionLoadingId}
              ratingProjectId={ratingProjectId}
              setRatingProjectId={setRatingProjectId}
              onRated={loadProjects}
              onPaymentStarted={() => { }}
              recommendedContractors={recommendedContractors}
            />
          )}

          {activeMenu === "postproject" && (
            <PostProject
              embedded={true}
              prefillEstimate={prefillEstimate}
              onCreated={(data) => {
                loadProjects();
                setRecommendedContractors(data.recommended_contractors || data.recommended || []);
                setActiveMenu("my-projects");
              }}
            />
          )}

          {activeMenu === "project-bids" && <ProjectBids embedded={true} onDone={() => setActiveMenu("dashboard")} />}

          {activeMenu === "monitoring" && <MonitoringView projects={projects} />}

          {activeMenu === "profile" && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-900">PROFILE</h2>
              <p className="mt-2 text-sm text-slate-600">This page is for profile.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
