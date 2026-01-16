import React, { useEffect, useMemo, useState } from "react";
import api from "../../API/axios";

export default function MyRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchRatings = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/ratings/me/");
      setRatings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load ratings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const avg = useMemo(() => {
    if (!ratings.length) return "0.0";
    const sum = ratings.reduce((a, r) => a + Number(r.rating || 0), 0);
    return (sum / ratings.length).toFixed(1);
  }, [ratings]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-emerald-900">My Ratings</h2>
        <button
          onClick={fetchRatings}
          className="rounded-xl bg-emerald-700 px-4 py-2 text-white font-semibold"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading...</p>}
      {errMsg && <p className="text-red-600">{errMsg}</p>}

      {!loading && !errMsg && (
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">Average Rating</p>
          <p className="text-3xl font-bold text-emerald-900">{avg} / 5</p>
          <p className="text-sm text-slate-500 mt-1">{ratings.length} review(s)</p>
        </div>
      )}

      <div className="space-y-3">
        {ratings.map((r) => (
          <div key={r.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Rating: {r.rating} / 5</p>
              <p className="text-xs text-slate-500">
                {r.created_at ? new Date(r.created_at).toLocaleString() : ""}
              </p>
            </div>
            {r.feedback && <p className="mt-2 text-sm text-slate-700">“{r.feedback}”</p>}
            <p className="mt-2 text-xs text-slate-500">Project ID: {r.project}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
