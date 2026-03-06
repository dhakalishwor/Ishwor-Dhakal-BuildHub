import { useState, useEffect, useCallback, useRef } from "react";
import api from "../API/axios";

/**
 * useNotifications —polls the backend for unread count and fetches
 * the latest notifications on demand.
 *
 * @param {number} pollIntervalMs  How often to refresh unread count (default 30 s)
 */
export default function useNotifications(pollIntervalMs = 30000) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  //  fetch unread count (lightweight) 
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications/unread-count/");
      setUnreadCount(data.unread ?? 0);
    } catch {
      // silently ignore — user might not yet be logged in
    }
  }, []);

  //  fetch full notification list 
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/api/notifications/");
      setNotifications(data.results ?? data); // handle paginated or plain list
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  // mark single notification as read 
  const markRead = useCallback(async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }, []);

  //  mark all as read 
  const markAllRead = useCallback(async () => {
    try {
      await api.patch("/api/notifications/read-all/");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  //  delete a notification 
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/api/notifications/${id}/`);
      setNotifications((prev) => {
        const removed = prev.find((n) => n.id === id);
        if (removed && !removed.is_read) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch {
      // ignore
    }
  }, []);

  //  start polling on mount 
  useEffect(() => {
    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, pollIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [fetchUnreadCount, pollIntervalMs]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
    deleteNotification,
  };
}
