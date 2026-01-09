import React, { useEffect, useState } from "react";
import api from "../../API/axios";

export default function MyBids() {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const fetchMyBids = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/bids/me/");
      setBids(res.data || []);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load your bids");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-emerald-900">My Bids</h2>
          <p className="text-sm text-gray-600">Track all your submitted bids</p>
        </div>
        <button
          onClick={fetchMyBids}
          className="px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {errMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
          {errMsg}
        </div>
      )}

      {!loading && !errMsg && bids.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-500">You haven't placed any bids yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            Check the Available Projects section to place your first bid!
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {bids.map((bid) => (
          <div key={bid.id} className="border rounded-xl p-5 bg-white shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-emerald-900">
                  Project ID: {bid.project}
                </h3>
                <p className="text-xs text-gray-500">
                  Submitted on: {new Date(bid.created_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={[
                  "text-xs px-3 py-1 rounded-full font-semibold",
                  getStatusColor(bid.status)
                ].join(" ")}
              >
                {bid.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-emerald-50 rounded-lg p-3">
                <p className="text-xs text-emerald-700 font-semibold">Proposed Price</p>
                <p className="text-lg font-bold text-emerald-900">${bid.proposed_price}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-semibold">Duration</p>
                <p className="text-lg font-bold text-blue-900">{bid.proposed_days} days</p>
              </div>
            </div>

            {bid.message && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-600 font-semibold mb-1">Your Message:</p>
                <p className="text-sm text-gray-700">{bid.message}</p>
              </div>
            )}

            {bid.status === "ACCEPTED" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-semibold">
                  🎉 Congratulations! Your bid has been accepted by the client.
                </p>
              </div>
            )}

            {bid.status === "REJECTED" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Unfortunately, this bid was not selected. Keep trying!
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
