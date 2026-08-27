import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle,
  Trash2,
  CheckCheck,
  Inbox,
  Clock,
  Car,
  ShieldCheck,
  FileCheck,
  ExternalLink
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

type FilterTab = "all" | "unread" | "read";

/**
 * NotificationCenter — Modern, Mobile-First Responsive Notification Hub.
 */
export default function Notification({
  notifications: propNotifications,
  onMarkAsRead: propOnMarkAsRead,
  onMarkAllAsRead: propOnMarkAllAsRead,
  onDeleteNotification: propOnDeleteNotification,
  onNavigate
}: NotificationProps) {
  const navigate = useNavigate();
  const [internalNotifs, setInternalNotifs] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  /**
   * Load notifications from backend API with SWR Silent Polling (Zero Flickering).
   */
  const loadNotifications = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const res = await notificationService.getAll();
      if (res.data && Array.isArray(res.data)) {
        setInternalNotifs(res.data);
      } else {
        setInternalNotifs([]);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
      if (isInitial) setInternalNotifs([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.removeItem(DELETED_KEY);
      localStorage.removeItem(READ_KEY);
    } catch {}

    loadNotifications(true).then(() => {
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    });

    const interval = setInterval(() => loadNotifications(false), 15000);
    const handleFocus = () => loadNotifications(false);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const baseNotifications = propNotifications || internalNotifs;

  const notifications = useMemo(() => {
    return baseNotifications;
  }, [baseNotifications, internalNotifs]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const readCount = useMemo(() => {
    return notifications.filter(n => n.isRead).length;
  }, [notifications]);

  /**
   * Mark single notification as read.
   */
  const handleMarkAsRead = async (id: string) => {
    if (propOnMarkAsRead) propOnMarkAsRead(id);

    const stringId = String(id);
    setInternalNotifs(prev => prev.map(n => String(n.id) === stringId ? { ...n, isRead: true } : n));
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    try {
      await notificationService.markAsRead(stringId);
    } catch (err) {
      console.error("API markAsRead error:", err);
    }
  };

  /**
   * Mark all notifications as read.
   */
  const handleMarkAllAsRead = async () => {
    if (propOnMarkAllAsRead) propOnMarkAllAsRead();

    const allIds = notifications.map(n => String(n.id));
    setInternalNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));

    try {
      await notificationService.markAllAsRead(allIds);
    } catch (err) {
      console.error("API markAllAsRead error:", err);
    }
  };

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: "all" | "single";
    id?: string;
    title?: string;
  }>({
    isOpen: false,
    type: "all",
  });

  /**
   * Delete single notification handler (triggers modal).
   */
  const handleDeleteSingleClick = (id: string, title?: string) => {
    setDeleteModal({
      isOpen: true,
      type: "single",
      id: String(id),
      title: title || "Notifikasi",
    });
  };

  /**
   * Delete all notifications handler (triggers modal).
   */
  const handleDeleteAllClick = () => {
    if (notifications.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: "all",
    });
  };

  /**
   * Confirmed execution of deletion.
   */
  const handleConfirmDelete = async () => {
    if (deleteModal.type === "all") {
      const allIds = notifications.map(n => String(n.id));
      setInternalNotifs([]);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      setDeleteModal({ isOpen: false, type: "all" });

      try {
        await notificationService.deleteAllNotifications(allIds);
      } catch (err) {
        console.error("API deleteAllNotifications error:", err);
      }
    } else if (deleteModal.id) {
      const stringId = deleteModal.id;
      if (propOnDeleteNotification) propOnDeleteNotification(stringId);
      setInternalNotifs(prev => prev.filter(n => String(n.id) !== stringId));
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
      setDeleteModal({ isOpen: false, type: "all" });

      try {
        await notificationService.deleteNotification(stringId);
      } catch (err) {
        console.error("API delete notification error:", err);
      }
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((not) => {
      if (activeFilter === "unread") return !not.isRead;
      if (activeFilter === "read") return not.isRead;
      return true;
    });
  }, [notifications, activeFilter]);

  const getCategoryIcon = (category?: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("operational") || cat.includes("armada") || cat.includes("driver")) {
      return <Car className="w-4 h-4" />;
    }
    if (cat.includes("approval") || cat.includes("persetujuan")) {
      return <FileCheck className="w-4 h-4" />;
    }
    if (cat.includes("security")) {
      return <ShieldCheck className="w-4 h-4" />;
    }
    return <Bell className="w-4 h-4" />;
  };

  return (
    <Layout
      activeNav="Notifications"
      onNavigate={onNavigate}
      topbarTitle="Notifikasi"
      searchPlaceholder="Cari notifikasi..."
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 animate-in fade-in duration-200">
        {/* Top Control Bar: Simplified Filter Tabs + Actions */}
        <div data-guide="notification-center" className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* User-Centric Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveFilter("all")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-white text-[#1e3a8a] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Semua</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === "all" ? "bg-blue-100 text-[#1e3a8a]" : "bg-slate-200 text-slate-600"
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveFilter("unread")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "unread"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveFilter("read")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "read"
                  ? "bg-white text-slate-800 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Sudah Dibaca</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeFilter === "read" ? "bg-slate-200 text-slate-700" : "bg-slate-200 text-slate-600"
              }`}>
                {readCount}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-bold text-[#1e3a8a] bg-blue-50/80 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-all cursor-pointer border border-blue-100 shadow-2xs"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Semua Dibaca</span>
            </button>

            <button
              onClick={handleDeleteAllClick}
              disabled={notifications.length === 0}
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed px-3 py-2 rounded-xl transition-all cursor-pointer border border-rose-200 shadow-2xs"
              title="Hapus Semua Notifikasi"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Semua</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-xs text-slate-500 font-semibold shadow-xs">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a] mb-3"></div>
            <p>Memuat notifikasi sistem...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {activeFilter === "unread" ? "Tidak Ada Notifikasi Baru" : "Tidak Ada Notifikasi"}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeFilter === "unread"
                ? "Semua notifikasi Anda sudah dibaca."
                : "Belum ada riwayat notifikasi pada kategori ini."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-3.5">
            {filteredNotifications.map((not) => {
              const isUrgent = not.severity === "critical" || not.severity === "high";

              return (
                <div
                  key={not.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    not.isRead
                      ? "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                      : "bg-blue-50/50 border-blue-200/90 ring-1 ring-blue-200/60 shadow-xs"
                  }`}
                >
                  {/* Card Content: Responsive Mobile & Desktop */}
                  <div className="flex flex-col gap-3">
                    {/* Top Row: Icon + Title & Badges + Timestamp */}
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div
                        className={`p-2.5 rounded-xl shrink-0 flex items-center justify-center ${
                          not.isRead
                            ? "bg-slate-100 text-slate-500"
                            : isUrgent
                            ? "bg-rose-100 text-rose-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {getCategoryIcon(not.category)}
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!not.isRead && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shrink-0" title="Belum Dibaca" />
                            )}
                            <h4 className={`text-xs sm:text-sm leading-snug ${
                              not.isRead ? "font-semibold text-slate-800" : "font-bold text-slate-900"
                            }`}>
                              {not.title}
                            </h4>
                          </div>

                          {/* Time Ago on Desktop / Top Right */}
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-400 font-medium shrink-0">
                            <Clock className="w-3 h-3 hidden sm:inline" />
                            <span>{not.timeAgo}</span>
                          </div>
                        </div>

                        {/* Status Badges Row */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              not.isRead
                                ? "bg-slate-100 text-slate-500 border-slate-200"
                                : "bg-blue-600 text-white border-blue-600 shadow-2xs"
                            }`}
                          >
                            {not.isRead ? "Sudah Dibaca" : "Belum Dibaca"}
                          </span>

                          {not.category && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                              {not.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Full-Width Clean Description */}
                    <div className="pl-0 sm:pl-12">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                        {not.description}
                      </p>

                      {not.metadata && (
                        <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1">
                          <span>Target:</span>
                          <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{not.metadata}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons: Full Width on Mobile, Inline on Desktop */}
                    <div className="flex items-center justify-end gap-2 pt-2.5 sm:pt-1 border-t border-slate-100 sm:border-0 pl-0 sm:pl-12">
                      {not.actionUrl && (
                        <button
                          onClick={() => {
                            if (!not.isRead) handleMarkAsRead(not.id);
                            navigate(not.actionUrl!);
                          }}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          <span>Lihat Tiket</span>
                        </button>
                      )}

                      {!not.isRead ? (
                        <button
                          onClick={() => handleMarkAsRead(not.id)}
                          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Tandai Dibaca</span>
                        </button>
                      ) : (
                        <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-400 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200/60">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          <span>Sudah Dibaca</span>
                        </span>
                      )}

                      <button
                        onClick={() => handleDeleteSingleClick(not.id, not.title)}
                        className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-rose-200 shadow-2xs cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Confirmation Modal Dialog for Deleting Notifications */}
        {deleteModal.isOpen && (
          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
            onClick={() => setDeleteModal({ isOpen: false, type: "all" })}
          >
            <div 
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 text-center relative overflow-hidden animate-in zoom-in-95 duration-150 space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Close X Button */}
              <button
                onClick={() => setDeleteModal({ isOpen: false, type: "all" })}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>

              {/* Top Graphic / Icon */}
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/60 shadow-inner">
                <Trash2 className="w-8 h-8 text-rose-600" />
              </div>

              {/* Text Info */}
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  {deleteModal.type === "all" ? "Hapus Semua Notifikasi?" : "Hapus Notifikasi?"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                  {deleteModal.type === "all"
                    ? `Seluruh riwayat notifikasi Anda (${notifications.length} notifikasi) akan dihapus secara permanen dari sistem. Tindakan ini tidak dapat dibatalkan.`
                    : `Notifikasi "${deleteModal.title || 'ini'}" akan dihapus dari daftar notifikasi Anda.`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModal({ isOpen: false, type: "all" })}
                  className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl transition-all cursor-pointer active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-rose-600/25 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleteModal.type === "all" ? "Ya, Hapus Semua" : "Ya, Hapus"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
