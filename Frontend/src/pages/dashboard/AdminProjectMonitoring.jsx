import React, { useEffect, useState } from "react";
import api from "../../API/axios";

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
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Monitoring</h1>
                    <p className="text-slate-500 text-sm">Real-time oversight of all platform activity and construction progress.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="group bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm hover:border-emerald-200 hover:text-emerald-700 transition-all shadow-sm active:scale-95 flex items-center gap-2"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" /></svg>
                    <span>{loading ? 'Syncing...' : 'Refresh Stream'}</span>
                </button>
            </div>

            {/* Filter Hub */}
            <div className="flex flex-wrap gap-2 p-2 bg-slate-100/50 rounded-2xl w-fit border border-slate-100">
                {["ALL", "BIDDING", "ACTIVE", "COMPLETED"].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${
                            filter === f 
                            ? "bg-white text-emerald-700 shadow-md scale-105" 
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="space-y-12">
                {/* Visual Project Matrix */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Matrix</h2>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{filteredProjects.length} Projects Shown</span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredProjects.map(p => {
                            const projectLogs = workLogs.filter(l => l.project === p.id);
                            const totalHours = projectLogs.filter(l => l.status === "APPROVED").reduce((sum, l) => sum + Number(l.hours_worked), 0);

                            return (
                                <div key={p.id} className="relative group bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner">🏗️</div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{p.title}</h3>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Client: @{p.client_username || "anonymous"}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            p.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : 
                                            p.status === "BIDDING" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"
                                        }`}>
                                            {p.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <MetricBox label="Model" value={p.hiring_model} />
                                        <MetricBox label="Daily Rate" value={p.daily_rate ? `NPR ${p.daily_rate}` : "Fixed"} />
                                        <MetricBox label="Work Samples" value={projectLogs.length} />
                                        <MetricBox label="Billable" value={`${totalHours}h`} highlight />
                                    </div>

                                    {/* Small Progress Glow */}
                                    {p.status === "ACTIVE" && (
                                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent blur-sm"></div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredProjects.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Zero Operational Data Available</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Global Work Stream */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Work Log Registry</h2>
                        <button className="text-[10px] font-bold text-emerald-600 hover:underline">View Full Audit Log →</button>
                    </div>
                    <div className="overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Token</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Worker Identity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Intensity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Validity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {workLogs.slice(0, 10).map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                                        <td className="px-8 py-5 font-black text-slate-900 group-hover:text-emerald-700 transition-colors">#{log.project}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 w-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">@</div>
                                                <span className="text-xs font-bold text-slate-700">{log.worker_username || "system"}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700 font-mono">{log.hours_worked}h</span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                                                log.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-orange-100 text-orange-800"
                                            }`}>
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
        </div>
    );
}

function MetricBox({ label, value, highlight }) {
    return (
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-center transition-all group-hover:bg-white group-hover:shadow-inner">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xs font-bold ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>{value}</p>
        </div>
    );
}
