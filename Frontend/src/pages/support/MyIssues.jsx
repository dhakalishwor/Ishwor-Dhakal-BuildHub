import React, { useState, useEffect } from "react";
import api from "../../API/axios"; // Use the custom api instance
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

export default function MyIssues() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [role, setRole] = useState("client");
    const [searchParams] = useSearchParams();
    const highlightIssueId = searchParams.get("issue");

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        if (storedRole) setRole(storedRole);

        const fetchIssues = async () => {
            try {
                const response = await api.get("/api/reports/me/");
                setIssues(response.data.results || response.data);
            } catch (err) {
                console.error(err);
                const errorData = err.response?.data;
                let errorMessage = "Failed to load issues.";

                if (typeof errorData === 'object' && errorData !== null) {
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else {
                        errorMessage = Object.entries(errorData)
                            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                            .join(' | ');
                    }
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchIssues();
    }, []);

    const getStatusBadge = (status) => {
        const base = "px-3 py-1 rounded-full text-xs font-bold uppercase ";
        switch (status) {
            case "OPEN": return <span className={base + "bg-blue-100 text-blue-700"}>Open</span>;
            case "IN_PROGRESS": return <span className={base + "bg-yellow-100 text-yellow-700"}>In Progress</span>;
            case "RESOLVED": return <span className={base + "bg-green-100 text-green-700"}>Resolved</span>;
            case "REJECTED": return <span className={base + "bg-red-100 text-red-700"}>Rejected</span>;
            default: return <span className={base + "bg-gray-100 text-gray-700"}>{status}</span>;
        }
    };

    const getPriorityBadge = (priority) => {
        const base = "px-2 py-0.5 rounded text-[10px] font-bold uppercase ";
        switch (priority) {
            case "HIGH": return <span className={base + "bg-red-500 text-white"}>High</span>;
            case "MEDIUM": return <span className={base + "bg-orange-400 text-white"}>Medium</span>;
            case "LOW": return <span className={base + "bg-emerald-500 text-white"}>Low</span>;
            default: return <span className={base + "bg-gray-400 text-white"}>{priority}</span>;
        }
    };

    return (
        <DashboardLayout role={role} activeMenu="my-issues">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-emerald-900 tracking-tight">My Support Tickets</h1>
                    <p className="text-slate-500 mt-2">Track and manage your reported issues.</p>
                </div>
                <Link
                    to="/support/report"
                    className="bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-800 transition shadow-md shadow-emerald-900/10 active:scale-[0.98]"
                >
                    Report New Issue
                </Link>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-800 rounded-2xl border border-red-100 flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-700">!</span>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/5 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">
                        <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="font-medium">Loading your tickets...</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-emerald-50">
                            <tr>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">ID</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Priority</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Submitted</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {issues.length > 0 ? issues.map(issue => (
                                <tr 
                                    key={issue.id} 
                                    className={`transition-colors ${highlightIssueId && issue.id.toString() === highlightIssueId ? "bg-emerald-100/50" : "hover:bg-emerald-50/30"}`}
                                >
                                    <td className="px-6 py-6 text-sm font-bold text-slate-300">#{issue.id}</td>
                                    <td className="px-6 py-6">
                                        <p className="text-sm font-bold text-slate-800">{issue.title}</p>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs">{issue.description}</p>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg uppercase tracking-wider">{issue.report_type}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        {getPriorityBadge(issue.priority)}
                                    </td>
                                    <td className="px-6 py-6 font-medium">
                                        {getStatusBadge(issue.status)}
                                    </td>
                                    <td className="px-6 py-6 text-sm text-slate-500">
                                        {new Date(issue.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                                        <div className="mb-2 text-slate-200">
                                            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="italic">No support tickets found.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}
