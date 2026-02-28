import React, { useMemo, useState, useEffect } from "react";
import _api from "../../API/axios";
import AdminIssueManagement from "./AdminIssueManagement";
import AdminProjectMonitoring from "./AdminProjectMonitoring";


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

const initialClientForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  is_active: true,
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function isValidEmail(email) {
  if (!email) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  if (!phone) return false;
  return /^[+]?[\d\s-]{7,20}$/.test(phone.trim());
}

export default function App() {
  const [activeMenu, setActiveMenu] = useState("add-contractor");
  const [contractors, setContractors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  const [clients, setClients] = useState([]);
  const [clientForm, setClientForm] = useState(initialClientForm);
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientErrors, setClientErrors] = useState({});
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    _api.get("/api/contractors/")
      .then(res => setContractors(res.data))
      .catch(err => console.error("Failed to fetch contractors", err));

    // eslint-disable-next-line react-hooks/immutability
    fetchClients();
  }, []);

  const fetchClients = () => {
    setIsLoadingClients(true);
    _api.get("/auth/admin/clients/")
      .then(res => setClients(res.data))
      .catch(err => console.error("Failed to fetch clients", err))
      .finally(() => setIsLoadingClients(false));
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contractors;
    return contractors.filter((c) => {
      return (
        c.fullName.toLowerCase().includes(q) ||
        c.workType.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        c.contractorType.toLowerCase().includes(q) ||
        c.availabilityStatus.toLowerCase().includes(q) ||
        c.rateType.toLowerCase().includes(q)
      );
    });
  }, [contractors, search]);

  function validate(payload) {
    const next = {};
    if (!payload.fullName.trim()) next.fullName = "Full name is required.";
    if (!payload.workType.trim()) next.workType = "Type of work is required.";

    if (payload.experienceYears.toString().trim() === "")
      next.experienceYears = "Experience is required.";
    if (
      payload.experienceYears !== "" &&
      (Number.isNaN(Number(payload.experienceYears)) || Number(payload.experienceYears) < 0)
    ) {
      next.experienceYears = "Experience must be a valid number.";
    }

    if (!payload.phone.trim() || !isValidPhone(payload.phone)) next.phone = "Valid phone is required.";
    if (payload.email && !isValidEmail(payload.email)) next.email = "Enter a valid email.";
    return next;
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setErrors({});
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
  }

  function onSubmit(e) {
    e.preventDefault();

    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      workType: form.workType.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      experienceYears: Number(form.experienceYears),
    };

    const v = validate(payload);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    if (editingId) {
      // Update contractor in backend
      _api.put(`/api/contractors/${editingId}/`, payload)
        .then(res => {
          setContractors(prev => prev.map(c => (c.id === editingId ? res.data : c)));
          resetForm();
        })
        .catch(err => {
          // Optionally handle error
          console.error("Failed to update contractor", err);
        });
      return;
    }

    // Add new contractor to backend
    _api.post("/api/contractors/", payload)
      .then(res => {
        setContractors(prev => [res.data, ...prev]);
        resetForm();
      })
      .catch(err => {
        // Optionally handle error
        console.error("Failed to add contractor", err);
      });
  }

  function onDelete(id) {
    const ok = window.confirm("Delete this contractor? This cannot be undone.");
    if (!ok) return;
    // Delete contractor from backend
    _api.delete(`/api/contractors/${id}/`)
      .then(() => {
        setContractors(prev => prev.filter(c => c.id !== id));
        if (editingId === id) resetForm();
      })
      .catch(err => {
        // Optionally handle error
        console.error("Failed to delete contractor", err);
      });
  }

  // Client Management Functions
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
    if (!editingClientId && (!payload.password || payload.password.length < 6)) {
      next.password = "Password must be at least 6 characters.";
    }
    return next;
  };

  const resetClientForm = () => {
    setClientForm(initialClientForm);
    setEditingClientId(null);
    setClientErrors({});
  };

  const onClientEdit = (client) => {
    setClientForm({
      username: client.username,
      email: client.email,
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      password: "", // Don't pre-fill password
      is_active: client.is_active,
    });
    setEditingClientId(client.id);
    setClientErrors({});
    setActiveMenu("clients");
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
          resetClientForm();
        })
        .catch(err => {
          console.error("Failed to update client", err);
          if (err.response?.data) setClientErrors(err.response.data);
        });
    } else {
      _api.post("/auth/admin/clients/", clientForm)
        .then(res => {
          setClients(prev => [res.data, ...prev]);
          resetClientForm();
        })
        .catch(err => {
          console.error("Failed to add client", err);
          if (err.response?.data) setClientErrors(err.response.data);
        });
    }
  };

  const onClientDelete = (id) => {
    if (!window.confirm("Delete this client? This cannot be undone.")) return;
    _api.delete(`/auth/admin/clients/${id}/`)
      .then(() => {
        setClients(prev => prev.filter(c => c.id !== id));
        if (editingClientId === id) resetClientForm();
      })
      .catch(err => console.error("Failed to delete client", err));
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm text-emerald-800 font-semibold">BuildHub Admin</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-r bg-emerald-900 text-white">
          <div className="p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-200">Menu</p>

            {/* ONLY ONE ITEM: Add Contractor */}
            <button
              onClick={() => setActiveMenu("add-contractor")}
              className={classNames(
                "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                activeMenu === "add-contractor"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-emerald-900 hover:bg-emerald-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Contractor Management</span>
              </div>
              <p className="mt-1 text-xs text-emerald-200">
                Manage contractor profiles
              </p>
            </button>

            <button
              onClick={() => setActiveMenu("clients")}
              className={classNames(
                "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                activeMenu === "clients"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-emerald-900 hover:bg-emerald-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Client Management</span>
              </div>
              <p className="mt-1 text-xs text-emerald-200">
                Manage client accounts
              </p>
            </button>

            <button
              onClick={() => setActiveMenu("monitoring")}
              className={classNames(
                "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                activeMenu === "monitoring"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-emerald-900 hover:bg-emerald-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Project Monitoring</span>
              </div>
              <p className="mt-1 text-xs text-emerald-200">
                Oversight of all active work
              </p>
            </button>

            <button
              onClick={() => setActiveMenu("issues")}
              className={classNames(
                "mt-3 w-full rounded-xl px-4 py-3 text-left transition",
                activeMenu === "issues"
                  ? "bg-emerald-700 text-white shadow"
                  : "bg-emerald-900 hover:bg-emerald-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">Issue Management</span>
              </div>
              <p className="mt-1 text-xs text-emerald-200">
                Handle reports and support tickets
              </p>
            </button>
          </div>
        </aside>

        {/* Main body */}
        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {/* Center the form in the main body */}
            {activeMenu === "add-contractor" && (
              <div className="mx-auto max-w-3xl">
                {/* Heading */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-emerald-900">
                    {editingId ? "Update Contractor" : "Add Contractor"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Fill details and submit to add contractor.
                  </p>
                </div>

                {/* Form Card */}
                <section className="mt-6 rounded-2xl border bg-white shadow-sm">
                  <div className="border-b px-5 py-4 flex items-center justify-between">
                    <p className="font-semibold text-emerald-900">Contractor Form</p>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <form onSubmit={onSubmit} className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-slate-700">
                          Full Name <span className="text-emerald-700">*</span>
                        </label>
                        <input
                          name="fullName"
                          value={form.fullName}
                          onChange={onChange}
                          className={classNames(
                            "mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2",
                            errors.fullName
                              ? "border-red-300 focus:ring-red-200"
                              : "focus:ring-emerald-200 focus:border-emerald-600"
                          )}
                          placeholder="e.g., Suman Thapa"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                        )}
                      </div>

                      {/* Contractor Type */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">Contractor Type</label>
                        <select
                          name="contractorType"
                          value={form.contractorType}
                          onChange={onChange}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600"
                        >
                          <option>Individual</option>
                          <option>Company</option>
                        </select>
                      </div>

                      {/* Work Type */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Type of Work <span className="text-emerald-700">*</span>
                        </label>
                        <input
                          name="workType"
                          value={form.workType}
                          onChange={onChange}
                          className={classNames(
                            "mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2",
                            errors.workType
                              ? "border-red-300 focus:ring-red-200"
                              : "focus:ring-emerald-200 focus:border-emerald-600"
                          )}
                          placeholder="e.g., Civil / Electrical / Plumbing / Interior"
                        />
                        {errors.workType && (
                          <p className="mt-1 text-xs text-red-600">{errors.workType}</p>
                        )}
                      </div>

                      {/* Experience */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Experience (Years) <span className="text-emerald-700">*</span>
                        </label>
                        <input
                          name="experienceYears"
                          value={form.experienceYears}
                          onChange={onChange}
                          className={classNames(
                            "mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2",
                            errors.experienceYears
                              ? "border-red-300 focus:ring-red-200"
                              : "focus:ring-emerald-200 focus:border-emerald-600"
                          )}
                          placeholder="e.g., 5"
                        />
                        {errors.experienceYears && (
                          <p className="mt-1 text-xs text-red-600">{errors.experienceYears}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Phone <span className="text-emerald-700">*</span>
                        </label>
                        <input
                          name="phone"
                          value={form.phone}
                          onChange={onChange}
                          className={classNames(
                            "mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2",
                            errors.phone
                              ? "border-red-300 focus:ring-red-200"
                              : "focus:ring-emerald-200 focus:border-emerald-600"
                          )}
                          placeholder="e.g., +977 98XXXXXXXX"
                        />
                        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">
                          Email <span className="text-xs text-slate-400">(optional)</span>
                        </label>
                        <input
                          name="email"
                          value={form.email}
                          onChange={onChange}
                          className={classNames(
                            "mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2",
                            errors.email
                              ? "border-red-300 focus:ring-red-200"
                              : "focus:ring-emerald-200 focus:border-emerald-600"
                          )}
                          placeholder="e.g., contractor@email.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                      </div>

                      {/* Availability Status */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">Availability Status</label>
                        <select
                          name="availabilityStatus"
                          value={form.availabilityStatus}
                          onChange={onChange}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600"
                        >
                          <option>Available</option>
                          <option>Busy</option>
                          <option>Unavailable</option>
                        </select>
                      </div>

                      {/* Rate Type */}
                      <div>
                        <label className="text-sm font-medium text-slate-700">Rate Type</label>
                        <select
                          name="rateType"
                          value={form.rateType}
                          onChange={onChange}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600"
                        >
                          <option>Hourly</option>
                          <option>Daily</option>
                          <option>Project</option>
                        </select>
                      </div>

                      {/* isActive Toggle (New) */}
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Account Active</span>
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border px-5 py-2 text-sm hover:bg-slate-50"
                      >
                        Reset
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        {editingId ? "Update Contractor" : "Add Contractor"}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Contractor List (under form, still centered) */}
                <section className="mt-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="border-b px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-emerald-900">Contractors</h2>
                      <p className="text-xs text-slate-500">Total: {contractors.length}</p>
                    </div>
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full sm:w-64 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-emerald-50">
                        <tr className="text-left text-emerald-900">
                          <th className="px-5 py-3 font-semibold">Contractor Details</th>
                          <th className="px-5 py-3 font-semibold">Service Info</th>
                          <th className="px-5 py-3 font-semibold">Contact</th>
                          <th className="px-5 py-3 font-semibold">Joined / Status</th>
                          <th className="px-5 py-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filtered.length === 0 ? (
                          <tr>
                            <td className="px-5 py-6 text-slate-500" colSpan={9}>
                              No contractors found.
                            </td>
                          </tr>
                        ) : (
                          filtered.map((c) => (
                            <tr key={c.id} className="border-t hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3">
                                <div className="font-semibold text-emerald-900">{c.fullName}</div>
                                <div className="text-xs text-slate-500">{c.contractorType}</div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="text-slate-700">{c.workType}</div>
                                <div className="text-xs text-emerald-700 font-medium">{c.experienceYears} yrs • {c.rateType}</div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="text-slate-700">{c.phone}</div>
                                <div className="text-xs text-slate-500">{c.email || "-"}</div>
                              </td>
                              <td className="px-5 py-3">
                                <div className="text-xs text-slate-500 mb-1">
                                  {c.dateJoined ? new Date(c.dateJoined).toLocaleDateString() : "-"}
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                  {c.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => onEdit(c)}
                                    className="rounded-lg border px-3 py-1 text-xs hover:bg-emerald-50 hover:text-emerald-700 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => onDelete(c.id)}
                                    className="rounded-lg bg-emerald-900 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-950 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeMenu === "clients" && (
              <div className="mx-auto max-w-4xl">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-emerald-900">
                    {editingClientId ? "Update Client" : "Client Management"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage client user accounts.
                  </p>
                </div>

                <section className="mt-6 rounded-2xl border bg-white shadow-sm">
                  <div className="border-b px-5 py-4 flex items-center justify-between">
                    <p className="font-semibold text-emerald-900">Client Form</p>
                    {editingClientId && (
                      <button onClick={resetClientForm} className="text-sm text-slate-500 hover:text-emerald-700">Cancel Edit</button>
                    )}
                  </div>
                  <form onSubmit={onClientSubmit} className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Username *</label>
                        <input
                          value={clientForm.username}
                          onChange={e => setClientForm({ ...clientForm, username: e.target.value })}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                          placeholder="johndoe"
                        />
                        {clientErrors.username && <p className="text-xs text-red-500 mt-1">{clientErrors.username}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Email *</label>
                        <input
                          value={clientForm.email}
                          onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                          placeholder="john@example.com"
                        />
                        {clientErrors.email && <p className="text-xs text-red-500 mt-1">{clientErrors.email}</p>}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">First Name</label>
                        <input
                          value={clientForm.first_name}
                          onChange={e => setClientForm({ ...clientForm, first_name: e.target.value })}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Last Name</label>
                        <input
                          value={clientForm.last_name}
                          onChange={e => setClientForm({ ...clientForm, last_name: e.target.value })}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700">Password {editingClientId && "(Leave blank to keep current)"}</label>
                        <input
                          type="password"
                          value={clientForm.password}
                          onChange={e => setClientForm({ ...clientForm, password: e.target.value })}
                          className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-200 focus:border-emerald-600 outline-none"
                          placeholder="******"
                        />
                        {clientErrors.password && <p className="text-xs text-red-500 mt-1">{clientErrors.password}</p>}
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={clientForm.is_active}
                            onChange={e => setClientForm({ ...clientForm, is_active: e.target.checked })}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                          />
                          <span className="text-sm font-medium text-slate-700">Account Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button type="button" onClick={resetClientForm} className="px-5 py-2 text-sm border rounded-xl hover:bg-slate-50">Reset</button>
                      <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-emerald-700 rounded-xl hover:bg-emerald-800">
                        {editingClientId ? "Update Client" : "Add Client"}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="mt-8 rounded-2xl border bg-white shadow-sm overflow-hidden">
                  <div className="border-b px-5 py-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-semibold text-emerald-900">Registered Clients</h2>
                      <p className="text-xs text-slate-500">Total: {clients.length}</p>
                    </div>
                    <input
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                      placeholder="Search clients..."
                      className="w-full sm:w-64 rounded-xl border px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-600 outline-none"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-emerald-50 text-emerald-900">
                        <tr className="text-left">
                          <th className="px-5 py-3 font-semibold">Username</th>
                          <th className="px-5 py-3 font-semibold">Email</th>
                          <th className="px-5 py-3 font-semibold">Name</th>
                          <th className="px-5 py-3 font-semibold">Joined</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {isLoadingClients ? (
                          <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-500">Loading clients...</td></tr>
                        ) : filteredClients.length === 0 ? (
                          <tr><td colSpan={6} className="px-5 py-6 text-center text-slate-500">No clients found.</td></tr>
                        ) : (
                          filteredClients.map(c => (
                            <tr key={c.id} className="border-t">
                              <td className="px-5 py-3 font-medium">{c.username}</td>
                              <td className="px-5 py-3 text-slate-600">{c.email}</td>
                              <td className="px-5 py-3">{c.first_name} {c.last_name}</td>
                              <td className="px-5 py-3 text-slate-500">{new Date(c.date_joined).toLocaleDateString()}</td>
                              <td className="px-5 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                  {c.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => onClientEdit(c)} className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-50">Edit</button>
                                  <button onClick={() => onClientDelete(c.id)} className="px-3 py-1 text-xs font-semibold text-white bg-emerald-900 rounded-lg hover:bg-emerald-950">Delete</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

            {activeMenu === "monitoring" && (
              <AdminProjectMonitoring />
            )}

            {activeMenu === "issues" && (
              <AdminIssueManagement />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
