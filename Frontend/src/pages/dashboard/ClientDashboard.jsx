import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../API/axios";

import PostProject from "../client/PostProject";
import ProjectBids from "../client/ProjectBids";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
function ChatPanel({ initialConversation = null }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wsError, setWsError] = useState("");

  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  const accessToken = localStorage.getItem("accessToken") || "";
  const myUsername = localStorage.getItem("username") || "";

  const fetchConversations = async () => {
    try {
      const res = await api.get("/api/chat/");
      const convs = res.data || [];
      setConversations(convs);

      // If we have an initial conversation, set it as active
      if (initialConversation) {
        const found = convs.find(c => c.id === initialConversation.id);
        setActiveConv(found || initialConversation);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  const fetchMessages = async (convId) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/chat/${convId}/messages/`);
      setMessages(res.data.map(m => ({
        id: m.id,
        text: m.content,
        sender: m.sender_name,
        sender_id: m.sender,
        createdAt: m.created_at
      })));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      setLoading(false);
    }
  };

  function buildWsUrl(convId) {
    const isHttps = window.location.protocol === "https:";
    const wsScheme = isHttps ? "wss" : "ws";
    // Point to 8000 for local dev if necessary, or just use host
    const host = window.location.hostname + ":8000";
    return `${wsScheme}://${host}/ws/chat/${convId}/?token=${accessToken}`;
  }

  function connect(convId) {
    if (!convId || !accessToken) return;
    setWsError("");
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(buildWsUrl(convId));
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat_message") {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            text: data.message,
            sender: data.sender,
            sender_id: data.sender_id,
            createdAt: data.created_at,
          },
        ]);
      }
    };
    ws.onerror = () => setWsError("WebSocket error.");
    ws.onclose = () => setConnected(false);
  }

  function sendMessage() {
    const text = input.trim();
    if (!text || !connected) return;
    wsRef.current.send(JSON.stringify({ message: text }));
    setInput("");
  }

  useEffect(() => {
    fetchConversations();
  }, [initialConversation]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);
      connect(activeConv.id);
    }
    return () => wsRef.current?.close();
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] rounded-2xl border bg-white shadow-sm overflow-hidden h-[600px]">
      {/* Sidebar List */}
      <div className="border-r bg-slate-50 overflow-y-auto">
        <div className="p-4 border-b bg-white">
          <h3 className="font-bold text-emerald-900 text-sm">Conversations</h3>
        </div>
        {conversations.length === 0 ? (
          <p className="p-4 text-xs text-slate-500">No active chats</p>
        ) : (
          conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className={classNames(
                "w-full text-left p-3 border-b text-xs transition-colors hover:bg-emerald-50",
                activeConv?.id === c.id ? "bg-emerald-50 border-r-4 border-r-emerald-600" : ""
              )}
            >
              <p className="font-bold text-emerald-900 truncate">{c.project.title}</p>
              <p className="text-slate-500 truncate mt-1">
                {c.contractor.username === myUsername ? `Client: ${c.client.username}` : `Contr: ${c.contractor.username}`}
              </p>
            </button>
          ))
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-col min-w-0">
        <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-lg font-bold text-emerald-900 uppercase">
              {activeConv ? activeConv.project.title : "SELECT A CHAT"}
            </h2>
            <p className="text-xs text-slate-600">
              {connected ? "Connected" : activeConv ? "Connecting..." : "Choose a conversation on the left"}
            </p>
          </div>
          {wsError && <span className="text-xs text-red-500">{wsError}</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {!activeConv ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
              Click a conversation to view messages
            </div>
          ) : (
            <>
              {loading && <p className="text-center text-xs text-slate-400">Loading history...</p>}
              {messages.map((m) => {
                const isMe = m.sender === myUsername;
                return (
                  <div key={m.id} className={classNames("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={classNames(
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm border",
                        isMe
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-slate-900 border-slate-200"
                      )}
                    >
                      {!isMe && <div className="text-[10px] font-bold opacity-70 mb-1">{m.sender}</div>}
                      <div className="whitespace-pre-wrap break-words">{m.text}</div>
                      <div className="mt-1 text-[10px] opacity-70 text-right">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeConv ? "Type a message..." : "Select a chat first..."}
              className="flex-1 rounded-xl border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              disabled={!connected}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeProject(p) {
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    budget: p.budget,
    status: p.status,
    createdAt: p.created_at || "",
    location: p.location || "",
    description: p.description || "",
    rated: !!p.rating,
    payment_status: p.payment_status || "UNPAID",
    final_amount: p.final_amount ?? null,
  };
}

function submitEsewaForm(url, payload) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;

  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value ?? "");
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

function PayWithEsewaButton({ projectId, onStarted }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await api.post(`/api/payments/initiate/${projectId}/`);

      const esewaFormUrl = res.data?.esewa_form_url;
      const payload = res.data?.payload;

      if (!esewaFormUrl) throw new Error("esewa_form_url missing from backend response.");
      if (!payload) throw new Error("payload missing from backend response.");

      if (onStarted) onStarted();

      submitEsewaForm(esewaFormUrl, payload);
    } catch (err) {
      alert(err?.response?.data?.detail || err?.message || "Payment initiation failed.");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="mt-2 rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
    >
      {loading ? "Redirecting..." : "Pay with eSewa"}
    </button>
  );
}

function RateProject({ projectId, onDone }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/ratings/", {
        project: projectId,
        rating,
        feedback,
      });
      onDone();
    } catch (e) {
      alert(e?.response?.data?.detail || "Rating failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        {[5, 4, 3, 2, 1].map((n) => (
          <option key={n} value={n}>
            {n} Star{n > 1 ? "s" : ""}
          </option>
        ))}
      </select>

      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={3}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        placeholder="Optional feedback"
      />

      <button
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Submitting..." : "Submit Rating"}
      </button>
    </form>
  );
}

