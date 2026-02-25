import React, { useState, useEffect } from "react";
import api from "../../API/axios"; // Use the custom api instance
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";

export default function ReportIssue() {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState("client");
    const [reportedUsername, setReportedUsername] = useState("");
    const [formData, setFormData] = useState({
        title: "",
        report_type: "OTHER",
        priority: "LOW",
        description: "",
        reported_user: "",
        target_model: "",
        target_id: "",
    });
    const [attachment, setAttachment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const storedRole = localStorage.getItem("role");
        if (storedRole) setRole(storedRole);

        // Pre-fill from navigation state
        if (location.state) {
            setFormData(prev => ({
                ...prev,
                title: location.state.title || prev.title,
                report_type: location.state.report_type || prev.report_type,
                description: location.state.description || prev.description,
                reported_user: location.state.reported_user || prev.reported_user,
                target_model: location.state.target_model || prev.target_model,
                target_id: location.state.target_id || prev.target_id,
            }));
            if (location.state.reported_username) {
                setReportedUsername(location.state.reported_username);
            }
        }
    }, [location.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setAttachment(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");

        if (!formData.title || !formData.description) {
            setError("Title and Description are required.");
            setLoading(false);
            return;
        }

        if (formData.description.length < 10) {
            setError("Description must be at least 10 characters long.");
            setLoading(false);
            return;
        }

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key]) data.append(key, formData[key]);
        });
        if (attachment) {
            data.append("attachment", attachment);
        }

        try {
            const response = await api.post("/api/reports/create/", data);
            setMessage(`Issue submitted successfully. Ticket ID: #${response.data.id}`);
            setTimeout(() => navigate("/support/my-issues"), 2000);
        } catch (err) {
            console.error(err);
            const errorData = err.response?.data;
            let errorMessage = "Failed to submit issue. Please try again.";

            if (typeof errorData === 'object' && errorData !== null) {
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else {
                    errorMessage = Object.entries(errorData)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join(' | ');
                }
            } else if (err.message) {
                errorMessage = err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role={role} activeMenu="report-issue">
            <div className="max-w-3xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-emerald-900 tracking-tight">Report an Issue</h1>
                    <p className="text-slate-500 mt-2">Technical problem or billing question? We're here to help.</p>
                </div>

                {message && (
                    <div className="p-4 mb-6 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <span className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">✓</span>
                        <p className="font-medium">{message}</p>
                    </div>
                )}

                {error && (
                    <div className="p-4 mb-6 bg-red-50 text-red-800 rounded-2xl border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <span className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center text-red-700">!</span>
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100/50 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Issue Title</label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg font-medium placeholder:text-slate-400"
                                placeholder="e.g., Payment failed at checkout"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Issue Category</label>
                                <select
                                    name="report_type"
                                    className="w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer font-medium"
                                    value={formData.report_type}
                                    onChange={handleChange}
                                >
                                    <option value="PAYMENT">Payment & Billing</option>
                                    <option value="BID">Bidding Issues</option>
                                    <option value="PROJECT">Project Management</option>
                                    <option value="CHAT">Communication/Chat</option>
                                    <option value="ACCOUNT">Account Security</option>
                                    <option value="BUG">Technical Bug</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Reported User</label>
                                <div className="px-5 py-4 rounded-2xl border-slate-200 bg-slate-100/50 text-slate-600 font-medium">
                                    {reportedUsername ? `@${reportedUsername}` : "No specific user selected"}
                                    {formData.reported_user && <span className="text-xs ml-2 text-slate-400">(ID: {formData.reported_user})</span>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Priority Level</label>
                                <select
                                    name="priority"
                                    className="w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all appearance-none cursor-pointer font-medium"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="LOW">Low - General Question</option>
                                    <option value="MEDIUM">Medium - Normal issue</option>
                                    <option value="HIGH">High - Urgent problem</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Detailed Description</label>
                            <textarea
                                name="description"
                                required
                                rows={6}
                                className="w-full px-5 py-4 rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium placeholder:text-slate-400 resize-none"
                                placeholder="Please describe what happened, including any error messages you saw..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Supporting Documents</label>
                            <p className="text-xs text-slate-500 mb-4">Upload screenshots or PDFs that help explain the issue (Max 5MB)</p>
                            <div className="relative group">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 group-hover:border-emerald-500 group-hover:bg-emerald-50/30 transition-all flex flex-col items-center justify-center gap-2">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-emerald-700">
                                        {attachment ? attachment.name : "Click to browse or drag and drop"}
                                    </p>
                                    <p className="text-xs text-slate-400">PNG, JPG, PDF up to 5MB</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-emerald-700 text-white rounded-2xl py-5 font-bold text-lg hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : "Submit Support Request"}
                            </button>
                            <p className="text-center text-xs text-slate-400 mt-4 italic">Our support team usually responds within 24 hours.</p>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
