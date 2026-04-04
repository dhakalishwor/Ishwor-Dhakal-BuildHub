import React, { useEffect, useState } from "react";
import api from "../../API/axios";
import { toast } from "react-hot-toast";

export default function AdminLicenseManagement() {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reviewingId, setReviewingId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    useEffect(() => {
        fetchLicenses();
    }, []);

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const res = await api.get("/auth/admin/licenses/");
            setLicenses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id, status) => {
        if (status === "REJECTED" && !rejectionReason.trim()) {
            toast.error("Please provide a reason for rejection");
            return;
        }

        try {
            await api.patch(`/auth/admin/licenses/${id}/review/`, {
                status,
                rejection_reason: status === "REJECTED" ? rejectionReason : ""
            });
            toast.success(`License ${status.toLowerCase()}ed successfully`);
            fetchLicenses();
            setReviewingId(null);
            setRejectionReason("");
        } catch (err) {
            toast.error("Failed to review license");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
            <p className="mt-4 text-slate-500 font-medium">Loading document queue...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">License Verification</h1>
                <p className="text-slate-500 text-sm">Verify contractor documents to maintain platform safety and trust.</p>
            </div>

            <div className="grid gap-8">
                {licenses.map(license => (
                    <div key={license.id} className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60 transition-all duration-500 group">
                        <div className="p-8 flex flex-col lg:flex-row gap-8">
                            {/* Contractor Info */}
                            <div className="lg:w-1/4">
                                <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-4 mb-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-black shadow-inner">
                                        {license.contractorUsername?.[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-900 leading-tight">{license.contractorUsername}</p>
                                        <p className="text-xs text-slate-400 font-medium break-all">{license.contractorEmail}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OCR Match Score</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${license.match_score >= 80 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${license.match_score || 0}%` }}
                                                ></div>
                                            </div>
                                            <p className={`text-sm font-black ${license.match_score >= 80 ? 'text-emerald-600' : 'text-orange-500'}`}>
                                                {license.match_score ? `${license.match_score}%` : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Extracted Name</p>
                                        <p className="text-sm font-bold text-slate-700 truncate" title={license.extracted_name}>{license.extracted_name || 'Detection Failed'}</p>
                                    </div>
                                    <div className="mt-4 pt-2">
                                        <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                                            license.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                            license.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                        }`}>
                                            {license.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <DocumentCard label="Business/Worker License" src={license.license_document} />
                                <DocumentCard label="Citizenship ID" src={license.citizenship_document} />
                            </div>

                            {/* Actions */}
                            <div className="lg:w-72 flex flex-col justify-end self-stretch bg-slate-50/30 p-6 rounded-[2rem] border border-slate-100">
                                {license.status === 'UNDER_REVIEW' && reviewingId !== license.id && (
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => handleReview(license.id, 'VERIFIED')}
                                            className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm hover:bg-emerald-800 transition-all active:scale-[0.98] shadow-lg shadow-emerald-700/20"
                                        >
                                            Verify Official
                                        </button>
                                        <button 
                                            onClick={() => setReviewingId(license.id)}
                                            className="w-full bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-all active:scale-[0.98]"
                                        >
                                            Decline Entry
                                        </button>
                                    </div>
                                )}

                                {reviewingId === license.id && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                                        <div>
                                            <label className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 block ml-1">Rejection Feedback</label>
                                            <textarea 
                                                placeholder="Explain why the documents were rejected..."
                                                className="w-full rounded-[1.5rem] border-slate-200 text-sm focus:ring-red-500 focus:border-red-500 p-4"
                                                rows={4}
                                                value={rejectionReason}
                                                onChange={e => setRejectionReason(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button 
                                                onClick={() => handleReview(license.id, 'REJECTED')}
                                                className="w-full bg-red-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-red-700 transition"
                                            >
                                                Submit Rejection
                                            </button>
                                            <button 
                                                onClick={() => { setReviewingId(null); setRejectionReason(""); }}
                                                className="w-full text-slate-400 py-2 font-bold text-xs hover:text-slate-600 transition"
                                            >
                                                Cancel Review
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {license.status !== 'UNDER_REVIEW' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 ${license.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                                            {license.status === 'VERIFIED' ? '✓' : '✗'}
                                        </div>
                                        <p className="text-sm font-bold text-slate-700 capitalize">Entry {license.status.toLowerCase()}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">Processed by System/Admin</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {licenses.length === 0 && (
                    <div className="text-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] animate-in fade-in duration-1000">
                        <div className="h-20 w-20 bg-slate-100 rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-6 grayscale opacity-50">
                            📁
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">Queue is empty</h3>
                        <p className="text-slate-400 text-sm mt-1">All contractor licenses have been reviewed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DocumentCard({ label, src }) {
    return (
        <div className="group relative bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden">
            <div className="absolute top-4 left-4 z-10">
                <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-slate-700 uppercase tracking-widest shadow-sm">
                    {label}
                </span>
            </div>
            <div className="aspect-[4/3] w-full overflow-hidden">
                <img 
                    src={src} 
                    alt={label} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
            </div>
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <a 
                    href={src} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-black text-xs hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95 shadow-2xl"
                >
                    Examine Original
                </a>
            </div>
        </div>
    );
}
