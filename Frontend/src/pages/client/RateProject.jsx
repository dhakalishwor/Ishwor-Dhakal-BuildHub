import React, { useState } from "react";
import api from "../../API/axios";

export default function RateProject({ projectId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/ratings/", {
        project: projectId,
        rating: Number(rating),
        feedback,
      });

      alert("Thanks! Your rating was submitted.");
      onSuccess?.();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Failed to submit rating. Make sure project is COMPLETED and not already rated.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-emerald-900">Rate Contractor</h3>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700">Rating</label>
          <select
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} Star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Feedback (optional)</label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="Describe your experience..."
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold hover:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border px-4 py-2 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
