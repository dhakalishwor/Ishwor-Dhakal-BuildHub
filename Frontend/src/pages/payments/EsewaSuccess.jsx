import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../API/axios";

export default function EsewaSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [msg, setMsg] = useState("Verifying payment...");
  const [error, setError] = useState("");

  useEffect(() => {
    const data = params.get("data");

    async function verify() {
      try {
        if (!data) {
          throw new Error("Missing verification data from eSewa redirect.");
        }

        const res = await api.post("/api/payments/verify/", { data });
        setMsg(res.data?.detail || "Payment verified successfully.");

        setTimeout(() => {
          if (localStorage.getItem("role") === "contractor") navigate("/contractor");
          else navigate("/clientdashboard");
        }, 1200);
      } catch (e) {
        setMsg("");
        setError(e?.response?.data?.detail || e?.message || "Verification failed.");
      }
    }

    verify();
  }, [params, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-bold text-emerald-900">Payment Success</h1>

        {msg && <p className="mt-3 text-sm text-slate-700">{msg}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

        <button
          onClick={() => {
            if (localStorage.getItem("role") === "contractor") navigate("/contractor");
            else navigate("/clientdashboard");
          }}
          className="mt-5 rounded-xl border px-4 py-2 text-sm hover:bg-slate-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
