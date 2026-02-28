import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

export default function ProjectBids({ onDone, onChatStarted }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const navigate = useNavigate();

  const startConversation = async (projectId, contractorId) => {
    try {
      const res = await api.post("/api/chat/start/", {
        project_id: projectId,
        contractor_id: contractorId,
      });

      if (onChatStarted) {
        onChatStarted(res.data);
      } else {
        const conversationId = res.data.id;
        navigate(`/messages?conversation=${conversationId}`);
      }
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to start conversation");
    }
  };

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
      setSelectedProject(projectId);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (bidId, status) => {
    try {
      await api.patch(`/api/bids/${bidId}/status/`, { status });
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Project Bids</h1>
          <p className="text-sm text-slate-600">
            Select a project and review bids. Accept one bid to assign a contractor.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchProjects}
            className="px-4 py-2 rounded-xl border text-sm hover:bg-white"
          >
            Refresh
          </button>

          <button
            onClick={() => onDone?.()}
            className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800"
          >
            Back
          </button>
        </div>
      </div>

      {errMsg && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700 mb-4">
          {errMsg}
        </div>
      )}

      {loading && <p className="text-gray-500 mb-4">Loading...</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-2xl shadow p-5 border">
          <h2 className="text-xl font-bold mb-4 text-emerald-900">Your Projects</h2>

          {projects.length === 0 ? (
            <p className="text-gray-500">No projects found.</p>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <button
                  type="button"
                  key={`project-${project.id}`}
                  onClick={() => fetchBids(project.id)}
                  className={[
                    "w-full text-left border rounded-xl p-4 cursor-pointer transition-all",
                    selectedProject === project.id
                      ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300"
                      : "hover:bg-gray-50 border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-semibold text-emerald-900">{project.title}</h3>
                      <p className="text-sm text-gray-600">
                        {project.category} • {project.location}
                      </p>
                      <p className="text-sm mt-1">Budget: NPR {project.budget}</p>
                    </div>

                    <span className="shrink-0 text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                      {project.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border">
          <h2 className="text-xl font-bold mb-4 text-emerald-900">Bids Received</h2>

          {!selectedProject ? (
            <p className="text-gray-500">Select a project to view bids</p>
          ) : bids.length === 0 ? (
            <p className="text-gray-500">No bids received for this project yet.</p>
          ) : (
            <div className="space-y-4">
              {bids.map((bid) => (
                <div key={`bid-${bid.id}`} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <div>
                      <p className="font-semibold text-emerald-900">
                        {bid.contractor_name || "Contractor"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Contractor ID: {bid.contractor}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 text-xs px-3 py-1 rounded-full font-semibold",
                        bid.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : bid.status === "ACCEPTED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800",
                      ].join(" ")}
                    >
                      {bid.status}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <p className="text-sm">
                      <span className="font-semibold">Proposed Price:</span> NPR
                      {bid.proposed_price}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">Duration:</span> {bid.proposed_days} days
                    </p>
                    {bid.message && (
                      <p className="text-sm text-gray-700 mt-2">
                        <span className="font-semibold">Message:</span> {bid.message}
                      </p>
                    )}
                    {bid.created_at && (
                      <p className="text-xs text-gray-500">
                        Submitted: {new Date(bid.created_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => startConversation(selectedProject, bid.contractor)}
                      className="flex-1 px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-semibold text-sm"
                    >
                      Message
                    </button>
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
  );
}
