import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useNotifications from "../utils/useNotifications";

const TYPE_STYLES = {
  BID:      { bg: "bg-blue-100",   text: "text-blue-700",   dot: "bg-blue-500"    },
  PAYMENT:  { bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"   },
  CHAT:     { bg: "bg-purple-100", text: "text-purple-700", dot: "bg-purple-500"  },
  ISSUE:    { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"     },
  PROGRESS: { bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-500"   },
  SYSTEM:   { bg: "bg-slate-100",  text: "text-slate-700",  dot: "bg-slate-400"   },
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const btnRef   = useRef(null);
  const navigate  = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  } = useNotifications(30000);

  // fetch full list when panel opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // close on click-outside
  useEffect(() => {
    function handler(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        btnRef.current   && !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleNotificationClick(n) {
    if (!n.is_read) markRead(n.id);

    // Override redirect for PROGRESS type notifications
    if (n.type === "PROGRESS") {
      setOpen(false);
      const role = localStorage.getItem("role")?.toLowerCase();
      if (role === "client") {
        navigate("/clientdashboard?menu=monitoring");
      } else if (role === "contractor") {
        navigate("/contractor?menu=manage-tasks");
      } else if (role === "worker") {
        navigate("/worker/dashboard?menu=project-progress");
      }
      return;
    }

    // Redirect "New Project Available" to Available Projects for contractors
    if (n.title === "New Project Available") {
      setOpen(false);
      const role = localStorage.getItem("role")?.toLowerCase();
      if (role === "contractor") {
        navigate("/contractor?menu=projects");
        return;
      }
    }

    // Redirect BID type notifications to My Bids for contractors
    if (n.type === "BID") {
      const role = localStorage.getItem("role")?.toLowerCase();
      if (role === "contractor") {
        setOpen(false);
        navigate("/contractor?menu=bids");
        return;
      }
    }

    // Redirect Task Assigned to My Tasks for workers
    if (n.title === "Task Assigned") {
      const role = localStorage.getItem("role")?.toLowerCase();
      if (role === "worker") {
        setOpen(false);
        navigate("/worker/dashboard?menu=mytasks");
        return;
      }
    }

    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  }

  const style = (type) => TYPE_STYLES[type] ?? TYPE_STYLES.SYSTEM;

  return (
    <div className="relative">
      {/*Bell button*/}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-label="Notifications"
      >
        {/* Bell SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel*/}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 mt-2 w-96 max-h-[520px] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 overflow-hidden"
          style={{ animation: "fadeSlide 0.18s ease" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-700 to-emerald-600">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-semibold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs text-white font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-emerald-100 hover:text-white transition font-medium underline underline-offset-2"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No notifications yet.</p>
              </div>
            )}

            {!loading && notifications.map((n) => {
              const s = style(n.type);
              return (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex gap-3 px-4 py-3.5 cursor-pointer transition hover:bg-slate-50 ${!n.is_read ? "bg-emerald-50/40" : ""}`}
                >
                  {/* Unread dot */}
                  {!n.is_read && (
                    <span className={`absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full ${s.dot} shadow-sm`} />
                  )}

                  {/* Type badge */}
                  <div className={`flex-shrink-0 mt-0.5 rounded-lg h-9 w-9 flex items-center justify-center ${s.bg}`}>
                    <NotifIcon type={n.type} className={`h-4 w-4 ${s.text}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${n.is_read ? "text-slate-600" : "text-slate-900"}`}>
                      {n.title}
                    </p>
                    {n.message && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Delete button — appears on hover */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 self-start p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                    title="Dismiss"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2.5 text-center bg-slate-50/80">
              <span className="text-xs text-slate-400">
                Showing latest {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Inline keyframes for the panel animation */}
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// per-type icon 
function NotifIcon({ type, className }) {
  const paths = {
    BID: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    PAYMENT: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    CHAT: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    ISSUE: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    PROGRESS: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    SYSTEM: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] ?? paths.SYSTEM} />
    </svg>
  );
}
