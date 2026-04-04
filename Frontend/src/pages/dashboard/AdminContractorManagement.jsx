import React, { useMemo, useState, useEffect } from "react";
import _api from "../../API/axios";
import { confirmToast } from "../../components/ConfirmToast";
import { toast } from "react-hot-toast";

const initialForm = {
  fullName: "",
  contractorType: "Individual",
  workType: "",
  experienceYears: "",
  phone: "",
  email: "",
  availabilityStatus: "Available",
  rateType: "Project",
  isActive: true,
};

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) return false;
  return /^[+]?[\d\s-]{7,20}$/.test(phone.trim());
}

export default function AdminContractorManagement() {
  const [contractors, setContractors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContractors();
  }, []);

  const fetchContractors = () => {
    setLoading(true);
    _api.get("/api/contractors/")
      .then(res => setContractors(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contractors;
    return contractors.filter((c) => {
      const fieldMatch = (field) => (field || "").toLowerCase().includes(q);
      return (
        fieldMatch(c.fullName) ||
        fieldMatch(c.workType) ||
        fieldMatch(c.phone) ||
        fieldMatch(c.email) ||
        fieldMatch(c.contractorType) ||
        fieldMatch(c.availabilityStatus) ||
        fieldMatch(c.rateType)
      );
    });
  }, [contractors, search]);

  function validate(payload) {
    const next = {};
    if (!payload.fullName.trim()) next.fullName = "Full name is required.";
    if (!payload.workType.trim()) next.workType = "Type of work is required.";
    if (payload.experienceYears === "" || isNaN(payload.experienceYears) || Number(payload.experienceYears) < 0)
      next.experienceYears = "Valid experience is required.";
    if (!payload.phone.trim() || !isValidPhone(payload.phone)) next.phone = "Valid phone is required.";
    if (payload.email && !isValidEmail(payload.email)) next.email = "Enter a valid email.";
    return next;
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
    setShowForm(false);
  }

  function onEdit(contractor) {
    setForm({
      fullName: contractor.fullName || "",
      contractorType: contractor.contractorType || "Individual",
      workType: contractor.workType || "",
      experienceYears: contractor.experienceYears || "",
      phone: contractor.phone || "",
      email: contractor.email || "",
      availabilityStatus: contractor.availabilityStatus || "Available",
      rateType: contractor.rateType || "Project",
      isActive: contractor.isActive !== undefined ? contractor.isActive : true,
    });
    setEditingId(contractor.id);
    setErrors({});
    setShowForm(true);
  }

  function onSubmit(e) {
    e.preventDefault();
    const payload = { ...form, experienceYears: Number(form.experienceYears) };
    const v = validate(payload);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    const request = editingId 
      ? _api.put(`/api/contractors/${editingId}/`, payload)
      : _api.post("/api/contractors/", payload);

    request.then(res => {
        toast.success(editingId ? "Contractor profile updated" : "New contractor profile created");
        if (editingId) {
          setContractors(prev => prev.map(c => (c.id === editingId ? res.data : c)));
        } else {
          setContractors(prev => [res.data, ...prev]);
        }
        resetForm();
      })
      .catch(err => {
        toast.error("Process failed. Please check inputs.");
        if (err.response?.data) setErrors(err.response.data);
      });
  }

  async function onDelete(id) {
    if (!await confirmToast("Permanently remove this contractor profile?")) return;
    _api.delete(`/api/contractors/${id}/`)
      .then(() => {
        setContractors(prev => prev.filter(c => c.id !== id));
        toast.success("Profile removed from system");
      })
      .catch(() => toast.error("Unable to delete at this time"));
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Contractor Management</h1>
                <p className="text-slate-500 text-sm">Control professional portfolios and availability status.</p>
            </div>
            <button 
                onClick={() => setShowForm(true)}
                className="group bg-emerald-700 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-700/20 flex items-center justify-center gap-3 active:scale-95"
            >
                <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <span>Create New Profile</span>
            </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-50 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Filter by name, skill, phone number..."
                    className="w-full bg-white border-none rounded-2xl px-12 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 text-slate-700 shadow-inner"
                />
            </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contractor</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expertise</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Settings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={5} className="p-32 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto mb-4"></div>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Data</span>
                             </td></tr>
                        ) : filtered.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                <td className="p-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center font-black text-slate-300 group-hover:text-emerald-600 group-hover:scale-110 transition-all duration-500">
                                            {c.profilePicture ? (
                                                <img src={c.profilePicture} alt={c.fullName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{c.fullName[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{c.fullName}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded inline-block mt-1">{c.contractorType}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <p className="text-sm font-bold text-slate-700">{c.workType}</p>
                                    <p className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block mt-1 uppercase tracking-widest">{c.experienceYears} Years Experience</p>
                                </td>
                                <td className="p-8">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            {c.phone}
                                        </p>
                                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[150px]">{c.email || 'No Email Verified'}</p>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                                        c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {c.isActive ? 'Active' : 'Archived'}
                                    </span>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                        <button onClick={() => onEdit(c)} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all active:scale-90">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => onDelete(c.id)} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-100 hover:shadow-lg transition-all active:scale-90">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!loading && filtered.length === 0 && (
                <div className="py-20 text-center animate-in fade-in duration-700">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Results Found</p>
                </div>
            )}
        </div>

        {/* Sliding Side Panel for Form */}
        {showForm && (
            <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={resetForm}></div>
                <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[3rem]">
                    <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Modify Profile' : 'Assign New Profile'}</h2>
                            <p className="text-slate-400 text-sm mt-1">Configure professional credentials and portal access.</p>
                        </div>
                        <button onClick={resetForm} className="h-12 w-12 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:scale-110 transition-all">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <form id="contractor-form" onSubmit={onSubmit} className="space-y-8">
                            <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Core Identification</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <FormLabel label="Full Legal Name" required />
                                        <FormInput 
                                            value={form.fullName}
                                            onChange={e => setForm({...form, fullName: e.target.value})}
                                            placeholder="e.g. Suman Thapa"
                                            error={errors.fullName}
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Entity Classification" />
                                        <select 
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all appearance-none"
                                            value={form.contractorType}
                                            onChange={e => setForm({...form, contractorType: e.target.value})}
                                        >
                                            <option>Individual</option>
                                            <option>Company</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Years Active" required />
                                        <FormInput 
                                            type="number"
                                            value={form.experienceYears}
                                            onChange={e => setForm({...form, experienceYears: e.target.value})}
                                            placeholder="5"
                                            error={errors.experienceYears}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="text-[10px] font-black text-sky-600 uppercase tracking-[0.3em] mb-4">Skillset & Rates</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <FormLabel label="Specialization" required />
                                        <FormInput 
                                            value={form.workType}
                                            onChange={e => setForm({...form, workType: e.target.value})}
                                            placeholder="Civil Engineering / Interior Design"
                                            error={errors.workType}
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Billing Structure" />
                                        <select 
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 focus:bg-white transition-all appearance-none"
                                            value={form.rateType}
                                            onChange={e => setForm({...form, rateType: e.target.value})}
                                        >
                                            <option>Hourly</option>
                                            <option>Daily</option>
                                            <option>Project</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] mb-4">Communications</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <FormLabel label="Secure Phone Number" required />
                                        <FormInput 
                                            value={form.phone}
                                            onChange={e => setForm({...form, phone: e.target.value})}
                                            placeholder="+977 1234567890"
                                            error={errors.phone}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormLabel label="Email Address (Optional)" />
                                        <FormInput 
                                            value={form.email}
                                            onChange={e => setForm({...form, email: e.target.value})}
                                            placeholder="contractor@buildhub.com"
                                            error={errors.email}
                                        />
                                    </div>
                                </div>
                            </section>
                        </form>
                    </div>

                    <div className="p-10 bg-slate-50 border-t border-slate-100 rounded-bl-[3rem] space-y-6">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Visibility Settings</p>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={form.isActive}
                                        onChange={e => setForm({...form, isActive: e.target.checked})}
                                    />
                                    <div className="w-14 h-8 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-all"></div>
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-6 border shadow-sm"></div>
                                </div>
                                <span className="text-sm font-black text-slate-700">Account Active</span>
                            </label>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={resetForm} className="flex-1 px-8 py-5 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-white border-2 border-slate-100 rounded-2xl">Dismiss</button>
                            <button form="contractor-form" type="submit" className="flex-[2] bg-emerald-900 text-white px-8 py-5 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-emerald-900/10 uppercase tracking-widest">
                                {editingId ? 'Update Identity' : 'Confirm Registration'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}

function FormLabel({ label, required }) {
    return (
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
    );
}

function FormInput({ error, ...props }) {
    return (
        <div className="relative group">
            <input 
                {...props}
                className={`w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-sm font-bold focus:ring-4 transition-all focus:bg-white ${
                    error ? 'focus:ring-red-500/10 border-red-200 bg-red-50/10 focus:border-red-500' : 'focus:ring-emerald-500/10 focus:border-emerald-500'
                }`}
            />
            {error && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center group-hover:scale-110 transition-transform">
                    <span className="text-red-500 text-xs">⚠️</span>
                </div>
            )}
            {error && <p className="text-[10px] font-black text-red-500 mt-2 ml-3 uppercase tracking-tighter">{error}</p>}
        </div>
    );
}
