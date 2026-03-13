import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import api from "../../API/axios";
import AvailableProjects from "../Contractor/AvailableProjects";
import MyBids from "../Contractor/MyBids";
import MyRatings from "../Contractor/MyRatings";
import ContractorProjects from "../Contractor/ContractorProjects";
import Sidebar from "../../components/Sidebar";
import NotificationBell from "../../components/NotificationBell";
import { confirmToast, promptToast } from "../../components/ConfirmToast";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const emptyProfile = {
  fullName: "",
  email: "",
  address: "",
  projectTypes: [],
  experienceYears: "",
  avgRating: 0,
  totalRatings: 0,
};

const allProjectTypes = ["Civil", "Electrical", "Plumbing", "Interior", "Painting", "Other"];

function submitEsewaForm(url, payload) {
  const form = document.createElement("form");
  form.setAttribute("method", "POST");
  form.setAttribute("action", url);
  for (const key in payload) {
    const hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", payload[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("profile");
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);

  const [editing, setEditing] = useState(false);
  const [searchType, setSearchType] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [workers, setWorkers] = useState([]);
  const [activeProjects, setActiveProjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [hiringForm, setHiringForm] = useState({ workerId: null, projectId: "", rate: "", hiringType: "PER_DAY" });
  const [hiringLoading, setHiringLoading] = useState(false);

  const [applications, setApplications] = useState([]);

  // worker log modal state
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedWorkerLogs, setSelectedWorkerLogs] = useState([]);
  const [selectedWorkerName, setSelectedWorkerName] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [taskForm, setTaskForm] = useState({ name: "", description: "", projectId: "", assignedTo: "", dueDate: "" });
  const [taskLoading, setTaskLoading] = useState(false);
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTaskData, setReviewTaskData] = useState(null);
  const HEADER_H = 64;

  const filteredTypes = useMemo(() => {
    const q = searchType.trim().toLowerCase();
    if (!q) return allProjectTypes;
    return allProjectTypes.filter((t) => t.toLowerCase().includes(q));
  }, [searchType]);

  const fetchWorkers = useCallback(async () => {
    try {
      const res = await api.get("/api/workers/");
      setWorkers(res.data);
    } catch (err) {
      console.error("Failed to fetch workers", err);
    }
  }, []);

  const fetchActiveProjects = useCallback(async () => {
    try {
      const res = await api.get("/api/projects/");
      setActiveProjects(res.data.filter(p => p.status === "ACTIVE"));
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await api.get("/api/assignments/");
      setAssignments(res.data.filter(a => a.status === 'ACTIVE'));
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await api.get("/api/sub-job-applications/");
      setApplications(res.data);
    } catch (err) {
      console.error("Failed to fetch applications", err);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await api.get("/api/tasks/");
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
    }
  }, []);

  const loadMe = useCallback(async (mounted) => {
    setLoading(true);
    setApiError("");
    try {
      const res = await api.get("/api/contractors/me/");
      if (!mounted) return;

      const data = res.data || {};
      const normalized = {
        fullName: data.fullName || "",
        email: data.email || "",
        address: data.address || "",
        projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
        experienceYears:
          data.experienceYears === 0 || data.experienceYears ? String(data.experienceYears) : "",
        avgRating: typeof data.avgRating === "number" ? data.avgRating : Number(data.avgRating || 0),
        totalRatings:
          typeof data.totalRatings === "number"
            ? data.totalRatings
            : Number(data.totalRatings || 0),
      };

      setProfile(normalized);
      setForm(normalized);
    } catch (err) {
      if (!mounted) return;

      const status = err?.response?.status;
      let msg = "Failed to load contractor profile. Please login again and check token.";

      if (status === 401) msg = "Authentication failed. Please login again.";
      else if (status === 403)
        msg = err?.response?.data?.detail || "You don't have permission to access this resource.";
      else if (status === 500) msg = "Server error. Please try again later.";
      else if (err?.response?.data?.detail) msg = err.response.data.detail;
      else if (err?.message) msg = err.message;

      setApiError(msg);
    } finally {
      if (mounted) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let mounted = true;
    loadMe(mounted);
    return () => { mounted = false; };
  }, [loadMe]);

  // Handle menu changes and data fetching
  useEffect(() => {
    if (activeMenu === "hire-workers") {
      fetchWorkers();
      fetchActiveProjects();
    } else if (activeMenu === "manage-team") {
      fetchAssignments();
    } else if (activeMenu === "sub-job-apps") {
      fetchApplications();
    } else if (activeMenu === "manage-tasks") {
      fetchTasks();
      fetchActiveProjects();
      fetchAssignments();
    }

    // Guarded state updates for navigation
    const stateMenu = location.state?.activeMenu;
    if (stateMenu && activeMenu !== stateMenu) {
      setActiveMenu(stateMenu);
    }

    const menuParam = searchParams.get("menu");
    if (menuParam && activeMenu !== menuParam) {
      setActiveMenu(menuParam);
    }
  }, [activeMenu, location.state?.activeMenu, searchParams, fetchWorkers, fetchActiveProjects, fetchAssignments, fetchApplications, fetchTasks]);

  async function handleHireWorker(e) {
    e.preventDefault();
    setHiringLoading(true);
    try {
      await api.post(`/api/workers/${hiringForm.workerId}/hire/`, {
        project_id: hiringForm.projectId,
        hiring_type: hiringForm.hiringType,
        rate: hiringForm.rate,
      });
      setSuccessMsg("Worker hired successfully!");
      setHiringForm({ workerId: null, projectId: "", rate: "", hiringType: "PER_DAY" });
      fetchAssignments();
    } catch (err) {
      setApiError(err?.response?.data?.detail || "Failed to hire worker.");
    } finally {
      setHiringLoading(false);
    }
  }

  const fetchWorkerLogs = useCallback(async (workerId) => {
    try {
      const res = await api.get(`/api/work-logs/?worker=${workerId}`);
      setSelectedWorkerLogs(res.data);
    } catch (err) {
      console.error(err);
      setApiError("Failed to fetch worker logs.");
    }
  }, []);

  async function handleAcceptApp(appId) {
    if (!await confirmToast("Accept this worker and hire them for the project?")) return;
    try {
      await api.post(`/api/sub-job-applications/${appId}/accept/`);
      setSuccessMsg("Application accepted and worker hired!");
      fetchApplications();
    } catch (err) {
      console.error(err);
      setApiError("Failed to accept application.");
    }
  }

  async function handleRejectApp(appId) {
    if (!await confirmToast("Reject this application?")) return;
    try {
      await api.post(`/api/sub-job-applications/${appId}/reject/`);
      setSuccessMsg("Application rejected.");
      fetchApplications();
    } catch (err) {
      console.error(err);
      setApiError("Failed to reject application.");
    }
  }

  async function handleCreateTask(e) {
    e.preventDefault();
    setTaskLoading(true);
    try {
      await api.post("/api/tasks/", {
        project: taskForm.projectId,
        task_name: taskForm.name,
        description: taskForm.description,
        assigned_to: taskForm.assignedTo,
        due_date: taskForm.dueDate,
      });
      setSuccessMsg("Task assigned successfully!");
      setTaskForm({ name: "", description: "", projectId: "", assignedTo: "", dueDate: "" });
      fetchTasks();
    } catch (err) {
      console.error(err);
      setApiError(err?.response?.data?.detail || "Failed to create task.");
    } finally {
      setTaskLoading(false);
    }
  }
  
  async function handleAcceptTask(taskId) {
    try {
      await api.post(`/api/tasks/${taskId}/approve/`);
      setSuccessMsg("Task accepted!");
      fetchTasks();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setApiError("Failed to accept task.");
    }
  }
  
  async function handleRejectTask(taskId) {
    const reason = await promptToast("Enter reason for rejection:");
    if (reason === null) return;
    try {
      await api.post(`/api/tasks/${taskId}/request-rework/`, { comments: reason });
      setSuccessMsg("Task rejected.");
      fetchTasks();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setApiError("Failed to reject task.");
    }
  }

  // team management helpers
  async function handleCompleteAssignment(assignId) {
    try {
      await api.post(`/api/assignments/${assignId}/complete/`);
      setSuccessMsg("Assignment marked as completed.");
      fetchAssignments();
    } catch (err) {
      console.error(err);
      setApiError("Failed to update assignment status.");
    }
  }

  async function handleTerminateAssignment(assignId) {
    if (!await confirmToast("Are you sure you want to terminate this assignment?")) return;
    try {
      await api.post(`/api/assignments/${assignId}/terminate/`);
      setSuccessMsg("Assignment terminated.");
      fetchAssignments();
    } catch (err) {
      console.error(err);
      setApiError("Failed to terminate assignment.");
    }
  }

  // fetch logs for a particular worker and show modal

  function viewWorkerLogs(assign) {
    setSelectedWorkerName(assign.worker_username);
    setSelectedWorkerId(assign.worker);
    fetchWorkerLogs(assign.worker);
    setLogModalOpen(true);
  }

  async function handleApproveLog(logId) {
    try {
      await api.post(`/api/work-logs/${logId}/approve/`);
      setSuccessMsg("Log approved.");
      if (selectedWorkerLogs) fetchWorkerLogs(selectedWorkerId);
    } catch (err) {
      console.error(err);
      setApiError("Failed to approve log.");
    }
  }

  async function handleRejectLog(logId) {
    if (!await confirmToast("Reject this log entry?")) return;
    try {
      await api.post(`/api/work-logs/${logId}/reject/`);
      setSuccessMsg("Log rejected.");
      if (selectedWorkerLogs) fetchWorkerLogs(selectedWorkerId);
    } catch (err) {
      console.error(err);
      setApiError("Failed to reject log.");
    }
  }

  async function handlePayLog(logId) {
    if (!await confirmToast("Proceed to pay for this log via eSewa?")) return;
    try {
      const res = await api.post(`/api/payments/worker-log/${logId}/initiate/`);
      const esewaUrl = res.data?.esewa_form_url;
      const payload = res.data?.payload;
      
      if (!esewaUrl || !payload) {
        throw new Error("Missing eSewa configuration from server.");
      }
      
      submitEsewaForm(esewaUrl, payload);
    } catch (err) {
      console.error(err);
      setApiError(err?.response?.data?.detail || "Failed to initiate eSewa payment.");
    }
  }

  async function handleReviewTask(taskId) {
    try {
      const response = await api.get(`/api/tasks/${taskId}/review/`);
      setReviewTaskData(response.data);
      setReviewModalOpen(true);
    } catch (err) {
      console.error(err);
      setApiError("Failed to review task.");
    }
  }

  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [statusUpdateTaskId, setStatusUpdateTaskId] = useState(null);
  
  async function handleUpdateTaskStatus(taskId) {
    setStatusUpdateTaskId(taskId);
    setStatusUpdateModalOpen(true);
  }
  
  async function confirmUpdateTaskStatus() {
    const statusOptions = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REWORK', 'REJECTED'];
    const selectedStatus = document.getElementById('status-select')?.value;
    const comments = document.getElementById('status-comments')?.value || '';
    
    if (!selectedStatus) {
      setApiError("Please select a status.");
      return;
    }
    
    if (!statusOptions.includes(selectedStatus)) {
      setApiError(`Invalid status. Valid options: ${statusOptions.join(', ')}`);
      return;
    }
    
    try {
      await api.post(`/api/tasks/${statusUpdateTaskId}/update-status/`, {
        status: selectedStatus,
        comments: comments
      });
      setSuccessMsg("Task status updated successfully!");
      setStatusUpdateModalOpen(false);
      fetchTasks();
    } catch (err) {
      setApiError(err?.response?.data?.detail || "Failed to update task status.");
    }
  }

  function startEdit() {
    setSuccessMsg("");
    setApiError("");
    setForm(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setSuccessMsg("");
    setApiError("");
    setForm(profile);
    setEditing(false);
    setSearchType("");
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleProjectType(type) {
    setForm((p) => {
      const exists = p.projectTypes.includes(type);
      return {
        ...p,
        projectTypes: exists ? p.projectTypes.filter((x) => x !== type) : [...p.projectTypes, type],
      };
    });
  }

  function validate(f) {
    const errors = [];
    if (!f.fullName.trim()) errors.push("Full Name is required.");
    if (f.experienceYears !== "") {
      const n = Number(f.experienceYears);
      if (!Number.isInteger(n) || n < 0) errors.push("Experience must be a whole number (0 or more).");
    }
    return errors;
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSuccessMsg("");
    setApiError("");

    const errs = validate(form);
    if (errs.length) {
      setApiError(errs.join(" "));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        projectTypes: form.projectTypes,
        experienceYears: form.experienceYears === "" ? 0 : Number(form.experienceYears),
      };

      const res = await api.patch("/api/contractors/me/", payload);

      const data = res.data || {};
      const normalized = {
        fullName: data.fullName || payload.fullName,
        email: data.email || payload.email || "",
        address: data.address || payload.address || "",
        projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : payload.projectTypes,
        experienceYears:
          data.experienceYears === 0 || data.experienceYears ? String(data.experienceYears) : "0",
        avgRating: typeof data.avgRating === "number" ? data.avgRating : profile.avgRating ?? 0,
        totalRatings: typeof data.totalRatings === "number" ? data.totalRatings : profile.totalRatings ?? 0,
      };

      setProfile(normalized);
      setForm(normalized);
      setEditing(false);
      setSearchType("");
      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      setApiError(
        err?.response?.data?.detail ||
        "Failed to update profile. Make sure you are logged in as CONTRACTOR and token is valid."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header
        className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur"
        style={{ height: HEADER_H }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm text-emerald-900 font-semibold">BuildHub</p>
              <p className="text-xs text-slate-500">Contractor Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setActiveMenu("projects")}
              className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              Available Projects
            </button>
          </div>
        </div>
      </header>

      <div
        className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]"
        style={{ minHeight: `calc(100vh - ${HEADER_H}px)` }}
      >
        <Sidebar
          role="contractor"
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
            navigate(`/contractor?menu=${key}`, { replace: true });
            setActiveMenu(key);
          }}
        />


        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              {/* messages (error/success) */}
              {(apiError || successMsg) && (
                <div className="mt-4 space-y-3">
                  {apiError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {apiError}
                    </div>
                  )}
                  {successMsg && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {successMsg}
                    </div>
                  )}
                </div>
              )}

              {activeMenu === "profile" && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-emerald-900">Profile Management</h1>
                      <p className="text-sm text-slate-600">Update your contractor profile details.</p>
                    </div>

                    {!editing ? (
                      <button
                        onClick={startEdit}
                        disabled={loading}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {loading && (
                      <div className="rounded-xl border bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Loading your profile...
                      </div>
                    )}
                  </div>

                  <section className="mt-4 rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-emerald-900">Your Profile</h2>
                        <p className="text-xs text-slate-500">Visible to clients</p>
                      </div>
                      <span
                        className={classNames(
                          "text-xs rounded-full px-3 py-1 font-semibold",
                          editing ? "bg-yellow-100 text-yellow-900" : "bg-emerald-100 text-emerald-900"
                        )}
                      >
                        {editing ? "Editing" : "Saved"}
                      </span>
                    </div>

                    {!editing ? (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Full Name</p>
                          <p className="mt-1 font-semibold">{profile.fullName || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="mt-1 font-semibold">{profile.email || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4 md:col-span-2">
                          <p className="text-xs text-slate-500">Address</p>
                          <p className="mt-1 font-semibold">{profile.address || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Experience (Years)</p>
                          <p className="mt-1 font-semibold">
                            {profile.experienceYears !== "" ? profile.experienceYears : "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Type of Projects</p>
                          <p className="mt-1 font-semibold">
                            {profile.projectTypes?.length ? profile.projectTypes.join(", ") : "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border p-4 md:col-span-2">
                          <p className="text-xs text-slate-500">Average Rating</p>
                          <p className="mt-1 font-semibold">
                            {Number(profile.avgRating || 0).toFixed(2)} / 5{" "}
                            <span className="text-xs text-slate-500 font-normal">
                              ({Number(profile.totalRatings || 0)} ratings)
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={saveProfile} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <input
                              name="fullName"
                              value={form.fullName}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input
                              name="email"
                              value={form.email}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700">Address</label>
                          <input
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="City, Area"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Experience (Years)
                            </label>
                            <input
                              name="experienceYears"
                              value={form.experienceYears}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              placeholder="e.g., 3"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Type of Projects (select)
                            </label>
                            <input
                              value={searchType}
                              onChange={(e) => setSearchType(e.target.value)}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              placeholder="Search project types..."
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-sm font-medium text-slate-700">Choose your project types</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {filteredTypes.map((type) => {
                              const selected = form.projectTypes.includes(type);
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => toggleProjectType(type)}
                                  className={classNames(
                                    "rounded-full px-3 py-1 text-xs font-semibold border transition",
                                    selected
                                      ? "bg-emerald-700 text-white border-emerald-700"
                                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                                  )}
                                >
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            Selected:{" "}
                            <span className="font-semibold">
                              {form.projectTypes.length ? form.projectTypes.join(", ") : "None"}
                            </span>
                          </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-xl border px-5 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                </>
              )}

              {activeMenu === "projects" && (
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <AvailableProjects embedded={true} />
                </div>
              )}

              {activeMenu === "bids" && (
                <div className="rounded-2xl border bg-white shadow-sm">
                  <MyBids />
                </div>
              )}

              {activeMenu === "ratings" && (
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <MyRatings />
                </div>
              )}

              {activeMenu === "hire-workers" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">Find Workers</h1>
                  <p className="text-sm text-slate-600">Browse and hire workers for your projects.</p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {workers.map((worker, idx) => (
                      <div key={`worker-${worker.id}-${idx}`} className={`rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition ${!worker.is_available ? 'opacity-75' : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                            {worker.fullName[0]}
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900">{worker.fullName}</h3>
                            <p className="text-xs text-slate-500">@{worker.username}</p>
                          </div>
                          <span className={`ml-auto rounded-full px-2 py-1 text-[10px] font-bold uppercase ${worker.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            {worker.is_available ? 'Available' : 'Busy'}
                          </span>
                        </div>
                        <div className="mt-4">
                          <p className="text-xs text-slate-500 uppercase font-bold">Skills</p>
                          <p className="text-sm text-slate-700 mt-1">{worker.skills || "No skills listed"}</p>
                        </div>
                        {!worker.is_available && worker.current_project && (
                          <p className="mt-2 text-xs text-red-500 italic">
                            Currently assigned to: {worker.current_project.title}
                          </p>
                        )}
                        <div className="mt-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-slate-500">Daily Rate</p>
                            <p className="font-bold text-emerald-700">NPR {worker.dailyRate || "N/A"}</p>
                          </div>
                          <button
                            onClick={() => setHiringForm({ ...hiringForm, workerId: worker.id })}
                            disabled={!worker.is_available}
                            className={`rounded-xl px-4 py-2 text-xs font-bold text-white ${worker.is_available ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-slate-400 cursor-not-allowed'}`}
                          >
                            {worker.is_available ? 'Hire Now' : 'Unavailable'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {hiringForm.workerId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-emerald-900 underline">Hire Worker</h2>
                        <form onSubmit={handleHireWorker} className="mt-6 space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Select Project</label>
                            <select
                              required
                              value={hiringForm.projectId}
                              onChange={(e) => setHiringForm({ ...hiringForm, projectId: e.target.value })}
                              className="mt-1 w-full rounded-xl border p-3 text-sm"
                            >
                              <option value="">Select an active project</option>
                              {activeProjects.map((p, idx) => (
                                <option key={`proj-opt-${p.id}-${idx}`} value={p.id}>{p.title}</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Hiring Type</label>
                              <select
                                value={hiringForm.hiringType}
                                onChange={(e) => setHiringForm({ ...hiringForm, hiringType: e.target.value })}
                                className="mt-1 w-full rounded-xl border p-3 text-sm"
                              >
                                <option value="PER_DAY">Per Day</option>
                                <option value="PER_PROJECT">Per Project</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Rate (NPR)</label>
                              <input
                                type="number"
                                required
                                value={hiringForm.rate}
                                onChange={(e) => setHiringForm({ ...hiringForm, rate: e.target.value })}
                                className="mt-1 w-full rounded-xl border p-3 text-sm"
                                placeholder="e.g. 2000"
                              />
                            </div>
                          </div>
                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setHiringForm({ ...hiringForm, workerId: null })}
                              className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={hiringLoading}
                              className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                            >
                              {hiringLoading ? "Hiring..." : "Confirm Hire"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeMenu === "sub-job-apps" && (
                <div>
                  <h1 className="text-2xl font-bold text-emerald-900">Worker Applications</h1>
                  <p className="text-sm text-slate-600">Review workers who want to join your active projects.</p>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {applications.map((app, idx) => (
                      <div key={`app-${app.id}-${idx}`} className="rounded-2xl border bg-white p-6 shadow-sm hover:shadow-md transition">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-slate-900">{app.worker_username}</h3>
                            <p className="text-xs text-emerald-700 font-bold uppercase mt-1">Project: {app.project_title}</p>
                          </div>
                          <span className={classNames(
                            "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                            app.status === "ACCEPTED" ? "bg-emerald-100 text-emerald-700" :
                              app.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                          )}>
                            {app.status}
                          </span>
                        </div>
                        <div className="mt-4 bg-slate-50 rounded-xl p-4 text-sm text-slate-700 italic border">
                          "{app.message || "No message provided."}"
                        </div>
                        <div className="mt-6 flex gap-3">
                          {app.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleAcceptApp(app.id)}
                                className="flex-1 rounded-xl bg-emerald-700 py-3 text-xs font-bold text-white hover:bg-emerald-800"
                              >
                                Accept & Hire
                              </button>
                              <button
                                onClick={() => handleRejectApp(app.id)}
                                className="flex-1 rounded-xl border py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {applications.length === 0 && (
                      <div className="col-span-full py-12 text-center rounded-2xl border-2 border-dashed">
                        <p className="text-slate-400 italic">No applications received yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeMenu === "manage-team" && (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-emerald-900">Manage Team</h1>
                  <p className="text-sm text-slate-600">View and manage workers you've hired.</p>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                        <tr>
                          <th className="px-6 py-4">Worker</th>
                          <th className="px-6 py-4">Project</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assignments.map((a, idx) => (
                          <tr key={`assign-${a.id}-${idx}`} className="bg-white">
                            <td className="px-6 py-4">{a.worker_username}</td>
                            <td className="px-6 py-4">{a.project_title}</td>
                            <td className="px-6 py-4">
                              <span className={classNames(
                                "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                                a.status === "ACTIVE" ? "bg-yellow-100 text-yellow-700" :
                                a.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                a.status === "TERMINATED" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"
                              )}>
                                {a.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              {a.status === "ACTIVE" && (
                                <>
                                  <button
                                    onClick={() => handleCompleteAssignment(a.id)}
                                    className="text-emerald-700 font-bold hover:underline"
                                  >Complete</button>
                                  <button
                                    onClick={() => handleTerminateAssignment(a.id)}
                                    className="text-red-700 font-bold hover:underline"
                                  >Terminate</button>
                                </>
                              )}
                              <button
                                onClick={() => viewWorkerLogs(a)}
                                className="text-blue-700 font-bold hover:underline"
                              >Logs</button>
                            </td>
                          </tr>
                        ))}
                        {assignments.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                              You have not hired any workers yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeMenu === "accepted-projects" && <ContractorProjects />}

              {activeMenu === "manage-tasks" && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-2xl font-bold text-emerald-900">Task Management</h1>
                    <p className="text-sm text-slate-600">Assign specific tasks to your team and review progress.</p>
                  </div>

                  {/* Create Task Form */}
                  <div className="rounded-2xl border bg-white p-6 shadow-sm">
                    <h2 className="font-bold text-emerald-900 mb-4">Assign New Task</h2>
                    <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Task Name</label>
                        <input
                          required
                          value={taskForm.name}
                          onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          placeholder="e.g. Electrical Wiring - Ground Floor"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                        <textarea
                          required
                          value={taskForm.description}
                          onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm focus:ring-emerald-500"
                          rows={3}
                          placeholder="Specific instructions for this task..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Project</label>
                        <select
                          required
                          value={taskForm.projectId}
                          onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm"
                        >
                          <option value="">Select Project</option>
                          {activeProjects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Assign To</label>
                        <select
                          required
                          value={taskForm.assignedTo}
                          onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm"
                        >
                          <option value="">Select Worker</option>
                          {/* Filter assignments based on selected project if needed, but for now show all team members */}
                          {assignments.filter(a => a.status === 'ACTIVE' && (!taskForm.projectId || a.project === parseInt(taskForm.projectId))).map(a => (
                            <option key={a.worker} value={a.worker}>{a.worker_username}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Due Date</label>
                        <input
                          type="date"
                          required
                          value={taskForm.dueDate}
                          onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                          className="mt-1 w-full rounded-xl border p-3 text-sm"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={taskLoading}
                          className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {taskLoading ? "Assigning..." : "Assign Task"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Tasks Table */}
                  <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-500">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                        <tr>
                          <th className="px-6 py-4">Task</th>
                          <th className="px-6 py-4">Worker</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tasks.map((t, idx) => (
                          <React.Fragment key={`task-${t.id}-${idx}`}>
                            <tr className="bg-white">
                              <td className="px-6 py-4">
                                <p className="font-bold text-slate-900">{t.task_name}</p>
                                <p className="text-xs text-slate-500">{t.project_title}</p>
                              </td>
                              <td className="px-6 py-4">{t.assigned_to_username}</td>
                              <td className="px-6 py-4">
                                <span className={classNames(
                                  "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                                  t.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                                    t.status === "REWORK" ? "bg-red-100 text-red-700" :
                                      t.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                                )}>
                                  {t.status.replace("_", " ")}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right space-x-2">
                                {(() => {
                                  const hasUpdates = t.updates && t.updates.length > 0;
                                  return (
                                    <>
                                      {/* Action buttons based on status */}
                                      {t.status === "COMPLETED" && (
                                        <>
                                          <button
                                            onClick={() => hasUpdates && handleAcceptTask(t.id)}
                                            disabled={!hasUpdates}
                                            className={classNames(
                                              "px-3 py-1 rounded-lg text-xs font-bold",
                                              hasUpdates ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            )}
                                          >
                                            Accept
                                          </button>

                                          <button
                                            onClick={() => hasUpdates && handleRejectTask(t.id)}
                                            disabled={!hasUpdates}
                                            className={classNames(
                                              "px-3 py-1 rounded-lg text-xs font-bold",
                                              hasUpdates ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            )}
                                          >
                                            Reject
                                          </button>

                                          {!hasUpdates && (
                                            <span className="text-xs text-slate-400 ml-2">Awaiting worker update</span>
                                          )}
                                        </>
                                      )}
                                      
                                      {t.status === "PENDING" && (
                                        <>
                                          <button
                                            onClick={() => handleAcceptTask(t.id)}
                                            className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                          >
                                            Accept
                                          </button>
                                          
                                          <button
                                            onClick={() => handleRejectTask(t.id)}
                                            className="px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200"
                                          >
                                            Reject
                                          </button>
                                        </>
                                      )}
                                      
                                      {/* Universal actions available for all statuses */}
                                      <button
                                        onClick={() => handleReviewTask(t.id)}
                                        className="font-bold text-blue-700 hover:underline"
                                      >
                                        Review
                                      </button>
                                      
                                      <button
                                        onClick={() => handleUpdateTaskStatus(t.id)}
                                        className="font-bold text-purple-700 hover:underline"
                                      >
                                        Update Status
                                      </button>
                                    </>
                                  );
                                })()}
                              </td>
                            </tr>
                            {/* Photo Updates Slide-down? For now just show if COMPLETED */}
                            {t.updates && t.updates.length > 0 && (
                              <tr className="bg-slate-50/50">
                                <td colSpan="4" className="px-6 py-4">
                                  <div className="flex gap-4 overflow-x-auto pb-2">
                                    {t.updates.map((up, uIdx) => (
                                      <div key={`task-up-${up.id}-${uIdx}`} className="min-w-[200px] bg-white p-3 rounded-lg border shadow-sm">
                                        {up.photo && (
                                          <img
                                            src={up.photo}
                                            alt="Update"
                                            className="w-full h-24 object-cover rounded-md mb-2 cursor-pointer hover:opacity-80"
                                            onClick={() => window.open(up.photo, '_blank')}
                                          />
                                        )}
                                        <p className="text-xs text-slate-700 line-clamp-2 italic">"{up.description}"</p>
                                        <p className="text-[10px] text-slate-400 mt-2">{new Date(up.created_at).toLocaleDateString()}</p>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                        {tasks.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">No tasks assigned yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* Task Review Modal */}
      {reviewModalOpen && reviewTaskData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-emerald-900">Task Review</h2>
              <button 
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-slate-500">Task Name</p>
                  <p className="mt-1 font-semibold">{reviewTaskData.task.task_name}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="mt-1 font-semibold">
                    <span className={classNames(
                      "rounded-full px-2 py-1 text-[10px] font-bold uppercase",
                      reviewTaskData.task.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                        reviewTaskData.task.status === "REWORK" ? "bg-red-100 text-red-700" :
                          reviewTaskData.task.status === "COMPLETED" ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                    )}>
                      {reviewTaskData.task.status.replace("_", " ")}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Description</p>
                <p className="mt-1">{reviewTaskData.task.description}</p>
              </div>
              
              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Project</p>
                <p className="mt-1 font-semibold">{reviewTaskData.task.project_title}</p>
              </div>
              
              {reviewTaskData.task.comments && (
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-slate-500">Comments</p>
                  <p className="mt-1 italic">{reviewTaskData.task.comments}</p>
                </div>
              )}
              
              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Available Actions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {reviewTaskData.available_actions.map(action => (
                    <span 
                      key={action} 
                      className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700"
                    >
                      {action.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Task Updates Section */}
              <div className="rounded-xl border p-4">
                <p className="text-xs text-slate-500">Task Updates</p>
                <div className="mt-3 space-y-3">
                    {reviewTaskData.updates && reviewTaskData.updates.length > 0 ? (
                      reviewTaskData.updates.map((update, upIdx) => (
                        <div key={`rev-up-${update.id}-${upIdx}`} className="p-3 bg-slate-50 rounded-lg border">
                        <p className="text-sm">{update.description}</p>
                        <div className="mt-2 text-xs text-slate-500">
                          By {update.worker_username} on {new Date(update.created_at).toLocaleDateString()}
                        </div>
                        {update.photo && (
                          <div className="mt-2">
                            <img 
                              src={update.photo} 
                              alt="Task Update" 
                              className="max-w-xs h-auto rounded border"
                              onClick={() => window.open(update.photo, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No updates yet.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Status Update Modal */}
      {statusUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-emerald-900">Update Task Status</h2>
              <button 
                onClick={() => setStatusUpdateModalOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Select New Status</label>
                <select 
                  id="status-select"
                  className="mt-1 w-full rounded-xl border p-3 text-sm"
                >
                  <option value="">-- Select Status --</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REWORK">Rework Required</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Comments (Optional)</label>
                <textarea 
                  id="status-comments"
                  rows="3"
                  className="mt-1 w-full rounded-xl border p-3 text-sm"
                  placeholder="Add any comments about the status change..."
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStatusUpdateModalOpen(false)}
                className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpdateTaskStatus}
                className="flex-1 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* worker logs modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-8 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-slate-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-900 to-emerald-600 bg-clip-text text-transparent">
                  Work Logs: {selectedWorkerName}
                </h2>
                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">
                  Detailed progress for this assignment
                </p>
              </div>
              <button 
                onClick={() => setLogModalOpen(false)}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm mb-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-500 border-collapse">
                <thead className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Project</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedWorkerLogs.map((log, lIdx) => (
                    <tr key={`log-row-${log.id}-${lIdx}`} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-900">
                        Project #{log.project}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                          {log.hours_worked}h
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={classNames(
                            "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight shadow-sm",
                            log.status === "APPROVED" ? "bg-emerald-500 text-white" : 
                            log.status === "REJECTED" ? "bg-red-500 text-white" : "bg-amber-100 text-amber-700"
                          )}>
                            {log.status === "PENDING" ? "● Pending" : log.status}
                          </span>
                          <span className={classNames(
                            "text-[10px] font-bold px-2 py-0.5 rounded-md",
                            log.payment_status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          )}>
                            {log.payment_status || "UNPAID"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-2">
                          {log.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApproveLog(log.id)}
                                className="h-8 px-4 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-sm hover:shadow transition-all active:scale-95"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectLog(log.id)}
                                className="h-8 px-4 rounded-lg bg-white border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-all active:scale-95"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {log.status === "APPROVED" && log.payment_status !== "PAID" && (
                            <button
                              onClick={() => handlePayLog(log.id)}
                              className="h-9 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-200 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                            >
                              <span className="hidden sm:inline">Mark as Paid</span>
                              <span className="sm:hidden">Pay</span>
                              <span>→</span>
                            </button>
                          )}
                          {log.payment_status === "PAID" && (
                            <span className="text-emerald-600 text-[10px] font-bold italic">Transaction Complete</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {selectedWorkerLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl text-slate-300">📋</span>
                          </div>
                          <p className="text-slate-400 font-medium italic">No work logs found for this worker.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setLogModalOpen(false)}
                className="h-11 px-8 rounded-2xl border-2 border-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}