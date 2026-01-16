import React, { useEffect, useMemo, useState } from "react";
import api from "../../API/axios";

import PostProject from "../client/PostProject";
import ProjectBids from "../client/ProjectBids";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

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

function MyProjectsView({
  projects,
  loading,
  error,
  onRefresh,
  onMarkCompleted,
  actionLoadingId,
}) {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">My Projects</h1>
          <p className="text-sm text-slate-600">
            Manage your projects and mark them completed after work is done.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-white"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-emerald-900">
          Loading projects...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow">
          No projects posted yet.
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="grid gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow p-5 border">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-emerald-900">
                      {p.title}
                    </h3>
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
                        onClick={() => onMarkCompleted(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {actionLoadingId === p.id
                          ? "Completing..."
                          : "Mark Completed"}
                      </button>
                    )}

                    {p.status === "COMPLETED" && p.rated && (
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
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [ratingProjectId, setRatingProjectId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function loadProjects() {
    setLoadingProjects(true);
    setProjectsError("");
    try {
      const res = await api.get("/api/projects/");
      const list = Array.isArray(res.data)
        ? res.data.map(normalizeProject)
        : [];
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

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.category, p.status, p.location]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, projects]);

  const stats = useMemo(() => {
    return {
      active: projects.filter((p) => p.status === "ACTIVE").length,
      bidding: projects.filter((p) => p.status === "BIDDING").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      totalSpend: projects
        .filter((p) => p.status === "COMPLETED")
        .reduce((s, p) => s + Number(p.budget || 0), 0),
    };
  }, [projects]);

  const menuItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "postproject", label: "Post Project" },
    { key: "my-projects", label: "My Projects" },
    { key: "project-bids", label: "Project Bids" },
    { key: "profile", label: "Profile" },
  ];

  function handleMenuClick(item) {
    setActiveMenu(item.key);
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-10 border-b bg-white">
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

          <button
            onClick={() => setActiveMenu("postproject")}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Post Project
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r bg-emerald-900 text-white p-4">
          <p className="text-xs uppercase text-emerald-200">Client Menu</p>
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleMenuClick(item)}
              className={classNames(
                "mt-3 w-full rounded-xl px-4 py-3 text-left",
                activeMenu === item.key
                  ? "bg-emerald-700"
                  : "hover:bg-emerald-800"
              )}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main className="p-6">
          {activeMenu === "dashboard" && (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="mb-4 w-full rounded-xl border px-4 py-2"
              />

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="border p-4 rounded-xl">
                  Active: {stats.active}
                </div>
                <div className="border p-4 rounded-xl">
                  Bidding: {stats.bidding}
                </div>
                <div className="border p-4 rounded-xl">
                  Completed: {stats.completed}
                </div>
                <div className="border p-4 rounded-xl">
                  Spend: NPR {stats.totalSpend}
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
                    <p className="text-sm mt-1">Status: {p.status}</p>

                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => markCompleted(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {actionLoadingId === p.id
                          ? "Completing..."
                          : "Mark Completed"}
                      </button>
                    )}

                    {p.status === "COMPLETED" && !p.rated && (
                      <>
                        <button
                          onClick={() =>
                            setRatingProjectId(
                              ratingProjectId === p.id ? null : p.id
                            )
                          }
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

                    {p.rated && (
                      <p className="mt-2 text-xs text-emerald-700 font-semibold">
                        Already Rated
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeMenu === "my-projects" && (
            <MyProjectsView
              projects={projects}
              loading={loadingProjects}
              error={projectsError}
              onRefresh={loadProjects}
              onMarkCompleted={markCompleted}
              actionLoadingId={actionLoadingId}
            />
          )}

          {activeMenu === "postproject" && (
            <PostProject
              onCreated={() => {
                loadProjects();
                setActiveMenu("my-projects");
              }}
            />
          )}

          {activeMenu === "project-bids" && (
            <ProjectBids onDone={() => setActiveMenu("dashboard")} />
          )}

          {activeMenu === "profile" && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-900">PROFILE</h2>
              <p className="mt-2 text-sm text-slate-600">
                This page is for profile.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
