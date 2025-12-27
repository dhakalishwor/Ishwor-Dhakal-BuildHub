import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

const UploadLicense = () => {
  const navigate = useNavigate();

  const [licenseFile, setLicenseFile] = useState(null);
  const [contractorId, setContractorId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Ensure contractor_id exists (user came from register)
  useEffect(() => {
    const id = localStorage.getItem("pendingContractorId");
    if (!id) {
      setError("Contractor information not found. Please register again.");
    } else {
      setContractorId(id);
    }
  }, []);

  const handleFileChange = (e) => {
    setError("");
    setSuccess("");
    setLicenseFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!contractorId) {
      setError("Contractor ID missing. Please register again.");
      return;
    }

    if (!licenseFile) {
      setError("Please select a license document to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("contractor_id", contractorId); // REQUIRED
    formData.append("license_document", licenseFile);

    setLoading(true);

    try {
      await api.post("/auth/contractor/upload-license/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("License uploaded successfully. Please login to continue.");

      // cleanup temporary ID
      localStorage.removeItem("pendingContractorId");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "Failed to upload license. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          Upload Contractor License
        </h2>

        <p className="text-sm text-gray-600 text-center mb-6">
          Contractors are required to upload a valid license document before
          accessing the system.
        </p>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        {success && (
          <p className="text-green-600 text-sm text-center mb-4">{success}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-gray-700 mb-1">
              Contractor License
            </label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, JPG, PNG
            </p>
          </div>

          {/* Upload Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-60"
          >
            {loading ? "Uploading..." : "Upload License"}
          </button>
        </form>

        {/* Back to Login */}
        <p className="text-sm text-center text-gray-600 mt-4">
          Already uploaded?{" "}
          <span
            className="text-green-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Go to Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default UploadLicense;