function MyProjectsView({
  projects,
  loading,
  error,
  onRefresh,
  onMarkCompleted,
  actionLoadingId,
  ratingProjectId,
  setRatingProjectId,
  onRated,
  onPaymentStarted,
  recommendedContractors = [],
}) {
  return (
    <div className="max-w-5xl mx-auto">
      {recommendedContractors.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-emerald-100/60 p-5">
          <h2 className="text-lg font-bold text-emerald-900">Recommended Contractors</h2>
          <p className="text-sm text-emerald-900/80 mb-4">Based on your newly posted project</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {recommendedContractors.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm border border-emerald-100">
                <p className="font-semibold text-emerald-900">{c.fullName}</p>
                <p className="text-sm text-slate-600">Experience: {c.experienceYears} years</p>
                <p className="text-xs text-slate-500 mt-1">
                  Types: {(c.projectTypes || []).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-emerald-900">My Projects</h1>

        <button
          onClick={onRefresh}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-white"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div className="bg-white p-6 rounded-xl shadow text-sm text-emerald-900">
          Loading projects...
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && projects.length === 0 ? (
        <div className="bg-white p-6 rounded-xl shadow">No projects posted yet.</div>
      ) : (
        !loading &&
        !error && (
          <div className="grid gap-4">
            {projects.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow p-5 border">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <h3 className="font-semibold text-emerald-900">{p.title}</h3>
                    <p className="text-sm text-slate-500">
                      {p.category} • {p.location}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-900">
                      {p.status}
                    </span>

                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => onMarkCompleted(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {actionLoadingId === p.id ? "Completing..." : "Mark Completed"}
                      </button>
                    )}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-700">{p.description}</p>
                <p className="mt-2 text-sm">
                  Budget: <b>{p.budget}</b>
                </p>

                {p.status === "COMPLETED" && p.payment_status !== "PAID" && (
                  <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-sm text-yellow-900 font-semibold">
                      Payment required (accepted bid amount)
                    </p>
                    <PayWithEsewaButton projectId={p.id} onStarted={onPaymentStarted} />
                  </div>
                )}

                {p.status === "COMPLETED" && p.payment_status === "PAID" && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <p className="text-sm text-emerald-900 font-semibold">
                      Paid ✅ {p.final_amount ? `NPR ${p.final_amount}` : ""}
                    </p>
                  </div>
                )}

                {p.status === "COMPLETED" && p.payment_status === "PAID" && !p.rated && (
                  <div className="mt-3">
                    <button
                      onClick={() => setRatingProjectId(ratingProjectId === p.id ? null : p.id)}
                      className="rounded-lg bg-emerald-700 px-3 py-1 text-xs text-white"
                    >
                      Rate Project
                    </button>

                    {ratingProjectId === p.id && (
                      <RateProject
                        projectId={p.id}
                        onDone={() => {
                          setRatingProjectId(null);
                          onRated();
                        }}
                      />
                    )}
                  </div>
                )}

                {p.status === "COMPLETED" && p.payment_status === "PAID" && p.rated && (
                  <p className="mt-3 text-xs text-emerald-700 font-semibold">Already Rated</p>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState("");
  const [ratingProjectId, setRatingProjectId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [recommendedContractors, setRecommendedContractors] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  async function loadProjects() {
    setLoadingProjects(true);
    setProjectsError("");
    try {
      const res = await api.get("/api/projects/");
      const list = Array.isArray(res.data) ? res.data.map(normalizeProject) : [];
      setProjects(list);
    } catch (e) {
      setProjectsError(e?.response?.data?.detail || "Failed to load projects.");
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function markCompleted(projectId) {
    setActionLoadingId(projectId);
    try {
      await api.patch(`/api/projects/${projectId}/complete/`);
      await loadProjects();
      alert("Project marked as completed! Now you can pay the accepted bid amount.");
    } catch (e) {
      alert(e?.response?.data?.detail || "Failed to complete project.");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadProjects();

    const url = new URL(window.location.href);
    if (url.searchParams.get("paid") === "1") {
      loadProjects();
      url.searchParams.delete("paid");
      window.history.replaceState({}, "", url.pathname);
      setActiveMenu("my-projects");
    }
  }, []);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) =>
      [p.title, p.category, p.status, p.location].join(" ").toLowerCase().includes(q)
    );
  }, [search, projects]);

  const stats = useMemo(() => {
    const paidProjects = projects.filter(
      (p) => p.status === "COMPLETED" && p.payment_status === "PAID"
    );

    const totalPaidAmount = paidProjects.reduce(
      (sum, p) => sum + Number(p.final_amount || 0),
      0
    );

    return {
      active: projects.filter((p) => p.status === "ACTIVE").length,
      bidding: projects.filter((p) => p.status === "BIDDING").length,
      completed: projects.filter((p) => p.status === "COMPLETED").length,
      paid: paidProjects.length,
      totalPaidAmount,
    };
  }, [projects]);

  // ✅ UPDATED: added messages
  const menuItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "postproject", label: "Post Project" },
    { key: "my-projects", label: "My Projects" },
    { key: "project-bids", label: "Project Bids" },
    { key: "messages", label: "Messages" }, // ✅ added
    { key: "profile", label: "Profile" },
  ];

  const HEADER_H = 64;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              BH
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">BuildHub</p>
              <p className="text-xs text-slate-500">Client Dashboard</p>
            </div>
          </div>

          <button
            onClick={() => setActiveMenu("postproject")}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Post Project
          </button>
        </div>
      </header>

      <div
        className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]"
        style={{ minHeight: `calc(100vh - ${HEADER_H}px)` }}
      >
        <aside
          className="border-r bg-emerald-900 text-white p-4 md:sticky md:top-[64px]"
          style={{ height: `calc(100vh - ${HEADER_H}px)` }}
        >
          <p className="text-xs uppercase text-emerald-200">Client Menu</p>

          <div className="mt-2 space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveMenu(item.key);
                  if (item.key !== "my-projects") setRecommendedContractors([]);
                }}
                className={classNames(
                  "w-full rounded-xl px-4 py-3 text-left transition",
                  activeMenu === item.key ? "bg-emerald-700" : "hover:bg-emerald-800"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="p-6">
          {activeMenu === "dashboard" && (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="mb-4 w-full rounded-xl border px-4 py-2"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
                <div className="border p-4 rounded-xl">Active: {stats.active}</div>
                <div className="border p-4 rounded-xl">Bidding: {stats.bidding}</div>
                <div className="border p-4 rounded-xl">Completed: {stats.completed}</div>
                <div className="border p-4 rounded-xl">Paid: {stats.paid}</div>
                <div className="border p-4 rounded-xl bg-emerald-50 text-emerald-900 font-semibold">
                  Total Paid: NPR {stats.totalPaidAmount}
                </div>
              </div>

              {loadingProjects && <p>Loading...</p>}
              {projectsError && <p className="text-red-600">{projectsError}</p>}

              <div className="space-y-4">
                {filteredProjects.map((p) => (
                  <div key={p.id} className="border rounded-xl p-4">
                    <h3 className="font-bold">{p.title}</h3>
                    <p className="text-sm">
                      {p.category} • {p.location}
                    </p>
                    <p className="text-sm mt-1">
                      Status: {p.status} • Payment: {p.payment_status}
                    </p>

                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => markCompleted(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                      >
                        {actionLoadingId === p.id ? "Completing..." : "Mark Completed"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {activeMenu === "my-projects" && (
            <MyProjectsView
              projects={projects}
              loading={loadingProjects}
              error={projectsError}
              onRefresh={loadProjects}
              onMarkCompleted={markCompleted}
              actionLoadingId={actionLoadingId}
              ratingProjectId={ratingProjectId}
              setRatingProjectId={setRatingProjectId}
              onRated={loadProjects}
              onPaymentStarted={() => { }}
              recommendedContractors={recommendedContractors}
            />
          )}

          {activeMenu === "postproject" && (
            <PostProject
              onCreated={(data) => {
                loadProjects();
                setRecommendedContractors(data.recommended_contractors || data.recommended || []);
                setActiveMenu("my-projects");
              }}
            />
          )}

          {activeMenu === "project-bids" && (
            <ProjectBids
              onDone={() => setActiveMenu("dashboard")}
              onChatStarted={(conv) => {
                setSelectedConversation(conv);
                setActiveMenu("messages");
              }}
            />
          )}

          {/* ✅ NEW: Messages section */}
          {activeMenu === "messages" && (
            <ChatPanel
              meLabel="You"
              peerLabel="Contractor"
              initialConversation={selectedConversation}
            />
          )}

          {activeMenu === "profile" && (
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <h2 className="text-xl font-bold text-emerald-900">PROFILE</h2>
              <p className="mt-2 text-sm text-slate-600">This page is for profile.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
