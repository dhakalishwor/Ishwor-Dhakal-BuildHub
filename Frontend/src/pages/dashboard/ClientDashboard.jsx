import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../API/axios";
import { toast } from "react-hot-toast";
import { promptToast } from "../../components/ConfirmToast";

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
import PayWithEsewaButton from "../client/PayWithEsewaButton";

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
    contractor_details: p.contractor_details || null,
    assigned_workers: p.assigned_workers || [],
    advance_paid: p.advance_paid,
    work_completed: p.work_completed,
    milestones: p.milestones || [],
  };
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
      toast.success("Rating submitted successfully!");
      onDone();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Rating failed");
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
      const milRes = await api.get("/api/milestones/");
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
      fetchLogs(); // Sync milestones
      toast.success("Progress update approved!");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Failed to approve update.");
    }
  }

  async function handleRejectProjectUpdate(updateId) {
    const reason = await promptToast("Enter rejection reason:");
    if (reason === null) return;
    try {
      await api.post(`/api/progress-updates/${updateId}/reject/`, { rejection_reason: reason });
      fetchProjectUpdates();
      fetchLogs(); // Sync milestones
      toast.success("Progress update rejected.");
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Failed to reject update.");
    }
  }

  async function handleUpdateLogStatus(logId, status) {
    try {
      await api.post(`/api/work-logs/${logId}/${status.toLowerCase()}/`);
      fetchLogs();
      toast.success(`Work log ${status.toLowerCase()}d!`);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      toast.error("Failed to update status.");
    }
  }


  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-emerald-900 mb-6">Monitor Progress</h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Project Assignments (Team)</h2>
          <div className="grid gap-4">
            {projects.filter(p => p.status === "ACTIVE").map(p => (
              <div key={`team-${p.id}`} className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-bold text-emerald-900">{p.title}</h3>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest">Hired Contractor</p>
                    {p.contractor_details ? (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold">
                          {p.contractor_details.fullName?.[0] || "C"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{p.contractor_details.fullName}</p>
                          <p className="text-xs text-slate-500">{p.contractor_details.specialization || "Contractor"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400 italic">No contractor assigned yet.</p>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assigned Workers</p>
                    <div className="mt-3 space-y-2">
                      {p.assigned_workers && p.assigned_workers.length > 0 ? (
                        p.assigned_workers.map(w => (
                          <div key={`worker-${w.id}`} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                              {w.fullName?.[0] || "W"}
                            </div>
                            <p className="text-xs font-medium text-slate-700">{w.fullName}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-bold uppercase">{w.hiring_type === "PER_DAY" ? "Daily" : "Project"}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic">No workers assigned yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
                            <PayWithEsewaButton 
                              projectId={p.id} 
                              paymentType="MILESTONE" 
                              milestoneId={m.id}
                              label="Approve & Pay"
                            />
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
                    <h3 className="font-bold text-emerald-900">Project #{up.project} {up.milestone_title && <span className="text-emerald-600 ml-1">({up.milestone_title})</span>}</h3>
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

                    {up.status === "APPROVED" && up.milestone && milestones.find(m => m.id === up.milestone && m.status === "COMPLETED") && (
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Payment Ready</p>
                          <p className="text-sm text-emerald-900 font-semibold mt-1">
                            Milestone "{milestones.find(m => m.id === up.milestone).title}" is completed.
                          </p>
                        </div>
                        <PayWithEsewaButton 
                          projectId={up.project} 
                          paymentType="MILESTONE" 
                          milestoneId={up.milestone} 
                          label={`Pay Rs. ${milestones.find(m => m.id === up.milestone).amount}`}
                        />
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
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [ratingProjectId, setRatingProjectId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [recommendedContractors, setRecommendedContractors] = useState(location.state?.recommended || []);
  const [highlightProjectId, setHighlightProjectId] = useState(location.state?.highlightId || null);

  // NEW: optional state to pass estimate info into PostProject (if you decide to use it there)
  const [prefillEstimate, setPrefillEstimate] = useState(null);

  const [profile, setProfile] = useState({
    fullName: "",
    phone: "",
    address: "",
    bio: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);

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
      toast.success("Project marked as completed! Now you can pay the accepted bid amount.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to complete project.");
    } finally {
      setActionLoadingId(null);
    }
  }


  useEffect(() => {
    loadProjects();
    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }
    
    // Pick up recommendations from state if available
    if (location.state?.recommended) {
      setRecommendedContractors(location.state.recommended);
    }
    if (location.state?.highlightId) {
      setHighlightProjectId(location.state.highlightId);
    }

    if (searchParams.get("paid") === "1") {
      loadProjects();
      setActiveMenu("my-projects");
    }

    const menuParam = searchParams.get("menu");
    if (menuParam) {
      setActiveMenu(menuParam);
    }

    if (activeMenu === "profile") {
      fetchProfile();
    }
  }, [location.state?.activeMenu, searchParams, activeMenu]);

  async function fetchProfile() {
    setProfileLoading(true);
    try {
      const res = await api.get("/api/clients/me/");
      setProfile({
        fullName: res.data.fullName || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
        bio: res.data.bio || ""
      });
    } catch (err) {
      console.error("fetchProfile failed", err);
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
      await api.patch("/api/clients/me/", profile);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Update failed");
    }
  }

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
              onClick={() => {
                setRecommendedContractors([]);
                setHighlightProjectId(null);
                setActiveMenu("postproject");
                navigate("/clientdashboard?menu=postproject", { replace: true, state: {} });
              }}
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
            setRecommendedContractors([]);
            setHighlightProjectId(null);
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
                        <PayWithEsewaButton projectId={p.id} />
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
              recommended={recommendedContractors}
              highlightId={highlightProjectId}
            />
          )}

          {activeMenu === "postproject" && (
            <PostProject
              embedded={true}
              prefillEstimate={prefillEstimate}
              onDone={() => { }} // Prevent navigation
               onCreated={(data) => {
                console.log("PROJECT CREATED DATA:", data);
                loadProjects();
                const recs = data.recommended_contractors || data.recommended || [];
                console.log("SETTING RECOMMENDED CONTRACTORS:", recs);
                
                // Sync BOTH local state and navigation state
                setRecommendedContractors(recs);
                setHighlightProjectId(data.id);
                
                navigate("/clientdashboard?menu=my-projects", { 
                  replace: true, 
                  state: { 
                    recommended: recs,
                    highlightId: data.id,
                    activeMenu: "my-projects"
                  } 
                });
                setActiveMenu("my-projects");
                toast.success("Project posted! Scroll down to see details and recommendations.");
              }}
            />
          )}

          {activeMenu === "project-bids" && <ProjectBids embedded={true} onDone={() => setActiveMenu("dashboard")} />}

          {activeMenu === "monitoring" && <MonitoringView projects={projects} />}

          {activeMenu === "profile" && (
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold text-emerald-900 mb-6 font-primary">Profile Settings</h1>

              <div className="rounded-3xl border bg-white p-8 shadow-sm">
                {profileLoading ? (
                  <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Full name</label>
                        <input
                          type="text"
                          value={profile.fullName}
                          onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="Project Owner Name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Phone number</label>
                        <input
                          type="text"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                          placeholder="98XXXXXXXX"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Address</label>
                      <input
                        type="text"
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Kathmandu, Nepal"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Bio / Description</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="Professional background, company info, interests..."
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-700 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800 hover:shadow-emerald-700/30 transition-all active:scale-[0.98]"
                      >
                        Save Profile changes
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
