import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "client",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setSuccess("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const extractErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) return "Registration failed. Please try again.";
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;

    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];

    if (Array.isArray(firstVal) && firstVal.length > 0) return firstVal[0];
    if (typeof firstVal === "string") return firstVal;

    return "Registration failed. Please check your inputs.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!["client", "contractor", "worker"].includes(formData.role)) {
      setError("Invalid role selected.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/register/", {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
        password: formData.password,
      });

      setSuccess("Account created successfully!");

      const user = res.data.user;
      const requiresUpload = Boolean(res.data.requires_license_upload);

      // ✅ STORE contractor_id for upload step
      if (user.role === "contractor") {
        localStorage.setItem(
          "pendingContractorId",
          String(user.id)
        );
      }

      setTimeout(() => {
        if (requiresUpload && user.role === "contractor") {
          navigate("/contractor/upload-license");
        } else {
          navigate("/login");
        }
      }, 800);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create BuildHub Account
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm text-center mb-4">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-gray-700 mb-1">Username</label>
            <input
              type="text"
              name="username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter username"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter email"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="client">Client</option>
              <option value="contractor">Contractor</option>
              <option value="worker">Worker</option>
            </select>

            <p className="text-xs text-gray-500 mt-1">
              Note: Contractors must upload a license after registration.
            </p>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Create password"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Confirm password"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <span
            className="text-green-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Register;
