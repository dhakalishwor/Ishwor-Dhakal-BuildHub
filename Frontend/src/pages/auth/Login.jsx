import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setError("");
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const extractErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) return "Login failed. Please try again.";
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;


    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      return data.non_field_errors[0];
    }


    const firstKey = Object.keys(data)[0];
    const firstVal = data[firstKey];

    if (Array.isArray(firstVal) && firstVal.length > 0) return firstVal[0];
    if (typeof firstVal === "string") return firstVal;

    return "Invalid credentials.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login/", {
        username: formData.username.trim(),
        password: formData.password,
      });

      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refreshToken", res.data.refresh);
      localStorage.setItem("username", res.data.user.username);
      localStorage.setItem("user_id", res.data.user.id);

      const user = res.data.user;
      const role = user?.role;
      const isAdmin = user?.is_admin;

      if (isAdmin) {
        navigate("/admin/dashboard");
      } else if (role === "client") {
        navigate("/clientdashboard");
      } else if (role === "contractor") {
        navigate("/contractor");
      } else if (role === "worker") {
        navigate("/worker/dashboard");
      } else {
        navigate("/");
      }
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
          BuildHub Login
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

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
              placeholder="Enter password"
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Don’t have an account?{" "}
          <span
            className="text-green-600 cursor-pointer hover:underline"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
