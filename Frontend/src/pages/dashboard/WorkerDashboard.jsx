import React, {useMemo, useState } from "react";

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
  const [activeMenu, setActiveMenu] = useState("dashboard");



  // Data placeholders (connect later)
  const [availableJobs] = useState([]);
  const [myJobs] = useState([]);
  const [payments] = useState([]);

  
  // Basic stats
  const stats = useMemo(() => {
    const active = myJobs.filter(
      (j) => (j.status || "").toUpperCase() === "ACTIVE",
    ).length;
    const completed = myJobs.filter(
      (j) => (j.status || "").toUpperCase() === "COMPLETED",
    ).length;
    const pendingPay = payments.filter(
      (p) => (p.status || "").toUpperCase() !== "PAID",
    ).length;

    return {
      available: availableJobs.length,
      active,
      completed,
      pendingPay,
    };
  }, [availableJobs, myJobs, payments]);
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top Bar */}
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

          <button
            onClick={() => setActiveMenu("available")}
            className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
          >
            Available Jobs
          </button>
        </div>
      </header>

      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="min-h-screen border-r bg-emerald-900 text-white">
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-200">
              Worker Menu
            </p>

            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "available", label: "Available Jobs" },
              { key: "myjobs", label: "My Jobs" },
              { key: "payments", label: "Payments" },
              { key: "profile", label: "Profile" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={classNames(
                  "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                  activeMenu === item.key
                    ? "bg-emerald-700 text-white shadow"
                    : "bg-emerald-900 hover:bg-emerald-800",
                )}
              >
                <span className="font-semibold">{item.label}</span>
              </button>
            ))}

            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-xs text-emerald-200">Tip</p>
              <p className="mt-2 text-sm text-white/90">
                Add more skills to get better matching jobs.
              </p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
              {/* DASHBOARD */}
              {activeMenu === "dashboard" && (
                <>
                  <h1 className="text-2xl font-bold text-emerald-900">
                    Overview
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Your work and payment summary.
                  </p>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Available Jobs" value={stats.available} />
                    <StatCard title="Active Jobs" value={stats.active} />
                    <StatCard title="Completed Jobs" value={stats.completed} />
                    <StatCard
                      title="Pending Payments"
                      value={stats.pendingPay}
                    />
                  </div>

                  <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
                    <p className="font-semibold text-emerald-900">
                      Quick Actions
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setActiveMenu("available")}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        Browse Available Jobs
                      </button>
                      <button
                        onClick={() => setActiveMenu("profile")}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Update Profile
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
