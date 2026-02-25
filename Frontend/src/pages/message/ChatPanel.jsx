import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../API/axios";

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function ChatPanel({ initialConversation = null }) {
    const navigate = useNavigate();
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

            if (initialConversation) {
                const found = convs.find(c => c.id === Number(initialConversation.id || initialConversation));
                setActiveConv(found || null);
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
        ws.onerror = () => setWsError("WebSocket connection failed.");
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
    }, []);

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
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] rounded-2xl border bg-white shadow-sm overflow-hidden h-[calc(100vh-180px)] min-h-[500px]">
            {/* Sidebar List */}
            <div className="border-r bg-slate-50 overflow-y-auto">
                <div className="p-4 border-b bg-white">
                    <h3 className="font-bold text-emerald-900 text-sm">Conversations</h3>
                </div>
                {conversations.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500 italic">No active chats found.</p>
                ) : (
                    conversations.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setActiveConv(c)}
                            className={classNames(
                                "w-full text-left p-4 border-b text-xs transition-colors hover:bg-emerald-50",
                                activeConv?.id === c.id ? "bg-emerald-50 border-r-4 border-r-emerald-600" : ""
                            )}
                        >
                            <p className="font-bold text-emerald-900 truncate uppercase">{c.project.title}</p>
                            <p className="text-slate-500 truncate mt-1">
                                {c.client.username === myUsername ? `Contractor: ${c.contractor.username}` : `Client: ${c.client.username}`}
                            </p>
                        </button>
                    ))
                )}
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-col min-w-0">
                <div className="border-b px-6 py-4 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-emerald-900 uppercase">
                                {activeConv ? activeConv.project.title : "Select a Chat"}
                            </h2>
                            <p className="text-xs text-slate-600">
                                {connected ? "● Online" : activeConv ? "Connecting..." : "Choose a conversation on the left"}
                            </p>
                        </div>
                        {activeConv && (
                            <button
                                onClick={() => {
                                    const reportedUser = activeConv.client.username === myUsername
                                        ? activeConv.contractor
                                        : activeConv.client;
                                    navigate("/support/report", {
                                        state: {
                                            reported_user: reportedUser.id,
                                            reported_username: reportedUser.username,
                                            target_model: "project",
                                            target_id: activeConv.project.id,
                                            title: `Issue regarding project: ${activeConv.project.title}`,
                                            report_type: "CHAT"
                                        }
                                    });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1.5"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>
                                Report
                            </button>
                        )}
                    </div>
                    {wsError && <span className="text-xs text-red-500">{wsError}</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
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
                                                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm border",
                                                isMe
                                                    ? "bg-emerald-700 text-white border-emerald-700"
                                                    : "bg-white text-slate-900 border-slate-200"
                                            )}
                                        >
                                            {!isMe && <div className="text-[10px] font-bold opacity-70 mb-1">{m.sender}</div>}
                                            <div className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</div>
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
                            placeholder={activeConv ? "Type your message here..." : "Select a chat first..."}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                            disabled={!connected}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") sendMessage();
                            }}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!connected || !input.trim()}
                            className="rounded-xl bg-emerald-700 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors shadow-sm"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
