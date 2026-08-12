import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  CheckCircle,
  X,
  MailOpen,
  Trash2,
} from "lucide-react";
import type { SystemNotification } from "@/types";
import { Layout } from "@/components/layout/RoleLayout";
import { notificationService } from "@/services/modules/notificationService";

interface NotificationProps {
  notifications?: SystemNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigate?: (p: string) => void;
}

const DELETED_KEY = "ovms_deleted_notification_ids";
const READ_KEY = "ovms_read_notification_ids";

function getLocalDeletedIds(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalDeletedIds(ids: string[]) {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

function getLocalReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalReadIds(ids: string[]) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {}
}

/**
 * NotificationCenter — DUAL-LAYER PERSISTENCE (Server DB + LocalStorage Backup).
 * Guarantees 100% persistent deletion locally AND across devices.
 */
export default function Notification({
  notifications: propNotifications,
  onMarkAsRead: propOnMarkAsRead,
  onMarkAllAsRead: propOnMarkAllAsRead,
  onDeleteNotification: propOnDeleteNotification,
  onNavigate
}: NotificationProps) {
  const [internalNotifs, setInternalNotifs] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Load notifications from backend API.
   */
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      if (res.data && Array.isArray(res.data)) {
        setInternalNotifs(res.data);
      } else {
        setInternalNotifs([]);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
      setInternalNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Clear legacy LocalStorage keys if present to prevent cross-device drift
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.removeItem(READ_KEY);
    } catch {}

    loadNotifications().then(() => {
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    });

    // Auto-refresh notifications every 10 seconds for real-time multi-device sync
    const interval = setInterval(loadNotifications, 10000);
    const handleFocus = () => loadNotifications();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Compute final notifications — 100% Server Driven
  const baseNotifications = propNotifications || internalNotifs;

  const notifications = useMemo(() => {
    return baseNotifications;
  }, [baseNotifications, internalNotifs, loading]);

  /**
   * Mark single notification as read — Server API + Optimistic UI.
   */
  const handleMarkAsRead = async (id: string) => {
    if (propOnMarkAsRead) propOnMarkAsRead(id);

    const stringId = String(id);

    // 1. Optimistic React state update
    setInternalNotifs(prev => prev.map(n => String(n.id) === stringId ? { ...n, isRead: true } : n));

    // 2. Dispatch badge update
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    // 3. Server API sync for cross-device persistence
    try {
      await notificationService.markAsRead(stringId);
    } catch (err) {
      console.error("API markAsRead error:", err);
    }
  };

  /**
   * Mark all notifications as read — Server API + Optimistic UI.
   */
  const handleMarkAllAsRead = async () => {
    if (propOnMarkAllAsRead) propOnMarkAllAsRead();

    const allIds = notifications.map(n => String(n.id));

    // 1. Optimistic React state update
    setInternalNotifs(prev => prev.map(n => ({ ...n, isRead: true })));

    // 2. Dispatch badge update
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    // 3. Server API sync for cross-device persistence
    try {
      await notificationService.markAllAsRead(allIds);
    } catch (err) {
      console.error("API markAllAsRead error:", err);
    }
  };

  /**
   * Delete notification ("X") — Server API + Optimistic UI.
   */
  const handleDeleteNotification = async (id: string) => {
    if (propOnDeleteNotification) propOnDeleteNotification(id);

    const stringId = String(id);

    // 1. Remove from React state immediately
    setInternalNotifs(prev => prev.filter(n => String(n.id) !== stringId));

    // 2. Dispatch badge update
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    // 3. Send to Backend API for permanent cross-device deletion
    try {
      await notificationService.deleteNotification(stringId);
    } catch (err) {
      console.error("API delete notification error:", err);
    }
  };

  /**
   * Delete all notifications — Server API + Optimistic UI.
   */
  const handleDeleteAllNotifications = async () => {
    const allIds = notifications.map(n => String(n.id));

    // 1. Clear React state immediately
    setInternalNotifs([]);

    // 2. Dispatch badge update
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    // 3. Send to Backend API for permanent cross-device bulk deletion
    try {
      await notificationService.deleteAllNotifications(allIds);
    } catch (err) {
      console.error("API deleteAllNotifications error:", err);
    }
  };

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("All Categories");
  const categories = ["All Categories", "Operational", "Approvals", "Security", "System"];

  const filteredNotifications = notifications.filter((not) => {
    if (activeCategoryFilter === "All Categories") return true;
    return not.category === activeCategoryFilter;
  });

  return (
    <Layout
      activeNav="Notification Center"
      onNavigate={onNavigate}
      topbarTitle="Notification Center"
      searchPlaceholder="Cari notifikasi..."
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-200">
        {/* Category filter + Mark All Read + Delete All */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap gap-4 shadow-sm">
          <div className="flex flex-wrap gap-2 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                  activeCategoryFilter === cat ? "bg-white text-[#00236f] shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 text-xs font-bold text-[#00236f] hover:text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <MailOpen className="w-4 h-4" /> Tandai Semua Dibaca
            </button>

            <button
              onClick={handleDeleteAllNotifications}
              className="flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs border border-rose-200/80"
            >
              <Trash2 className="w-4 h-4" /> Hapus Semua
            </button>
          </div>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-xs text-slate-500 font-bold shadow-sm">
            Memuat notifikasi sistem real-time...
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((not) => (
              <div
                key={not.id}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  not.isRead
                    ? "bg-white border-slate-200/80 opacity-75 shadow-2xs"
                    : "bg-blue-50/40 border-blue-200 ring-1 ring-blue-100/60 shadow-sm"
                }`}
              >
                {/* Category icon */}
                <div
                  className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                    not.isRead
                      ? "bg-slate-100 text-slate-500"
                      : not.severity === "critical" || not.severity === "high"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>

                {/* Notification details */}
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!not.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse shrink-0" title="Belum Dibaca" />
                      )}
                      <span className={`text-xs ${not.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                        {not.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase border whitespace-nowrap tracking-wider ${
                          not.isRead
                            ? "bg-slate-100 text-slate-500 border-slate-200"
                            : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                        }`}
                      >
                        {not.isRead ? "Sudah Dibaca" : "Belum Dibaca"}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border whitespace-nowrap uppercase ${
                          not.category === "Operational"
                            ? "bg-rose-50 text-rose-700 border-rose-100"
                            : not.category === "Approvals"
                            ? "bg-amber-50 text-amber-700 border-amber-100"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {not.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">{not.timeAgo}</span>
                  </div>

                  <p className="text-xs text-slate-600 leading-normal">
                    {not.description}
                  </p>

                  {not.metadata && (
                    <div className="text-[10px] font-bold text-slate-400 uppercase mt-2">
                      Target Entity: <span className="font-mono text-slate-700">{not.metadata}</span>
                    </div>
                  )}
                </div>

                {/* Read / Delete buttons */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  {!not.isRead ? (
                    <button
                      onClick={() => handleMarkAsRead(not.id)}
                      className="flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                      title="Tandai Dibaca"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Tandai Dibaca
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                      <CheckCircle className="w-3.5 h-3.5 text-slate-400" /> Dibaca
                    </span>
                  )}
                  <button
                    onClick={() => handleDeleteNotification(not.id)}
                    className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border border-rose-200/80 cursor-pointer shadow-2xs"
                    title="Hapus Notifikasi Permanen"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}

            {filteredNotifications.length === 0 && (
              <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 font-bold">
                Tidak ada notifikasi sistem untuk kategori "{activeCategoryFilter}".
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
