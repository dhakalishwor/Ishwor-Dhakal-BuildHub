import React, { useMemo, useState, useEffect } from "react";
import _api from "../../API/axios";
import { confirmToast } from "../../components/ConfirmToast";
import { toast } from "react-hot-toast";

const initialClientForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  is_active: true,
};

function isValidEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AdminClientManagement() {
  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientErrors, setClientErrors] = useState({});
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = () => {
    setIsLoadingClients(true);
    _api.get("/auth/admin/clients/")
      .then(res => setClients(res.data))
      .catch(err => console.error("Failed to fetch clients", err))
      .finally(() => setIsLoadingClients(false));
  };

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.username.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const validateClient = (payload) => {
    const next = {};
    if (!payload.username.trim()) next.username = "Username is required.";
    if (!payload.email.trim() || !isValidEmail(payload.email)) next.email = "Valid email is required.";
    
    if (!editingClientId && !payload.password) {
      next.password = "Password is required.";
    } else if (payload.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(payload.password)) {
        next.password = "Password must be at least 8 characters long and include an uppercase, lowercase, number, and special character.";
      }
    }
    
    return next;
  };

  const resetClientForm = () => {
    setClientForm(initialClientForm);
    setEditingClientId(null);
    setClientErrors({});
    setShowForm(false);
  };

  const onClientEdit = (client) => {
    setClientForm({
      username: client.username,
      email: client.email,
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      password: "", 
      is_active: client.is_active,
    });
    setEditingClientId(client.id);
    setClientErrors({});
    setShowForm(true);
  };

  const onClientSubmit = (e) => {
    e.preventDefault();
    const v = validateClient(clientForm);
    setClientErrors(v);
    if (Object.keys(v).length > 0) return;

    if (editingClientId) {
      const payload = { ...clientForm };
      if (!payload.password) delete payload.password;

      _api.patch(`/auth/admin/clients/${editingClientId}/`, payload)
        .then(res => {
          setClients(prev => prev.map(c => c.id === editingClientId ? res.data : c));
          toast.success("Client account updated");
          resetClientForm();
        })
        .catch(err => {
          console.error("Failed to update client", err);
          if (err.response?.data) setClientErrors(err.response.data);
          toast.error("Update failed");
        });
    } else {
      _api.post("/auth/admin/clients/", clientForm)
        .then(res => {
          setClients(prev => [res.data, ...prev]);
          toast.success("New client account created");
          resetClientForm();
        })
        .catch(err => {
          console.error("Failed to add client", err);
          if (err.response?.data) setClientErrors(err.response.data);
          toast.error("Creation failed");
        });
    }
  };

  const onClientDelete = async (id) => {
    if (!await confirmToast("Permanently delete this client account?")) return;
    _api.delete(`/auth/admin/clients/${id}/`)
      .then(() => {
        setClients(prev => prev.filter(c => c.id !== id));
        toast.success("Client removed from system");
      })
      .catch(err => toast.error("Delete failed"));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Management</h1>
                <p className="text-slate-500 text-sm">Oversee registered client accounts and their portal status.</p>
            </div>
            <button 
                onClick={() => setShowForm(true)}
                className="group bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 active:scale-95"
            >
                 <div className="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </div>
                <span>Register New Client</span>
            </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white/50 backdrop-blur-xl p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="relative flex-1 group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-50 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    placeholder="Search by username, email, or full name..."
                    className="w-full bg-white border-none rounded-2xl px-12 py-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-inner"
                />
            </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100">
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Profile</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Email Address</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registration</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Status</th>
                            <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Settings</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoadingClients ? (
                             <tr><td colSpan={5} className="p-32 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Client Data</span>
                             </td></tr>
                        ) : filteredClients.map(c => (
                            <tr key={c.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                                <td className="p-8">
                                    <div className="flex items-center gap-5">
                                        <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center font-black text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-500">
                                            {c.profilePicture ? (
                                                <img src={c.profilePicture} alt={c.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{c.username[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">@{c.username}</p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1">{c.first_name} {c.last_name}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <p className="text-sm font-medium text-slate-600 font-mono text-[13px]">{c.email}</p>
                                </td>
                                <td className="p-8">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Joined On</p>
                                        <p className="text-xs font-bold text-slate-700">{new Date(c.dateJoined || c.date_joined).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                                    </div>
                                </td>
                                <td className="p-8">
                                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] ${
                                        c.is_active ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        {c.is_active ? 'Active Portal' : 'Restricted'}
                                    </span>
                                </td>
                                <td className="p-8 text-right">
                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                         <button onClick={() => onClientEdit(c)} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-lg transition-all active:scale-90">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => onClientDelete(c.id)} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-600 hover:border-red-100 hover:shadow-lg transition-all active:scale-90">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {!isLoadingClients && filteredClients.length === 0 && (
                <div className="py-20 text-center animate-in fade-in duration-700">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No Clients Matched Analytics Query</p>
                </div>
            )}
        </div>

        {/* Sliding Side Panel for Form */}
        {showForm && (
            <div className="fixed inset-0 z-50 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-500" onClick={resetClientForm}></div>
                <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[3rem]">
                    <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{editingClientId ? 'Update Client' : 'Register Client'}</h2>
                            <p className="text-slate-400 text-sm mt-1">Configure user authentication and portal profile.</p>
                        </div>
                        <button onClick={resetClientForm} className="h-12 w-12 rounded-[1.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:scale-110 transition-all">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        <form id="client-form" onSubmit={onClientSubmit} className="space-y-8">
                             <section className="space-y-6">
                                <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">Auth Identification</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Username" required />
                                        <FormInput 
                                            value={clientForm.username}
                                            onChange={e => setClientForm({...clientForm, username: e.target.value})}
                                            placeholder="johndoe"
                                            error={clientErrors.username}
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Email" required />
                                        <FormInput 
                                            value={clientForm.email}
                                            onChange={e => setClientForm({...clientForm, email: e.target.value})}
                                            placeholder="john@example.com"
                                            error={clientErrors.email}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <FormLabel label={editingClientId ? "New Password (Optional)" : "Password"} required={!editingClientId} />
                                        <FormInput 
                                            type="password"
                                            value={clientForm.password}
                                            onChange={e => setClientForm({...clientForm, password: e.target.value})}
                                            placeholder="••••••••"
                                            error={clientErrors.password}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-6 border-t border-slate-50">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Personal Details</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="First Name" />
                                        <FormInput 
                                            value={clientForm.first_name}
                                            onChange={e => setClientForm({...clientForm, first_name: e.target.value})}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <FormLabel label="Last Name" />
                                        <FormInput 
                                            value={clientForm.last_name}
                                            onChange={e => setClientForm({...clientForm, last_name: e.target.value})}
                                            placeholder="Doe"
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
                                        checked={clientForm.is_active}
                                        onChange={e => setClientForm({...clientForm, is_active: e.target.checked})}
                                    />
                                    <div className="w-14 h-8 bg-slate-200 rounded-full peer-checked:bg-blue-600 transition-all"></div>
                                    <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-6 border shadow-sm"></div>
                                </div>
                                <span className="text-sm font-black text-slate-700">Account Access Enabled</span>
                            </label>
                        </div>
                        <div className="flex gap-4">
                            <button type="button" onClick={resetClientForm} className="flex-1 px-8 py-5 text-sm font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest bg-white border-2 border-slate-100 rounded-2xl">Dismiss</button>
                            <button form="client-form" type="submit" className="flex-[2] bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-slate-900/10 uppercase tracking-widest">
                                {editingClientId ? 'Commit Update' : 'Initialize Account'}
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
                    error ? 'focus:ring-red-500/10 border-red-200 bg-red-50/10 focus:border-red-500' : 'focus:ring-blue-500/10 focus:border-blue-500'
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
