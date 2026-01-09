import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

export default function ProjectBids() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  // Fetch all client projects
  const fetchProjects = async () => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get("/api/projects/");
      setProjects(res.data || []);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bids for a specific project
  const fetchBids = async (projectId) => {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await api.get(`/api/projects/${projectId}/bids/`);
      setBids(res.data || []);
      setSelectedProject(projectId);
    } catch (err) {
      setErrMsg(err?.response?.data?.detail || "Failed to load bids");
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  // Update bid status
  const updateStatus = async (bidId, status) => {
    try {
      await api.patch(`/api/bids/${bidId}/status/`, { status });
      // Reload bids for the selected project
      if (selectedProject) {
        fetchBids(selectedProject);
      }
      alert(`Bid ${status.toLowerCase()} successfully!`);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to update bid");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] bg-emerald-50">
      {/* Sidebar */}
      <aside className="bg-emerald-900 text-white p-4">
        <h2 className="text-lg font-bold mb-6">Client Menu</h2>

        <button
          onClick={() => navigate("/clientdashboard")}
          className="w-full mb-3 rounded-xl px-4 py-2 bg-emerald-700 hover:bg-emerald-800"
        >
          Dashboard
        </button>

        <button
          onClick={() => navigate("/client/postproject")}
          className="w-full mb-3 rounded-xl px-4 py-2 bg-emerald-700 hover:bg-emerald-800"
        >
          Post Project
        </button>

        <button
          onClick={() => navigate("/client/myprojects")}
          className="w-full rounded-xl px-4 py-2 bg-emerald-700 hover:bg-emerald-800"
        >
          My Projects
        </button>
      </aside>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-emerald-900">Project Bids</h1>
            <button
              onClick={fetchProjects}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
            >
              Refresh
            </button>
          </div>

          {errMsg && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 mb-4">
              {errMsg}
            </div>
          )}

          {loading && <p className="text-gray-500">Loading...</p>}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Projects List */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-bold mb-4 text-emerald-900">Your Projects</h2>
              
              {projects.length === 0 ? (
                <p className="text-gray-500">No projects found.</p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => fetchBids(project.id)}
                      className={[
                        "border rounded-xl p-4 cursor-pointer transition-all",
                        selectedProject === project.id
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300"
                          : "hover:bg-gray-50 border-gray-200"
                      ].join(" ")}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-emerald-900">{project.title}</h3>
                          <p className="text-sm text-gray-600">
                            {project.category} • {project.location}
                          </p>
                          <p className="text-sm mt-1">Budget: ${project.budget}</p>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                          {project.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bids Display */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="text-xl font-bold mb-4 text-emerald-900">Bids Received</h2>

              {!selectedProject ? (
                <p className="text-gray-500">Select a project to view bids</p>
              ) : bids.length === 0 ? (
                <p className="text-gray-500">No bids received for this project yet.</p>
              ) : (
                <div className="space-y-4">
                  {bids.map((bid) => (
                    <div key={bid.id} className="border rounded-xl p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-emerald-900">
                            {bid.contractor_name}
                          </p>
                          <p className="text-sm text-gray-600">Contractor ID: {bid.contractor}</p>
                        </div>
                        <span
                          className={[
                            "text-xs px-3 py-1 rounded-full font-semibold",
                            bid.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : bid.status === "ACCEPTED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          ].join(" ")}
                        >
                          {bid.status}
                        </span>
                      </div>

                      <div className="space-y-1 mb-3">
                        <p className="text-sm">
                          <span className="font-semibold">Proposed Price:</span> ${bid.proposed_price}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">Duration:</span> {bid.proposed_days} days
                        </p>
                        {bid.message && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-semibold">Message:</span> {bid.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {bid.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(bid.id, "ACCEPTED")}
                            className="flex-1 px-3 py-2 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => updateStatus(bid.id, "REJECTED")}
                            className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
