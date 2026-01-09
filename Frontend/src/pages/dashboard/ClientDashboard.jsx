import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

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
    createdAt: p.created_at || p.createdAt || "",
    location: p.location || "",
    description: p.description || "",
  };
}

export default function ClientDashboard() {
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");

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

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      return (
        (p.title || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.status || "").toLowerCase().includes(q) ||
        (p.location || "").toLowerCase().includes(q)
      );
    });
  }, [search, projects]);

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "ACTIVE").length;
    const bidding = projects.filter((p) => p.status === "BIDDING").length;
    const completed = projects.filter((p) => p.status === "COMPLETED").length;

    const totalSpend = projects
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

    return { active, bidding, completed, totalSpend };
  }, [projects]);

  const menuItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "postproject", label: "Post Project", route: "/client/postproject" },
    { key: "my-projects", label: "My Projects", route: "/client/projects" },
    { key: "project-bids", label: "Project Bids", route: "/client/project-bids" },
    { key: "messages", label: "Messages" },
    { key: "payments", label: "Payments" },
    { key: "profile", label: "Profile" },
  ];

  function handleMenuClick(item) {
    if (item.route) {
      navigate(item.route);
      return;
    }
    setActiveMenu(item.key);
  }

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
              <p className="text-xs text-slate-500">Client Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProjects}
              className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              onClick={() => navigate("/client/postproject")}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Post a Project
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-r bg-emerald-900 text-white">
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-200">Client Menu</p>

            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleMenuClick(item)}
                className={classNames(
                  "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                  activeMenu === item.key ? "bg-emerald-700 text-white shadow" : "bg-emerald-900 hover:bg-emerald-800"
                )}
              >
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}

            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-xs text-emerald-200">Quick Tip</p>
              <p className="mt-2 text-sm text-white/90">
                Post a clear description and location to get better bids.
              </p>
            </div>
          </div>
        </aside>

        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              {activeMenu === "dashboard" && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-emerald-900">Overview</h1>
                      <p className="text-sm text-slate-600">
                        Track your projects and progress.
                      </p>
                    </div>

                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search projects..."
                      className="w-full sm:w-72 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                      <p className="text-xs text-slate-500">Active Projects</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.active}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                      <p className="text-xs text-slate-500">Projects in Bidding</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.bidding}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                      <p className="text-xs text-slate-500">Completed Projects</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-900">{stats.completed}</p>
                    </div>
                    <div className="rounded-2xl border bg-white p-5 shadow-sm">
                      <p className="text-xs text-slate-500">Total Spend (Completed)</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-900">
                        NPR {stats.totalSpend.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <section className="mt-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-5 py-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-emerald-900">Recent Projects</h2>
                        <p className="text-xs text-slate-500">These are your real posted projects.</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={loadProjects}
                          className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                        >
                          Refresh
                        </button>
                        <button
                          onClick={() => navigate("/client/postproject")}
                          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                        >
                          + New Project
                        </button>
                      </div>
                    </div>

                    {loadingProjects && (
                      <div className="px-5 py-4 text-sm text-emerald-900 bg-emerald-50">
                        Loading projects...
                      </div>
                    )}

                    {projectsError && !loadingProjects && (
                      <div className="px-5 py-4 text-sm text-red-700 bg-red-50">
                        {projectsError}
                      </div>
                    )}

                    {!loadingProjects && !projectsError && (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-emerald-50">
                            <tr className="text-left text-emerald-900">
                              <th className="px-5 py-3 font-semibold">Title</th>
                              <th className="px-5 py-3 font-semibold">Category</th>
                              <th className="px-5 py-3 font-semibold">Budget</th>
                              <th className="px-5 py-3 font-semibold">Status</th>
                              <th className="px-5 py-3 font-semibold">Created</th>
                              <th className="px-5 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredProjects.length === 0 ? (
                              <tr>
                                <td className="px-5 py-6 text-slate-500" colSpan={6}>
                                  No projects found.
                                </td>
                              </tr>
                            ) : (
                              filteredProjects.map((p) => (
                                <tr key={p.id} className="border-t">
                                  <td className="px-5 py-3 font-semibold">{p.title}</td>
                                  <td className="px-5 py-3">{p.category}</td>
                                  <td className="px-5 py-3">NPR {Number(p.budget).toLocaleString()}</td>
                                  <td className="px-5 py-3">
                                    <span
                                      className={classNames(
                                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                                        p.status === "ACTIVE" && "bg-emerald-100 text-emerald-900",
                                        p.status === "BIDDING" && "bg-yellow-100 text-yellow-900",
                                        p.status === "COMPLETED" && "bg-slate-100 text-slate-700"
                                      )}
                                    >
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3">{(p.createdAt || "").slice(0, 10)}</td>
                                  <td className="px-5 py-3">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => navigate(`/client/projects`)}
                                        className="rounded-lg border px-3 py-1 text-xs hover:bg-slate-50"
                                      >
                                        View
                                      </button>
                                      <button
                                        className="rounded-lg bg-emerald-900 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-950"
                                      >
                                        Manage
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Keep your other sections as placeholders */}
                  <section className="mt-8 rounded-2xl border bg-white shadow-sm">
                    <div className="border-b px-5 py-4">
                      <h2 className="font-semibold text-emerald-900">Bids</h2>
                      <p className="text-xs text-slate-500">We can connect bids later.</p>
                    </div>
                    <div className="p-5 text-sm text-slate-600">
                      This section is ready for backend integration next.
                    </div>
                  </section>
                </>
              )}

              {activeMenu !== "dashboard" && (
                <div className="rounded-2xl border bg-white p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-emerald-900">
                    {activeMenu.replace("-", " ").toUpperCase()}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    This page UI is ready. We can connect it to Django next.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
