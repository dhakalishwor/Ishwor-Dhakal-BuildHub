import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../API/axios";

export default function EsewaFailure() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [msg] = useState("Payment failed or cancelled.");
  const [error, setError] = useState("");

  useEffect(() => {
    const data = params.get("data");

    async function notifyFailure() {
      try {
        if (data) {
          await api.post("/api/payments/failure/", { data });
        }
      } catch (e) {
        setError(e?.response?.data?.detail || "Could not record failure.");
      }
    }

    notifyFailure();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-red-700">Payment Failed</h1>

        <p className="mt-3 text-sm text-slate-700">{msg}</p>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <button
          onClick={() => navigate("/clientdashboard")}
          className="mt-5 rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
