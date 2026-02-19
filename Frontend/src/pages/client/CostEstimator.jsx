import React, { useMemo, useState } from "react";
import api from "../../API/axios";

const categories = ["Civil", "Electrical", "Plumbing", "Interior", "Painting", "Other"];
const locations = ["Kathmandu", "Lalitpur", "Bhaktapur", "Pokhara", "Other"];
const qualities = ["Basic", "Standard", "Premium"];
const urgencies = ["Normal", "Urgent"];
const complexities = ["Low", "Medium", "High"];


export default function CostEstimator({ onUseEstimate }) {
  const [form, setForm] = useState({
    category: "Civil",
    area_sqft: 100,
    location: "Kathmandu",
    quality: "Standard",
    urgency: "Normal",
    complexity: "Medium",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState(null);

  const canSubmit = useMemo(() => {
    const a = Number(form.area_sqft);
    return form.category && !Number.isNaN(a) && a >= 50;
  }, [form]);

  function updateField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function estimate(e) {
    e.preventDefault();
    setErr("");
    setResult(null);

    if (!canSubmit) {
      setErr("Please enter a valid area (>= 50 sqft).");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category: form.category,
        area_sqft: Number(form.area_sqft),
        location: form.location,
        quality: form.quality,
        urgency: form.urgency,
        complexity: form.complexity,
      };

      const res = await api.post("/api/estimate/preview/", payload);
      setResult(res.data);
    } catch (e2) {
      setErr(e2?.response?.data?.detail || "Failed to estimate cost. Check backend and token.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Cost Estimation</h1>
          <p className="text-sm text-slate-600">
            Get an approximate project cost before you post.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-emerald-900">Enter Project Details</h2>
          <p className="text-xs text-slate-500">The estimation uses multipliers (location, quality, urgency, complexity).</p>
        </div>

        <form onSubmit={estimate} className="p-6 space-y-4">
          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Area (sqft)</label>
              <input
                type="number"
                min={50}
                value={form.area_sqft}
                onChange={(e) => updateField("area_sqft", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
                placeholder="e.g., 1200"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Location</label>
              <select
                value={form.location}
                onChange={(e) => updateField("location", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              >
                {locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Quality</label>
              <select
                value={form.quality}
                onChange={(e) => updateField("quality", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              >
                {qualities.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Urgency</label>
              <select
                value={form.urgency}
                onChange={(e) => updateField("urgency", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              >
                {urgencies.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Complexity</label>
              <select
                value={form.complexity}
                onChange={(e) => updateField("complexity", e.target.value)}
                className="mt-1 w-full rounded-xl border px-4 py-2 text-sm"
              >
                {complexities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {loading ? "Estimating..." : "Get Estimate"}
            </button>

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setErr("");
              }}
              className="rounded-xl border px-5 py-2 text-sm hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 rounded-2xl border bg-emerald-50 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">Estimated Cost Range</h3>
              <p className="text-sm text-emerald-900/80">
                Confidence: <b>{result.confidence}</b>
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onUseEstimate?.({ ...form, estimate: result })}
                className="rounded-xl bg-emerald-900 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-950"
              >
                Use Estimate & Post Project
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white border p-4">
              <p className="text-xs text-slate-500">Min Cost</p>
              <p className="mt-1 font-bold text-emerald-900">NPR {Number(result.min_cost).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white border p-4">
              <p className="text-xs text-slate-500">Max Cost</p>
              <p className="mt-1 font-bold text-emerald-900">NPR {Number(result.max_cost).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-white border p-4">
              <p className="text-xs text-slate-500">Cost / sqft</p>
              <p className="mt-1 font-bold text-emerald-900">NPR {Number(result.cost_per_sqft).toLocaleString()}</p>
            </div>
          </div>

          {Array.isArray(result.explanation) && result.explanation.length > 0 && (
            <div className="mt-4 rounded-xl bg-white border p-4">
              <p className="text-sm font-semibold text-slate-800">How this estimate was calculated</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                {result.explanation.map((x, idx) => (
                  <li key={idx}>{x}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-600">
            Disclaimer: This is an approximate estimate based on rule-based multipliers and typical market trends.
          </p>
        </div>
      )}
    </div>
  );
}
