import React, { useState, useEffect } from "react";
import api from "../../API/axios";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function AdminIssueManagement() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [filters, setFilters] = useState({
        status: "ALL",
        priority: "",
        type: "",
        search: ""
    });
    const [updateForm, setUpdateForm] = useState({
        status: "",
        admin_note: ""
    });
    const [updating, setUpdating] = useState(false);
    
    const [searchParams] = useSearchParams();
    const highlightIssueId = searchParams.get("issue");

    const fetchIssues = async () => {
        setLoading(true);
        try {
            const params = { ...filters };
            if (params.status === "ALL") delete params.status;

            const response = await api.get("/api/admin/reports/", {
                params: params
            });
            setIssues(response.data.results || response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.status, filters.priority, filters.type]);

    useEffect(() => {
        if (highlightIssueId && issues.length > 0 && !selectedIssue) {
            const targetIssue = issues.find(i => i.id.toString() === highlightIssueId);
            if (targetIssue) {
                handleSelectIssue(targetIssue);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [issues, highlightIssueId]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchIssues();
    };

    const handleSelectIssue = (issue) => {
        setSelectedIssue(issue);
        setUpdateForm({
            status: issue.status,
            admin_note: issue.admin_note || ""
        });
    };

    const handleUpdateIssue = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await api.patch(`/api/admin/reports/${selectedIssue.id}/`, updateForm);
            toast.success("Issue state synchronized");
            fetchIssues();
            setSelectedIssue(prev => ({ ...prev, ...updateForm }));
        } catch (err) {
            console.error(err);
            toast.error("Failed to update ticket status");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ";
        switch (status) {
            case "OPEN": return <span className={base + "bg-blue-50 text-blue-600 border border-blue-100"}>Open</span>;
            case "IN_PROGRESS": return <span className={base + "bg-orange-50 text-orange-600 border border-orange-100"}>In Progress</span>;
            case "RESOLVED": return <span className={base + "bg-emerald-50 text-emerald-600 border border-emerald-100"}>Resolved</span>;
            case "REJECTED": return <span className={base + "bg-red-50 text-red-600 border border-red-100"}>Rejected</span>;
            default: return <span className={base + "bg-slate-50 text-slate-600 border border-slate-100"}>{status}</span>;
        }
    };

    const getPriorityBadge = (priority) => {
        const base = "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ";
        switch (priority) {
            case "HIGH": return <span className={base + "bg-red-500 text-white"}>High Priority</span>;
            case "MEDIUM": return <span className={base + "bg-orange-400 text-white"}>Medium</span>;
            case "LOW": return <span className={base + "bg-emerald-500 text-white"}>Low</span>;
            default: return <span className={base + "bg-slate-400 text-white"}>{priority}</span>;
        }
    };

    const stats = {
        open: issues.filter(i => i.status === "OPEN").length,
        inProgress: issues.filter(i => i.status === "IN_PROGRESS").length,
        resolved: issues.filter(i => i.status === "RESOLVED").length,
        highPending: issues.filter(i => i.priority === "HIGH" && i.status !== "RESOLVED").length
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Issue Management</h1>
                <p className="text-slate-500 text-sm">Review platform reports, handle disputes, and maintain community standards.</p>
            </div>

            {/* Analytics Ledger */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatBox label="Open Tickets" value={stats.open} color="blue" />
                <StatBox label="Under Review" value={stats.inProgress} color="orange" />
                <StatBox label="Resolved" value={stats.resolved} color="emerald" />
                <StatBox label="Critical Fixes" value={stats.highPending} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* List Architecture */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-wrap gap-4 items-center">
                            <select
                                className="text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 focus:ring-emerald-500 py-2.5"
                                value={filters.status}
                                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="ALL">All States</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">Processing</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Filter system logs..."
                                    className="w-full text-xs font-bold rounded-xl border-slate-200 pl-10 focus:ring-emerald-500 py-2.5"
                                    value={filters.search}
                                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4">Ticket ID</th>
                                        <th className="px-6 py-4">Subject & Context</th>
                                        <th className="px-6 py-4">Current Status</th>
                                        <th className="px-6 py-4 text-right">View</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan="4" className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] italic">Syncing stream...</td></tr>
                                    ) : issues.map(issue => (
                                        <tr
                                            key={issue.id}
                                            className={`hover:bg-slate-50/50 cursor-pointer transition-all duration-300 group ${selectedIssue?.id === issue.id ? "bg-emerald-50/50" : ""}`}
                                            onClick={() => handleSelectIssue(issue)}
                                        >
                                            <td className="px-6 py-6 text-xs font-black text-slate-300">#{issue.id}</td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors">{issue.title}</span>
                                                    {getPriorityBadge(issue.priority)}
                                                </div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    Reporter: <span className="text-slate-600 font-black">@{issue.reporter_username}</span> • {issue.report_type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {getStatusBadge(issue.status)}
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="h-8 w-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-all shadow-sm">
                                                    →
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Conflict Detail Terminal */}
                <div className="lg:col-span-1">
                    {selectedIssue ? (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-8 sticky top-28 animate-in slide-in-from-right-4 duration-500">
                            <h2 className="text-lg font-black text-slate-900 mb-6">Execution Panel</h2>

                            <div className="space-y-6 mb-8">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Claim Summary</p>
                                    <div className="bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100 italic text-[13px] leading-relaxed text-slate-600 border-l-4 border-l-emerald-500">
                                        "{selectedIssue.description}"
                                    </div>
                                </div>
                                {selectedIssue.attachment && (
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Evidence Files</p>
                                        <a
                                            href={selectedIssue.attachment}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-3 text-[10px] font-black text-emerald-700 hover:text-white hover:bg-emerald-700 bg-emerald-50 px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-700/10 uppercase tracking-widest"
                                        >
                                            Inspect Documents
                                        </a>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleUpdateIssue} className="border-t border-slate-100 pt-8 space-y-6">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Resolution Protocol</label>
                                    <select
                                        className="w-full rounded-2xl border-slate-200 focus:ring-emerald-500 font-bold text-sm py-3.5 bg-slate-50/50"
                                        value={updateForm.status}
                                        onChange={e => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="OPEN">Open Ticket</option>
                                        <option value="IN_PROGRESS">Escalate / Process</option>
                                        <option value="RESOLVED">Mark as Resolved</option>
                                        <option value="REJECTED">Dismiss Claim</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Internal Log / Admin Feedback</label>
                                    <textarea
                                        rows={4}
                                        className="w-full rounded-2xl border-slate-200 focus:ring-emerald-500 text-sm p-4 bg-slate-50/50"
                                        placeholder="Add resolution details or confidential notes..."
                                        value={updateForm.admin_note}
                                        onChange={e => setUpdateForm(prev => ({ ...prev, admin_note: e.target.value }))}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-emerald-950 text-white rounded-2xl py-4 font-black text-sm hover:bg-black transition-all shadow-xl shadow-emerald-950/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                                >
                                    {updating ? "Syncing..." : "Apply Resolution"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px] animate-pulse">
                            <div className="h-20 w-20 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 text-2xl grayscale opacity-40">
                                📑
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Awaiting Ticket Selection</p>
                            <p className="text-slate-300 text-xs mt-2">Pick an issue from the registry to begin auditing.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color }) {
    const colors = {
        blue: "text-blue-600 bg-blue-50 border-blue-100 shadow-blue-600/5",
        orange: "text-orange-600 bg-orange-50 border-orange-100 shadow-orange-600/5",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-600/5",
        red: "text-red-600 bg-red-50 border-red-100 shadow-red-600/5",
    };
    return (
        <div className={`p-8 rounded-[2rem] border shadow-lg ${colors[color]} transition-transform hover:scale-105 duration-500`}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
            <p className="text-4xl font-black text-slate-800">{value}</p>
        </div>
    );
}
