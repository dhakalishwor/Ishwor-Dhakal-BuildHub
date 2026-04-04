import React, { useState } from "react";
import api from "../../API/axios";
import { toast } from "react-hot-toast";

export default function RateProject({ projectId, onSuccess, onCancel }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
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

      toast.success("Thanks! Your rating was submitted.");
      onSuccess?.();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Failed to submit rating. Make sure project is COMPLETED and not already rated.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-bold text-emerald-900">Rate Contractor</h3>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Rating</label>
          <div className="flex gap-1 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={(hoverRating || rating) >= star ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-8 h-8 ${
                    (hoverRating || rating) >= star
                      ? "text-amber-400"
                      : "text-slate-300"
                  } transition-colors duration-200`}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            ))}
          </div>
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
