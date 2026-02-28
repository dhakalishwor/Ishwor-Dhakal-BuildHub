import React, { useEffect, useState } from "react";
import api from "../../API/axios";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function AdminProjectMonitoring() {
    const [projects, setProjects] = useState([]);
    const [workLogs, setWorkLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState("ACTIVE");

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [projRes, logRes] = await Promise.all([
                api.get("/api/projects/"),
                api.get("/api/work-logs/")
            ]);
            setProjects(projRes.data);
            setWorkLogs(logRes.data);
        } catch (err) {
            console.error("Failed to fetch admin monitoring data", err);
        } finally {
            setLoading(false);
        }
    }

    const filteredProjects = projects.filter(p => filter === "ALL" || p.status === filter);

    return (
        <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-emerald-900">Project Monitoring</h1>
                    <p className="text-sm text-slate-600">Overview of all platform activity and progress.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                >
                    Refresh Data
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {["ALL", "BIDDING", "ACTIVE", "COMPLETED"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={classNames(
                            "px-4 py-2 text-xs font-bold rounded-lg transition",
                            filter === f ? "bg-emerald-700 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-slate-500 italic">Updating records...</p>
            ) : (
                <div className="space-y-8">
                    {/* Active Projects List */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Active Projects & Status</h2>
                        <div className="grid gap-4">
                            {filteredProjects.map(p => {
                                const projectLogs = workLogs.filter(l => l.project === p.id);
                                const totalHours = projectLogs.filter(l => l.status === "APPROVED").reduce((sum, l) => sum + Number(l.hours_worked), 0);

                                return (
                                    <div key={p.id} className="rounded-2xl border bg-white p-6 shadow-sm">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-emerald-900">{p.title}</h3>
                                                <p className="text-xs text-slate-500">Client: {p.client_username || "N/A"}</p>
                                            </div>
                                            <span className={classNames(
                                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                                p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                                            )}>
                                                {p.status}
                                            </span>
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed text-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Hiring Model</p>
                                                <p className="text-xs font-bold text-slate-700">{p.hiring_model}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed text-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Daily Rate</p>
                                                <p className="text-xs font-bold text-slate-700">{p.daily_rate ? `NPR ${p.daily_rate}` : "N/A"}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed text-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Log Count</p>
                                                <p className="text-xs font-bold text-slate-700">{projectLogs.length}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-xl border border-dashed text-center">
                                                <p className="text-[10px] text-slate-400 uppercase">Appr. Hours</p>
                                                <p className="text-xs font-bold text-emerald-700 font-mono">{totalHours}h</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredProjects.length === 0 && (
                                <p className="text-slate-400 italic">No projects found for this filter.</p>
                            )}
                        </div>
                    </section>

                    {/* Platform Work Logs Overview */}
                    <section>
                        <h2 className="text-lg font-bold text-slate-700 mb-4">Platform Work Logs</h2>
                        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                            <table className="w-full text-left text-sm text-slate-500">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-700">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Project</th>
                                        <th className="px-6 py-3">Worker</th>
                                        <th className="px-6 py-3">Hours</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {workLogs.slice(0, 10).map(log => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                                            <td className="px-6 py-4 font-medium text-slate-900">#{log.project}</td>
                                            <td className="px-6 py-4">{log.worker_username || "N/A"}</td>
                                            <td className="px-6 py-4">{log.hours_worked}</td>
                                            <td className="px-6 py-4">
                                                <span className={classNames(
                                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                                    log.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-yellow-100 text-yellow-800"
                                                )}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
