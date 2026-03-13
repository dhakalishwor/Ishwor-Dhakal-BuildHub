import React, { useMemo, useState, useEffect, useCallback } from "react";
import api from "../../API/axios";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import { toast } from "react-hot-toast";
import { confirmToast } from "../../components/ConfirmToast";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-emerald-900">{value}</p>
    </div>
  );
}

export default function WorkerDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [loading, setLoading] = useState(false);

  const [myJobs, setMyJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [biddingJob, setBiddingJob] = useState(null);
  const [bidForm, setBidForm] = useState({ price: "", days: "", dailyRate: "", message: "" });
  const [bidLoading, setBidLoading] = useState(false);

  const [subJobs, setSubJobs] = useState([]);
  const [subJobApplications, setSubJobApplications] = useState([]);
  const [applyingJob, setApplyingJob] = useState(null);
  const [applyForm, setApplyForm] = useState({ message: "" });
  const [applyLoading, setApplyLoading] = useState(false);
  const [myAssignments, setMyAssignments] = useState([]);
  const [profile, setProfile] = useState({ 
    fullName: "", 
    skills: "", 
    dailyRate: "", 
    availability: true,
    bio: "",
    experienceYears: 0,
    specialization: ""
  });
  const [profileLoading, setProfileLoading] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [taskUpdateForm, setTaskUpdateForm] = useState({ taskId: null, description: "", photo: null });
  const [taskUpdateLoading, setTaskUpdateLoading] = useState(false);

  const [projectProgressForm, setProjectProgressForm] = useState({ projectId: "", milestoneId: "", description: "", photo: null });
  const [projectProgressLoading, setProjectProgressLoading] = useState(false);
  const [projectUpdates, setProjectUpdates] = useState([]);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  const handleLogout = async () => {
    const ok = await confirmToast("Are you sure you want to logout?");
    if (!ok) return;

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };


  const fetchJobs = useCallback(async (discovery = false) => {
    try {
      const res = await api.get(discovery ? "/api/projects/?discovery=true" : "/api/projects/");
      const data = res.data || [];
      if (discovery) {
        setSubJobs(data.filter(j => j.status === "ACTIVE"));
      } else {
        setMyJobs(data.filter(j => j.status === "ACTIVE" || j.status === "COMPLETED"));
      }
    } catch (err) { console.error("fetchJobs failed", err); }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await api.get("/api/payments/worker/");
      setPayments(res.data || []);
    } catch (err) { console.error("fetchPayments failed", err); }
  }, []);

  const fetchWorkLogs = useCallback(async () => {
    try {
      const res = await api.get("/api/work-logs/");
      setWorkLogs(res.data || []);
    } catch (err) { console.error("fetchWorkLogs failed", err); }
  }, []);

  const fetchMilestones = useCallback(async () => {
    try {
      const res = await api.get("/api/milestones/");
      setMilestones(res.data || []);
    } catch (err) { console.error("fetchMilestones failed", err); }
  }, []);

  const fetchMyBids = useCallback(async () => {
    try {
      const res = await api.get("/api/my-bids/");
      setMyBids(res.data || []);
    } catch (err) { console.error("fetchMyBids failed", err); }
  }, []);

  const fetchSubJobApps = useCallback(async () => {
    try {
      const res = await api.get("/api/sub-job-applications/");
      setSubJobApplications(res.data || []);
    } catch (err) { console.error("fetchSubJobApps failed", err); }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get("/api/assignments/");
      setMyAssignments((res.data || []).filter(a => a.status !== 'TERMINATED'));
    } catch (err) { console.error("fetchAssignments failed", err); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get("/api/tasks/");
      setTasks(res.data || []);
    } catch (err) { console.error("fetchTasks failed", err); }
  }, []);

  const fetchProgressUpdates = useCallback(async () => {
    try {
      const res = await api.get("/api/progress-updates/");
      setProjectUpdates(res.data || []);
    } catch (err) { console.error("fetchProgressUpdates failed", err); }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/workers/me/");
      if (res.data) {
        setProfile({
          fullName: res.data.fullName || "",
          skills: res.data.skills || "",
          dailyRate: res.data.dailyRate || "",
          availability: res.data.availabilityStatus === "AVAILABLE",
          bio: res.data.bio || "",
          experienceYears: res.data.experienceYears || 0,
          specialization: res.data.specialization || ""
        });
      }
    } catch (err) { console.error("fetchProfile failed", err); }
  }, []);

  // Main data trigger based on activeMenu
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      if (activeMenu === "dashboard") {
        await Promise.all([
          fetchJobs(),
          fetchWorkLogs(),
          fetchMilestones(),
          fetchMyBids(),
          fetchJobs(), // for sub-jobs
          fetchSubJobApps(),
          fetchAssignments(),
          fetchProgressUpdates()
        ]);
      } else if (activeMenu === "myjobs") {
        await Promise.all([fetchJobs(), fetchMilestones(), fetchAssignments()]);
      } else if (activeMenu === "mytasks") {
        await fetchTasks();
      } else if (activeMenu === "payments") {
        await fetchPayments();
      } else if (activeMenu === "subjobs") {
        await Promise.all([fetchJobs(true), fetchSubJobApps()]);
      } else if (activeMenu === "project-progress") {
        await Promise.all([fetchProgressUpdates(), fetchJobs()]);
      } else if (activeMenu === "profile") {
        await fetchProfile();
      }
      setLoading(false);
    };
    load();
  }, [
    activeMenu, fetchJobs, fetchPayments, fetchWorkLogs, fetchMilestones,
    fetchMyBids, fetchSubJobApps, fetchAssignments, fetchTasks,
    fetchProgressUpdates, fetchProfile
  ]);

  // Sync activeMenu with URL
  useEffect(() => {
    const menuParam = searchParams.get("menu");
    if (menuParam && activeMenu !== menuParam) {
      setActiveMenu(menuParam);
    }
    const stateMenu = location.state?.activeMenu;
    if (stateMenu && activeMenu !== stateMenu) {
      setActiveMenu(stateMenu);
    }
  }, [searchParams, location.state, activeMenu]);

  const [logForm, setLogForm] = useState({ project: "", hours: "", date: new Date().toISOString().split('T')[0], description: "" });
  const [logLoading, setLogLoading] = useState(false);

  // active project filter for logs
  const [projectFilter, setProjectFilter] = useState("");

  // derive list of projects I can log for (ones I'm actively assigned to AND project is ACTIVE)
  const availableLogProjects = myJobs.filter(j => 
    j.status === "ACTIVE" && 
    myAssignments.some(a => a.project === j.id && a.status === "ACTIVE")
  );

  // derived logs according to selected filter
  const displayedLogs = projectFilter
    ? workLogs.filter((l) => String(l.project) === String(projectFilter))
    : workLogs;

  // editing existing log
  const [editLogModalOpen, setEditLogModalOpen] = useState(false);
  const [editLogForm, setEditLogForm] = useState({ id: null, project: "", hours: "", date: "", description: "" });
  const [editLogLoading, setEditLogLoading] = useState(false);

  async function handleLogWork(e) {
    e.preventDefault();
    // prevent duplicate entry for same project/date
    if (workLogs.some(l => String(l.project) === String(logForm.project) && l.date === logForm.date)) {
      toast.error("You already logged work for this project on that date.");
      return;
    }
    setLogLoading(true);
    try {
      await api.post("/api/work-logs/", {
        project: logForm.project,
        date: logForm.date,
        hours_worked: logForm.hours,
        description: logForm.description
      });
      setLogForm({ project: "", hours: "", date: new Date().toISOString().split('T')[0], description: "" });
      fetchWorkLogs();
      toast.success("Work log submitted!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to log work.");
    } finally {
      setLogLoading(false);
    }
  }

  function openEditLog(log) {
    setEditLogForm({
      id: log.id,
      project: log.project,
      hours: log.hours_worked,
      date: log.date,
      description: log.description || ""
    });
    setEditLogModalOpen(true);
  }

  async function handleUpdateLog(e) {
    e.preventDefault();
    setEditLogLoading(true);
    try {
      await api.patch(`/api/work-logs/${editLogForm.id}/`, {
        project: editLogForm.project,
        date: editLogForm.date,
        hours_worked: editLogForm.hours,
        description: editLogForm.description
      });
      fetchWorkLogs();
      toast.success("Work log updated!");
      setEditLogModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update log.");
    } finally {
      setEditLogLoading(false);
    }
  }

  async function handleCompleteMilestone(milestoneId) {
    try {
      await api.post(`/api/milestones/${milestoneId}/complete/`);
      fetchMilestones();
      toast.success("Milestone marked as completed!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to complete milestone.");
    }
  }

  async function handlePostBid(e) {
    e.preventDefault();
    if (!biddingJob) return;
    setBidLoading(true);
    try {
      await api.post("/api/bids/", {
        project: biddingJob.id,
        proposed_price: bidForm.price,
        proposed_days: bidForm.days,
        daily_rate: bidForm.dailyRate,
        message: bidForm.message,
      });
      toast.success("Bid submitted successfully!");
      setBiddingJob(null);
      setBidForm({ price: "", days: "", dailyRate: "", message: "" });
      fetchMyBids();
      fetchJobs(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to submit bid.");
    } finally {
      setBidLoading(false);
    }
  }

  async function handleApplySubJob(e) {
    e.preventDefault();
    if (!applyingJob) return;
    setApplyLoading(true);
    try {
      await api.post("/api/sub-job-applications/", {
        project: applyingJob.id,
        message: applyForm.message
      });
      toast.success("Application sent successfully!");
      setApplyingJob(null);
      setApplyForm({ message: "" });
      fetchSubJobApps();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.[0] || err?.response?.data?.detail || "Failed to send application.");
    } finally {
      setApplyLoading(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", profile.fullName);
      formData.append("skills", profile.skills);
      formData.append("dailyRate", profile.dailyRate);
      formData.append("availabilityStatus", profile.availability ? "AVAILABLE" : "UNAVAILABLE");
      formData.append("bio", profile.bio);
      formData.append("experienceYears", profile.experienceYears);
      formData.append("specialization", profile.specialization);

      await api.patch("/api/workers/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Profile updated!");
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleSubmitTaskUpdate(e) {
    e.preventDefault();
    setTaskUpdateLoading(true);
    const formData = new FormData();
    formData.append("description", taskUpdateForm.description);
    if (taskUpdateForm.photo) {
      formData.append("photo", taskUpdateForm.photo);
    }
    try {
      await api.post(`/api/tasks/${taskUpdateForm.taskId}/submit-update/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Task update submitted!");
      setTaskUpdateForm({ taskId: null, description: "", photo: null });
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit task update.");
    } finally {
      setTaskUpdateLoading(false);
    }
  }

  async function handleSubmitProjectProgress(e) {
    e.preventDefault();
    setProjectProgressLoading(true);
    const formData = new FormData();
    formData.append("project", projectProgressForm.projectId);
    if (projectProgressForm.milestoneId) {
      formData.append("milestone", projectProgressForm.milestoneId);
    }
    formData.append("description", projectProgressForm.description);
    if (projectProgressForm.photo) {
      formData.append("photo", projectProgressForm.photo);
    }
    try {
      await api.post("/api/progress-updates/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Project progress update submitted!");
      setProjectProgressForm({ projectId: "", milestoneId: "", description: "", photo: null });
      if (activeMenu === "dashboard" || activeMenu === "project-progress") {
        fetchProgressUpdates();
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to submit progress update.");
    } finally {
      setProjectProgressLoading(false);
    }
  }

  const stats = useMemo(() => {
    const active = myJobs.filter((j) => (j.status || "").toUpperCase() === "ACTIVE").length;
    const completedDirect = myJobs.filter((j) => (j.status || "").toUpperCase() === "COMPLETED").length;
    const completedAssigned = myAssignments.filter((a) => (a.status || "").toUpperCase() === "COMPLETED").length;
    const completed = completedDirect + completedAssigned;
    const pendingPay = payments.filter((p) => (p.status || "").toUpperCase() !== "PAID").length;

    return {
      active,
      completed,
      pendingPay,
    };
  }, [myJobs, payments]);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm text-emerald-900 font-semibold">BuildHub</p>
              <p className="text-xs text-slate-500">Worker Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="min-h-screen border-r bg-emerald-900 text-white">
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-200">Worker Menu</p>
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "myjobs", label: "My Jobs" },
              { key: "mytasks", label: "My Tasks" },
              { key: "project-progress", label: "Project Progress" },
              { key: "subjobs", label: "Sub-Jobs" },
              { key: "payments", label: "Payments" },
              { key: "profile", label: "Profile" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveMenu(item.key);
                  navigate(`/worker/dashboard?menu=${item.key}`, { replace: true });
                }}
                className={classNames(
                  "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                  activeMenu === item.key ? "bg-emerald-700 text-white shadow" : "bg-emerald-900 hover:bg-emerald-800",
                )}
              >
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={handleLogout}
              className="mt-6 w-full rounded-xl px-4 py-3 text-left transition font-semibold text-red-200 hover:bg-red-900/50 hover:text-white"
            >
              Logout
            </button>
          </div>
        </aside>

        {biddingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-emerald-900">Bid on: {biddingJob.title}</h2>
              <p className="text-sm text-slate-500 mt-1">Budget: NPR {biddingJob.budget} ({biddingJob.hiring_model})</p>

              <form onSubmit={handlePostBid} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Total Proposed Price (NPR)</label>
                    <input
                      type="number"
                      required
                      value={bidForm.price}
                      onChange={(e) => setBidForm({ ...bidForm, price: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                      placeholder="e.g. 50000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Proposed Duration (Days)</label>
                    <input
                      type="number"
                      required
                      value={bidForm.days}
                      onChange={(e) => setBidForm({ ...bidForm, days: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                      placeholder="e.g. 15"
                    />
                  </div>
                </div>

                {biddingJob.hiring_model === "PER_DAY" && (
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Daily Rate (NPR)</label>
                    <input
                      type="number"
                      required
                      value={bidForm.dailyRate}
                      onChange={(e) => setBidForm({ ...bidForm, dailyRate: e.target.value })}
                      className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                      placeholder="e.g. 2500"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Message to Client</label>
                  <textarea
                    value={bidForm.message}
                    onChange={(e) => setBidForm({ ...bidForm, message: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                    rows={4}
                    placeholder="Describe why you are a good fit..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setBiddingJob(null)}
                    className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={bidLoading}
                    className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {bidLoading ? "Submitting..." : "Submit Bid"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {applyingJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="text-xl font-bold text-emerald-900">Apply for: {applyingJob.title}</h2>
              <p className="text-sm text-slate-500 mt-1">Status: Active</p>

              <form onSubmit={handleApplySubJob} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Message to Contractor</label>
                  <textarea
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                    rows={4}
                    placeholder="Briefly explain your skills for this project..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setApplyingJob(null)}
                    className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {applyLoading ? "Sending..." : "Send Application"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              {activeMenu === "dashboard" && (
                <>
                  <h1 className="text-2xl font-bold text-emerald-900">Overview</h1>
                  <p className="mt-1 text-sm text-slate-600">Your work and payment summary.</p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="Active Jobs" value={stats.active} />
                    <StatCard title="Completed Jobs" value={stats.completed} />
                    <StatCard title="Pending Payments" value={stats.pendingPay} />
                  </div>

                  {/* Log Work Section */}
                  <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-emerald-900">Log Daily Work</h2>
                    <form onSubmit={handleLogWork} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Project</label>
                        <select
                          required
                          value={logForm.project}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLogForm({ ...logForm, project: val });
                            setProjectFilter(val);
                          }}
                          className="mt-1 w-full rounded-xl border p-2 text-sm focus:ring-emerald-500"
                        >
                          <option value="">Select Project</option>
                          {availableLogProjects.length > 0 ? (
                            availableLogProjects.map(j => (
                              <option key={j.id} value={j.id}>{j.title}</option>
                            ))
                          ) : (
                            <option disabled value="">No assigned projects</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Hours Worked</label>
                        <input
                          type="number"
                          required
                          value={logForm.hours}
                          onChange={(e) => setLogForm({ ...logForm, hours: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-2 text-sm"
                          placeholder="e.g. 8"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase">Date</label>
                        <input
                          type="date"
                          required
                          value={logForm.date}
                          onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-2 text-sm"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs text-slate-500 uppercase">Description</label>
                        <textarea
                          value={logForm.description}
                          onChange={(e) => setLogForm({ ...logForm, description: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-2 text-sm"
                          placeholder="What did you do today?"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          disabled={logLoading || availableLogProjects.length === 0}
                          className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                          {logLoading ? "Submitting..." : 
                           availableLogProjects.length === 0 ? "No Active Assignments" : "Submit Log"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Recent Logs */}
                  <div className="mt-8">
                    <h2 className="font-bold text-emerald-900">Recent Work Logs</h2>
                    {projectFilter && (
                      <p className="text-sm text-slate-600">
                        Showing logs for project: {myJobs.find(j=>String(j.id)===String(projectFilter))?.title || projectFilter}
                      </p>
                    )}
                    <div className="mt-2">
                      <label className="text-xs text-slate-500 uppercase">Filter by project</label>
                      <select
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="mt-1 rounded-xl border p-2 text-sm"
                      >
                        <option value="">All projects</option>
                        {availableLogProjects.map(j => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-2xl border bg-white shadow-sm">
                      <table className="w-full text-left text-sm text-slate-500">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                          <tr>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Project</th>
                            <th className="px-6 py-3">Hours</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Payment</th>
                            <th className="px-6 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {displayedLogs.slice(0, 5).map(log => (
                            <tr key={log.id}>
                              <td className="px-6 py-4">{log.date}</td>
                              <td className="px-6 py-4 font-medium text-slate-900">Project #{log.project}</td>
                              <td className="px-6 py-4">{log.hours_worked}</td>
                              <td className="px-6 py-4">
                                <span className={classNames(
                                  "rounded-full px-2 py-1 text-xs font-semibold",
                                  log.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                  log.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={classNames(
                                  "rounded-full px-2 py-1 text-xs font-semibold",
                                  log.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                                )}>
                                  {log.payment_status || "UNPAID"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {(log.status === "PENDING" || log.status === "REJECTED") && (
                                  <button
                                    onClick={() => openEditLog(log)}
                                    className="text-blue-700 font-semibold text-xs hover:underline"
                                  >Edit</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* edit log modal */}
                  {editLogModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-emerald-900 mb-4">Edit Work Log</h2>
                        <form onSubmit={handleUpdateLog} className="space-y-4">
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Project ID</label>
                            <select
                              required
                              value={editLogForm.project}
                              onChange={(e) => setEditLogForm({ ...editLogForm, project: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-2 text-sm"
                            >
                              <option value="">Select project</option>
                              {availableLogProjects.map(j => (
                                <option key={j.id} value={j.id}>{j.title}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Hours Worked</label>
                            <input
                              type="number"
                              required
                              value={editLogForm.hours}
                              onChange={(e) => setEditLogForm({ ...editLogForm, hours: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Date</label>
                            <input
                              type="date"
                              required
                              value={editLogForm.date}
                              onChange={(e) => setEditLogForm({ ...editLogForm, date: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 uppercase">Description</label>
                            <textarea
                              value={editLogForm.description}
                              onChange={(e) => setEditLogForm({ ...editLogForm, description: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-2 text-sm"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setEditLogModalOpen(false)}
                              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                            >Cancel</button>
                            <button
                              type="submit"
                              disabled={editLogLoading}
                              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >{editLogLoading ? "Updating..." : "Update Log"}</button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                </>
              )}

              {activeMenu === "subjobs" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">Sub-Jobs</h1>
                  <p className="mt-1 text-sm text-slate-600">Active projects looking for skilled workers.</p>

                  <div className="mt-6 grid gap-4">
                    {subJobs.map(job => (
                      <div key={job.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-emerald-900 text-lg">{job.title}</h3>
                            <p className="text-sm text-slate-500">{job.category} • {job.location}</p>
                          </div>
                          {subJobApplications.some(a => a.project === job.id) ? (
                            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500">
                              Applied
                            </span>
                          ) : myAssignments.some(a => a.status === "ACTIVE") ? (
                            <span className="rounded-xl bg-red-50 px-4 py-2 text-xs font-bold text-red-500">
                              Complete current assignment first
                            </span>
                          ) : (
                            <button
                              onClick={() => setApplyingJob(job)}
                              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
                            >
                              Apply Now
                            </button>
                          )}
                        </div>
                        <p className="mt-3 text-sm text-slate-700 line-clamp-2">{job.description}</p>
                        <div className="mt-4 flex gap-4 text-sm font-medium">
                          <p className="text-emerald-700">Budget: NPR {job.budget}</p>
                          <p className="text-slate-500 uppercase">{job.hiring_model}</p>
                        </div>
                      </div>
                    ))}
                    {subJobs.length === 0 && !loading && (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed">
                        <p className="text-slate-400">No active projects seeking workers right now.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMenu === "payments" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">Payment History</h1>
                  <p className="mt-1 text-sm text-slate-600">Review your past and upcoming payments.</p>

                  <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Project</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payments.map(pay => (
                          <tr key={pay.id}>
                            <td className="px-6 py-4">{pay.date}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{pay.project_title}</td>
                            <td className="px-6 py-4">NPR {pay.amount}</td>
                            <td className="px-6 py-4">
                              <span className={classNames(
                                "rounded-full px-2 py-1 text-xs font-semibold",
                                pay.status === "COMPLETE" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"
                              )}>
                                {pay.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {payments.length === 0 && !loading && (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No payment history found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeMenu === "profile" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">My Profile</h1>
                  <p className="mt-1 text-sm text-slate-600">Manage your professional information and availability.</p>

                  <div className="mt-8 max-w-2xl rounded-2xl border bg-white p-6 shadow-sm">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">                      <div className="flex flex-col sm:flex-row gap-6 items-center bg-slate-50 p-6 rounded-2xl border border-dashed">
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <h3 className="font-bold text-emerald-900">{profile.fullName || "Your Name"}</h3>
                          <p className="text-sm text-slate-500">{profile.specialization || "No specialization set"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                          <input
                            type="text"
                            required
                            value={profile.fullName}
                            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                            className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Daily Rate (NPR)</label>
                          <input
                            type="number"
                            required
                            value={profile.dailyRate}
                            onChange={(e) => setProfile({ ...profile, dailyRate: e.target.value })}
                            className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Specialization</label>
                          <input
                            type="text"
                            value={profile.specialization}
                            onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
                            className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                            placeholder="e.g. Master Mason"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Years of Experience</label>
                          <input
                            type="number"
                            value={profile.experienceYears}
                            onChange={(e) => setProfile({ ...profile, experienceYears: e.target.value })}
                            className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Bio / Description</label>
                        <textarea
                          value={profile.bio}
                          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          rows={3}
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Skills</label>
                        <textarea
                          required
                          value={profile.skills}
                          onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          rows={4}
                          placeholder="e.g. Masonry, Plumbing, Electrical wiring..."
                        />
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-dashed">
                        <input
                          type="checkbox"
                          id="availability"
                          checked={profile.availability}
                          onChange={(e) => setProfile({ ...profile, availability: e.target.checked })}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <label htmlFor="availability" className="text-sm font-medium text-slate-700">
                          I am currently available for new projects
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={profileLoading}
                        className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {profileLoading ? "Updating..." : "Save Changes"}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {activeMenu === "myjobs" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">My Jobs</h1>
                  <p className="mt-1 text-sm text-slate-600">Projects you are working on.</p>

                  <div className="mt-6 grid gap-4">
                    {/* Contractor-assigned jobs */}
                    {myAssignments.length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hired by Contractors</h2>
                        {myAssignments.map(a => (
                          <div key={a.id} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-emerald-900 text-lg">{a.project_title}</h3>
                                <p className="text-xs text-slate-500 italic">Hired by: {a.contractor_username}</p>
                              </div>
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 uppercase">
                                {a.status}
                              </span>
                            </div>
                            <div className="mt-4 flex gap-4 text-sm font-medium">
                              <p className="text-emerald-700">Rate: NPR {a.rate}</p>
                              <p className="text-slate-500 uppercase">{a.hiring_type}</p>
                            </div>
                            {a.status === "ACTIVE" && (
                              <div className="mt-4 pt-4 border-t border-emerald-100">
                                <button
                                  onClick={() => {
                                    setLogForm({ ...logForm, project: a.project });
                                    setActiveMenu("dashboard");
                                    navigate("/worker/dashboard?menu=dashboard", { replace: true });
                                    window.scrollTo({ top: 400, behavior: "smooth" });
                                  }}
                                  className="text-xs font-bold text-emerald-700 hover:underline"
                                >
                                  Log Work for this Project →
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Client-assigned jobs */}
                    {myJobs.filter(job => !myAssignments.some(a => a.project === job.id)).length > 0 && (
                      <div className="space-y-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Direct Client Jobs</h2>
                        {myJobs.filter(job => !myAssignments.some(a => a.project === job.id)).map(job => (
                          <div key={job.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-emerald-900 text-lg">{job.title}</h3>
                                <p className="text-sm text-slate-500">{job.category} • {job.location}</p>
                              </div>
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 uppercase">
                                {job.status}
                              </span>
                            </div>
                            <div className="mt-4 flex gap-4 text-sm">
                              <p>Budget: <span className="font-bold">NPR {job.budget}</span></p>
                              <p>Type: <span className="font-bold uppercase">{job.hiring_model}</span></p>
                            </div>

                            {job.hiring_model === "PER_DAY" && (
                              <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Daily Progress</h4>
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                  <p className="text-xs text-emerald-800 mb-2">You can log your daily hours from the <b>Overview</b> tab or use the quick log below.</p>
                                  <button
                                    onClick={() => {
                                      setLogForm({ ...logForm, project: job.id });
                                      setActiveMenu("dashboard");
                                      navigate("/worker/dashboard?menu=dashboard", { replace: true });
                                      window.scrollTo({ top: 400, behavior: "smooth" });
                                    }}
                                    className="text-xs font-bold text-emerald-700 hover:underline"
                                  >
                                    Go to Quick Log →
                                  </button>
                                </div>
                              </div>
                            )}

                            {job.hiring_model === "PER_PROJECT" && (
                              <div className="mt-6 border-t pt-4">
                                <h4 className="text-sm font-bold text-slate-700 uppercase mb-2">Milestones</h4>
                                <div className="space-y-2">
                                  {milestones.filter(m => m.project === job.id).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">No milestones defined.</p>
                                  ) : (
                                    milestones.filter(m => m.project === job.id).map(m => (
                                      <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed">
                                        <div>
                                          <p className="text-sm font-semibold text-slate-800">{m.title}</p>
                                          <p className="text-xs text-slate-500">NPR {m.amount}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={classNames(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                            m.status === "PAID" ? "bg-emerald-100 text-emerald-800" :
                                              m.status === "COMPLETED" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"
                                          )}>
                                            {m.status}
                                          </span>
                                          {m.status === "PENDING" && job.status === "ACTIVE" && (
                                            <button
                                              onClick={() => handleCompleteMilestone(m.id)}
                                              className="text-xs font-bold text-emerald-700 hover:underline"
                                            >
                                              Mark Complete
                                            </button>
                                          )}
                                          {job.status !== "ACTIVE" && m.status === "PENDING" && (
                                            <span className="text-[10px] text-slate-400 italic">Project closed</span>
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeMenu === "mytasks" && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-emerald-900">Assigned Tasks</h1>
                  <p className="text-sm text-slate-600">Specific tasks assigned to you by contractors.</p>

                  <div className="grid gap-4">
                    {tasks.map(t => (
                      <div key={t.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-emerald-900 text-lg">{t.task_name}</h3>
                            <p className="text-xs text-slate-500 font-bold uppercase mt-1">Project: {t.project_title}</p>
                          </div>
                          <span className={classNames(
                            "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                            t.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                              t.status === "REWORK" ? "bg-red-100 text-red-700" :
                                t.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {t.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{t.description}</p>

                        {t.comments && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 italic">
                            <b>Contractor Comment:</b> {t.comments}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 items-center justify-between">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Due Date: {t.due_date}</p>
                          {t.status === "PENDING" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/api/tasks/${t.id}/worker-accept/`);
                                    fetchTasks();
                                    toast.success("Task accepted!");
                                  } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to accept task.");
                                  }
                                }}
                                disabled={t.project_status !== "ACTIVE"}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/api/tasks/${t.id}/worker-reject/`);
                                    fetchTasks();
                                    toast.success("Task rejected.");
                                  } catch (e) {
                                    console.error(e);
                                    toast.error("Failed to reject task.");
                                  }
                                }}
                                disabled={t.project_status !== "ACTIVE"}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            t.status !== "APPROVED" && (
                              <button
                                onClick={() => setTaskUpdateForm({ ...taskUpdateForm, taskId: t.id })}
                                disabled={t.project_status !== "ACTIVE"}
                                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                              >
                                {t.project_status !== "ACTIVE" ? "Project Closed" : "Report Progress"}
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed">
                        <p className="text-slate-400 italic">No specific tasks assigned yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Task Update Modal */}
                  {taskUpdateForm.taskId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-emerald-900">Report Task Progress</h2>
                        <form onSubmit={handleSubmitTaskUpdate} className="mt-6 space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">What have you done?</label>
                            <textarea
                              required
                              value={taskUpdateForm.description}
                              onChange={(e) => setTaskUpdateForm({ ...taskUpdateForm, description: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                              rows={4}
                              placeholder="Describe your progress today..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Attach Photo (Optional)</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setTaskUpdateForm({ ...taskUpdateForm, photo: e.target.files[0] })}
                              className="mt-1 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                            />
                          </div>
                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setTaskUpdateForm({ taskId: null, description: "", photo: null })}
                              className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={taskUpdateLoading}
                              className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {taskUpdateLoading ? "Uploading..." : "Submit Update"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMenu === "project-progress" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold text-emerald-900">Project Progress Updates</h1>
                    <p className="text-sm text-slate-600">Post overall project progress for clients to review.</p>
                  </div>

                  {/* Submission Form */}
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-emerald-900 mb-4 underline">Post New Update</h2>
                    <form onSubmit={handleSubmitProjectProgress} className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Select Project</label>
                        <select
                          required
                          value={projectProgressForm.projectId}
                          onChange={(e) => setProjectProgressForm({ ...projectProgressForm, projectId: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm"
                        >
                          <option value="">Select an active project</option>
                          {myJobs.filter(p => p.status === "ACTIVE" && myAssignments.some(a => a.project === p.id && a.status === "ACTIVE")).map(p => (
                            <option key={p.id} value={p.id}>
                              {p.title} {!p.advance_paid ? "(Advance Pending)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {projectProgressForm.projectId && (
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">Link to Milestone (Required for fixed price)</label>
                          <select
                            value={projectProgressForm.milestoneId}
                            onChange={(e) => setProjectProgressForm({ ...projectProgressForm, milestoneId: e.target.value })}
                            className="mt-1 w-full rounded-xl border p-3 text-sm"
                          >
                            <option value="">-- Associate with a Milestone --</option>
                            {milestones
                              .filter(m => String(m.project) === String(projectProgressForm.projectId) && m.status === 'PENDING')
                              .map(m => (
                                <option key={m.id} value={m.id}>{m.title} (Rs. {m.amount})</option>
                              ))
                            }
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">Linking an update to a milestone allows the client to approve and pay that milestone.</p>
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Progress Note</label>
                        <textarea
                          required
                          value={projectProgressForm.description}
                          onChange={(e) => setProjectProgressForm({ ...projectProgressForm, description: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          rows={3}
                          placeholder="e.g. Ground floor slab casting completed."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Evidence Photo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProjectProgressForm({ ...projectProgressForm, photo: e.target.files[0] })}
                          className="mt-1 w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                        />
                      </div>
                       <button
                        type="submit"
                        disabled={projectProgressLoading || !projectProgressForm.projectId || myJobs.find(p => String(p.id) === String(projectProgressForm.projectId))?.status !== "ACTIVE"}
                        className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50 disabled:bg-slate-400"
                      >
                        {projectProgressLoading ? "Posting..." : 
                         !projectProgressForm.projectId ? "Select a Project" :
                         myJobs.find(p => String(p.id) === String(projectProgressForm.projectId))?.status !== "ACTIVE" ? "Project Inactive" : "Post Update"}
                      </button>
                    </form>
                  </div>

                  {/* Recent Updates */}
                  <div className="space-y-4">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Feed</h2>
                    {projectUpdates.map(up => (
                      <div key={up.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-emerald-700 uppercase">Project #{up.project}</p>
                          <span className={classNames(
                            "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                            up.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                              up.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {up.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4">
                          <div>
                            <p className="text-sm text-slate-700 italic">"{up.description}"</p>
                            <p className="text-[10px] text-slate-400 mt-2">Posted by: {up.posted_by_username} on {new Date(up.created_at).toLocaleString()}</p>
                            {up.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                                <b>Client Feedback:</b> {up.rejection_reason}
                              </div>
                            )}
                          </div>
                          {up.photo && (
                            <img
                              src={up.photo}
                              alt="Evidence"
                              className="w-full h-32 object-cover rounded-xl border cursor-pointer"
                              onClick={() => window.open(up.photo, '_blank')}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                    {projectUpdates.length === 0 && (
                      <div className="text-center py-12 rounded-2xl border-2 border-dashed">
                        <p className="text-slate-400 italic">No project updates yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
