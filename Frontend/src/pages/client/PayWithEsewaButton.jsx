import React, { useState } from "react";
import api from "../API/axios";
import { submitEsewaForm } from "../utils/esewa";

export default function PayWithEsewaButton({ projectId }) {
  const [loading, setLoading] = useState(false);

  const payNow = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/api/payments/initiate/${projectId}/`);
      console.log("PAYMENT INITIATE RESPONSE:", res.data);

      const esewaUrl = res.data?.esewa_form_url;
      const payload = res.data?.payload;

      if (!esewaUrl || !payload) {
        throw new Error("Missing esewa_form_url or payload from backend response.");
      }

      submitEsewaForm(esewaUrl, payload);
    } catch (e) {
      alert(e?.response?.data?.detail || e?.message || "Payment initiate failed.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={payNow}
      disabled={loading}
      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? "Redirecting..." : "Pay with eSewa"}
    </button>
  );
}
