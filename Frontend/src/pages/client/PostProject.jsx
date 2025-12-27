import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

const initialForm = {
  title: "",
  category: "CIVIL",
  location: "",
  description: "",
  budget: "",
  startDate: "",
  endDate: "",
};

export default function PostProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await api.post("/api/projects/", {
        title: form.title,
        category: form.category,
        location: form.location,
        description: form.description,
        budget: Number(form.budget),
        start_date: form.startDate || null,
        end_date: form.endDate || null,
      });

      //automatic recommendations from backend
      const recommended = res.data.recommended_contractors || [];

      navigate("/client/projects", {
        state: {
          highlightId: res.data.id,
          recommended,
        },
      });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Failed to post project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-emerald-50">
      {/* Sidebar */}
      <aside className="bg-emerald-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">Client Menu</h2>

        <button
          onClick={() => navigate("/clientdashboard")}
          className="w-full mb-3 rounded-xl px-4 py-2 bg-emerald-700 hover:bg-emerald-800"
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/client/projects")}
          className="w-full rounded-xl px-4 py-2 bg-emerald-800 hover:bg-emerald-700"
        >
          My Projects
        </button>
      </aside>

      {/* Main */}
      <main className="p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold text-emerald-900">
              Post New Project
            </h1>

            {/* Back Button */}
            <button
              onClick={() => navigate("/clientdashboard")}
              className="text-sm rounded-lg border px-3 py-1 hover:bg-slate-50"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="mb-3 text-sm text-red-700 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <input
              name="title"
              placeholder="Project Title"
              value={form.title}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
              required
            />

            <select
              name="category"
              value={form.category}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
            >
              <option value="CIVIL">Civil</option>
              <option value="ELECTRICAL">Electrical</option>
              <option value="PLUMBING">Plumbing</option>
              <option value="INTERIOR">Interior</option>
              <option value="PAINTING">Painting</option>
            </select>

            <input
              name="location"
              placeholder="Location"
              value={form.location}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
              required
            />

            <textarea
              name="description"
              placeholder="Project Description"
              value={form.description}
              onChange={onChange}
              rows={4}
              className="w-full border rounded-xl px-4 py-2"
              required
            />

            <input
              name="budget"
              placeholder="Budget"
              value={form.budget}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
              required
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-700 text-white px-6 py-2 rounded-xl hover:bg-emerald-800"
              >
                {saving ? "Posting..." : "Post Project"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
