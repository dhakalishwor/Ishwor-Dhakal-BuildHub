import React, { useState } from "react";
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

export default function PostProject({ onCreated, onDone }) {
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

      onCreated?.(res.data);
      onDone?.();
      setForm(initialForm);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to post project. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Post New Project</h1>
          <p className="text-sm text-slate-600">
            Create a project so contractors can bid and you can choose the best one.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDone?.()}
          className="text-sm rounded-lg border px-3 py-2 hover:bg-slate-50"
        >
          ← Back
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6 border">
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
            <option value="OTHER">Other</option>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
            />
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={onChange}
              className="w-full border rounded-xl px-4 py-2"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-700 text-white px-6 py-2 rounded-xl hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Posting..." : "Post Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
