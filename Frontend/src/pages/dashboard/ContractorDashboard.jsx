import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../API/axios";
import AvailableProjects from "../Contractor/AvailableProjects";
import MyBids from "../Contractor/MyBids";
import MyRatings from "../Contractor/MyRatings";
import Sidebar from "../../components/Sidebar";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const emptyProfile = {
  fullName: "",
  email: "",
  address: "",
  projectTypes: [],
  experienceYears: "",
  avgRating: 0,
  totalRatings: 0,
};

const allProjectTypes = ["Civil", "Electrical", "Plumbing", "Interior", "Painting", "Other"];

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("profile");
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);

  const [editing, setEditing] = useState(false);
  const [searchType, setSearchType] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const HEADER_H = 64;

  const filteredTypes = useMemo(() => {
    const q = searchType.trim().toLowerCase();
    if (!q) return allProjectTypes;
    return allProjectTypes.filter((t) => t.toLowerCase().includes(q));
  }, [searchType]);

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      setLoading(true);
      setApiError("");
      try {
        const res = await api.get("/api/contractors/me/");
        if (!mounted) return;

        const data = res.data || {};
        const normalized = {
          fullName: data.fullName || "",
          email: data.email || "",
          address: data.address || "",
          projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : [],
          experienceYears:
            data.experienceYears === 0 || data.experienceYears ? String(data.experienceYears) : "",
          avgRating: typeof data.avgRating === "number" ? data.avgRating : Number(data.avgRating || 0),
          totalRatings:
            typeof data.totalRatings === "number"
              ? data.totalRatings
              : Number(data.totalRatings || 0),
        };

        setProfile(normalized);
        setForm(normalized);
      } catch (err) {
        if (!mounted) return;

        const status = err?.response?.status;
        let msg = "Failed to load contractor profile. Please login again and check token.";

        if (status === 401) msg = "Authentication failed. Please login again.";
        else if (status === 403)
          msg = err?.response?.data?.detail || "You don't have permission to access this resource.";
        else if (status === 500) msg = "Server error. Please try again later.";
        else if (err?.response?.data?.detail) msg = err.response.data.detail;
        else if (err?.message) msg = err.message;

        setApiError(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMe();

    if (location.state?.activeMenu) {
      setActiveMenu(location.state.activeMenu);
    }

    return () => {

      mounted = false;
    };
  }, []);

  function startEdit() {
    setSuccessMsg("");
    setApiError("");
    setForm(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setSuccessMsg("");
    setApiError("");
    setForm(profile);
    setEditing(false);
    setSearchType("");
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function toggleProjectType(type) {
    setForm((p) => {
      const exists = p.projectTypes.includes(type);
      return {
        ...p,
        projectTypes: exists ? p.projectTypes.filter((x) => x !== type) : [...p.projectTypes, type],
      };
    });
  }

  function validate(f) {
    const errors = [];
    if (!f.fullName.trim()) errors.push("Full Name is required.");
    if (f.experienceYears !== "") {
      const n = Number(f.experienceYears);
      if (!Number.isInteger(n) || n < 0) errors.push("Experience must be a whole number (0 or more).");
    }
    return errors;
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSuccessMsg("");
    setApiError("");

    const errs = validate(form);
    if (errs.length) {
      setApiError(errs.join(" "));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        projectTypes: form.projectTypes,
        experienceYears: form.experienceYears === "" ? 0 : Number(form.experienceYears),
      };

      const res = await api.patch("/api/contractors/me/", payload);

      const data = res.data || {};
      const normalized = {
        fullName: data.fullName || payload.fullName,
        email: data.email || payload.email || "",
        address: data.address || payload.address || "",
        projectTypes: Array.isArray(data.projectTypes) ? data.projectTypes : payload.projectTypes,
        experienceYears:
          data.experienceYears === 0 || data.experienceYears ? String(data.experienceYears) : "0",
        avgRating: typeof data.avgRating === "number" ? data.avgRating : profile.avgRating ?? 0,
        totalRatings: typeof data.totalRatings === "number" ? data.totalRatings : profile.totalRatings ?? 0,
      };

      setProfile(normalized);
      setForm(normalized);
      setEditing(false);
      setSearchType("");
      setSuccessMsg("Profile updated successfully.");
    } catch (err) {
      setApiError(
        err?.response?.data?.detail ||
        "Failed to update profile. Make sure you are logged in as CONTRACTOR and token is valid."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header
        className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur"
        style={{ height: HEADER_H }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm text-emerald-900 font-semibold">BuildHub</p>
              <p className="text-xs text-slate-500">Contractor Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50">
              Notifications
            </button>
            <button
              onClick={() => setActiveMenu("projects")}
              className="rounded-xl bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
            >
              Available Projects
            </button>
          </div>
        </div>
      </header>

      <div
        className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]"
        style={{ minHeight: `calc(100vh - ${HEADER_H}px)` }}
      >
        <Sidebar
          role="contractor"
          activeMenu={activeMenu}
          onItemClick={(key) => {
            if (key === "messages") {
              navigate("/messages");
              return;
            }
            if (key === "report-issue") {
              navigate("/support/report");
              return;
            }
            if (key === "my-issues") {
              navigate("/support/my-issues");
              return;
            }
            setActiveMenu(key);
          }}
        />


        <main className="bg-white">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl">
              {activeMenu === "profile" && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-emerald-900">Profile Management</h1>
                      <p className="text-sm text-slate-600">Update your contractor profile details.</p>
                    </div>

                    {!editing ? (
                      <button
                        onClick={startEdit}
                        disabled={loading}
                        className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="rounded-xl border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {loading && (
                      <div className="rounded-xl border bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                        Loading your profile...
                      </div>
                    )}

                    {apiError && (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {apiError}
                      </div>
                    )}

                    {successMsg && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {successMsg}
                      </div>
                    )}
                  </div>

                  <section className="mt-4 rounded-2xl border bg-white shadow-sm overflow-hidden">
                    <div className="border-b px-6 py-4 flex items-center justify-between">
                      <div>
                        <h2 className="font-semibold text-emerald-900">Your Profile</h2>
                        <p className="text-xs text-slate-500">Visible to clients</p>
                      </div>
                      <span
                        className={classNames(
                          "text-xs rounded-full px-3 py-1 font-semibold",
                          editing ? "bg-yellow-100 text-yellow-900" : "bg-emerald-100 text-emerald-900"
                        )}
                      >
                        {editing ? "Editing" : "Saved"}
                      </span>
                    </div>

                    {!editing ? (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Full Name</p>
                          <p className="mt-1 font-semibold">{profile.fullName || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Email</p>
                          <p className="mt-1 font-semibold">{profile.email || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4 md:col-span-2">
                          <p className="text-xs text-slate-500">Address</p>
                          <p className="mt-1 font-semibold">{profile.address || "-"}</p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Experience (Years)</p>
                          <p className="mt-1 font-semibold">
                            {profile.experienceYears !== "" ? profile.experienceYears : "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-xs text-slate-500">Type of Projects</p>
                          <p className="mt-1 font-semibold">
                            {profile.projectTypes?.length ? profile.projectTypes.join(", ") : "-"}
                          </p>
                        </div>

                        <div className="rounded-xl border p-4 md:col-span-2">
                          <p className="text-xs text-slate-500">Average Rating</p>
                          <p className="mt-1 font-semibold">
                            {Number(profile.avgRating || 0).toFixed(2)} / 5{" "}
                            <span className="text-xs text-slate-500 font-normal">
                              ({Number(profile.totalRatings || 0)} ratings)
                            </span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={saveProfile} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700">Full Name</label>
                            <input
                              name="fullName"
                              value={form.fullName}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input
                              name="email"
                              value={form.email}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-slate-700">Address</label>
                          <input
                            name="address"
                            value={form.address}
                            onChange={onChange}
                            className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="City, Area"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Experience (Years)
                            </label>
                            <input
                              name="experienceYears"
                              value={form.experienceYears}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              placeholder="e.g., 3"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-slate-700">
                              Type of Projects (select)
                            </label>
                            <input
                              value={searchType}
                              onChange={(e) => setSearchType(e.target.value)}
                              className="mt-1 w-full rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              placeholder="Search project types..."
                            />
                          </div>
                        </div>

                        <div className="rounded-xl border p-4">
                          <p className="text-sm font-medium text-slate-700">Choose your project types</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {filteredTypes.map((type) => {
                              const selected = form.projectTypes.includes(type);
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => toggleProjectType(type)}
                                  className={classNames(
                                    "rounded-full px-3 py-1 text-xs font-semibold border transition",
                                    selected
                                      ? "bg-emerald-700 text-white border-emerald-700"
                                      : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50"
                                  )}
                                >
                                  {type}
                                </button>
                              );
                            })}
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            Selected:{" "}
                            <span className="font-semibold">
                              {form.projectTypes.length ? form.projectTypes.join(", ") : "None"}
                            </span>
                          </p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="rounded-xl border px-5 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving}
                            className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                          >
                            {saving ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </form>
                    )}
                  </section>
                </>
              )}

              {activeMenu === "projects" && (
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <AvailableProjects />
                </div>
              )}

              {activeMenu === "bids" && (
                <div className="rounded-2xl border bg-white shadow-sm">
                  <MyBids />
                </div>
              )}

              {activeMenu === "ratings" && (
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <MyRatings />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
