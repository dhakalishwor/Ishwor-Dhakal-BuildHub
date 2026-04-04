import { useState } from "react";
import api from "../../API/axios";
import { toast } from "react-hot-toast";

export default function SubmitBid({ projectId, onSuccess }) {
  const [proposed_price, setPrice] = useState("");
  const [proposed_days, setDays] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/bids/create/", {
        project: projectId,
        proposed_price,
        proposed_days,
        message,
      });
      onSuccess?.();
      setPrice("");
      setDays("");
      setMessage("");
      toast.success("Bid submitted!");
    } catch (err) {
      const data = err?.response?.data;
      let msg = "Failed to submit bid";
      if (data) {
        if (typeof data === "string") msg = data;
        else if (data.detail) msg = data.detail;
        else if (data.non_field_errors) msg = data.non_field_errors[0];
        else {
           // check first field error
           const firstKey = Object.keys(data)[0];
           if (Array.isArray(data[firstKey])) msg = data[firstKey][0];
           else if (typeof data[firstKey] === "string") msg = data[firstKey];
        }
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded-xl shadow">
      <h3 className="font-bold text-lg mb-3">Submit a Bid</h3>

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Proposed Price"
        value={proposed_price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />

      <input
        className="w-full border p-2 rounded mb-2"
        placeholder="Proposed Days"
        value={proposed_days}
        onChange={(e) => setDays(e.target.value)}
        required
      />

      <textarea
        className="w-full border p-2 rounded mb-2"
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        disabled={loading}
        className="w-full bg-emerald-700 text-white py-2 rounded hover:bg-emerald-800"
      >
        {loading ? "Submitting..." : "Submit Bid"}
      </button>
    </form>
  );
}
