import React, { useState, useEffect } from "react";
import api from "../../API/axios";

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
    }, [filters.status, filters.priority, filters.type]);

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
            alert("Issue updated successfully");
            fetchIssues();
            setSelectedIssue(prev => ({ ...prev, ...updateForm }));
        } catch (err) {
            console.error(err);
            alert("Failed to update issue");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status) => {
        const base = "px-2.5 py-1 rounded-full text-xs font-bold uppercase ";
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

    const stats = {
        open: issues.filter(i => i.status === "OPEN").length,
        inProgress: issues.filter(i => i.status === "IN_PROGRESS").length,
        resolved: issues.filter(i => i.status === "RESOLVED").length,
        highPending: issues.filter(i => i.priority === "HIGH" && i.status !== "RESOLVED").length
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-emerald-900 mb-6">Issue Management</h1>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Open Issues</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{stats.open}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">In Progress</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.inProgress}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">Resolved</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase">High Priority Pending</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.highPending}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* List View */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                        <div className="p-4 border-b bg-gray-50/50 flex flex-wrap gap-3 items-center">
                            <select
                                className="text-sm rounded-xl border-gray-300"
                                value={filters.status}
                                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="ALL">All Status</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                            <select
                                className="text-sm rounded-xl border-gray-300"
                                value={filters.priority}
                                onChange={e => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                            >
                                <option value="">All Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
                                <input
                                    type="text"
                                    placeholder="Search by ID, title, user..."
                                    className="w-full text-sm rounded-xl border-gray-300 focus:ring-emerald-500"
                                    value={filters.search}
                                    onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </form>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Ticket</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Info</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan="4" className="p-10 text-center text-gray-400">Loading...</td></tr>
                                    ) : issues.map(issue => (
                                        <tr
                                            key={issue.id}
                                            className={`hover:bg-gray-50 cursor-pointer transition ${selectedIssue?.id === issue.id ? "bg-emerald-50" : ""}`}
                                            onClick={() => handleSelectIssue(issue)}
                                        >
                                            <td className="px-4 py-4 text-sm font-medium text-gray-400">#{issue.id}</td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-800 text-sm">{issue.title}</span>
                                                    {getPriorityBadge(issue.priority)}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    By <span className="text-emerald-700 font-medium">{issue.reporter_username}</span> • {issue.report_type}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(issue.status)}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button className="text-emerald-600 text-xs font-bold hover:underline">View</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Detail/Update View */}
                <div className="lg:col-span-1">
                    {selectedIssue ? (
                        <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-24">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Issue Details</h2>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Reporter Info</p>
                                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{selectedIssue.reporter_username}</p>
                                    <p className="text-xs text-gray-500">ID: {selectedIssue.reporter}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Description</p>
                                    <p className="text-sm text-gray-600 mt-1 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        {selectedIssue.description}
                                    </p>
                                </div>
                                {selectedIssue.attachment && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attachment</p>
                                        <a
                                            href={selectedIssue.attachment}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 mt-1 hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg"
                                        >
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleUpdateIssue} className="border-t pt-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Update Status</label>
                                    <select
                                        className="w-full rounded-xl border-gray-300 focus:ring-emerald-500"
                                        value={updateForm.status}
                                        onChange={e => setUpdateForm(prev => ({ ...prev, status: e.target.value }))}
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Admin Response</label>
                                    <textarea
                                        rows={3}
                                        className="w-full rounded-xl border-gray-300 focus:ring-emerald-500"
                                        placeholder="Add a note or response to the user..."
                                        value={updateForm.admin_note}
                                        onChange={e => setUpdateForm(prev => ({ ...prev, admin_note: e.target.value }))}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full bg-emerald-700 text-white rounded-xl py-2.5 font-bold hover:bg-emerald-800 transition shadow-sm disabled:opacity-50"
                                >
                                    {updating ? "Updating..." : "Save Update"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
                            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                                <span className="text-gray-400 text-2xl font-bold">!</span>
                            </div>
                            <p className="text-gray-500 font-medium">Select an issue from the list to view details and take action.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
