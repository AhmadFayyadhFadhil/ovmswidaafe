import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  X,
  MailOpen,
} from "lucide-react";
import type { SystemNotification } from "@/types";
import { Layout } from "@/components/layout/RoleLayout";
import { requestService } from "@/services/modules/requestService";

interface NotificationProps {
  notifications?: SystemNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigate?: (p: string) => void;
}

export default function Notification({
  notifications: propNotifications,
  onMarkAsRead: propOnMarkAsRead,
  onMarkAllAsRead: propOnMarkAllAsRead,
  onDeleteNotification: propOnDeleteNotification,
  onNavigate
}: NotificationProps) {
  const READ_NOTIFS_KEY = "ovms_read_notification_ids";
  const [internalNotifs, setInternalNotifs] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const getReadIds = (): string[] => {
    try {
      const raw = localStorage.getItem(READ_NOTIFS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveReadIds = (ids: string[]) => {
    try {
      localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(Array.from(new Set(ids))));
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    } catch (err) {
      console.error(err);
    }
  };

  const loadRealNotifs = async () => {
    setLoading(true);
    try {
      const res = await requestService.getAll({ per_page: 1000 });
      const list = res.data || [];
      const readIds = getReadIds();

      const realNotifs: SystemNotification[] = list.map(r => ({
        id: String(r.id),
        title: `Pengajuan Armada #${r.id} (${r.employee || 'User'})`,
        description: `Perjalanan dinas ke ${r.destination || 'Tujuan'} tanggal ${r.date}. Status: ${r.status}.`,
        timeAgo: r.date || 'Terbaru',
        severity: r.status === 'PENDING' ? 'high' : (r.status === 'ONGOING' ? 'medium' : 'low'),
        category: r.status === 'PENDING' ? 'Approvals' : 'Operational',
        isRead: readIds.includes(String(r.id)),
        metadata: `Req ID: #${r.id}`,
      }));

      setInternalNotifs(realNotifs);
    } catch (err) {
      console.error("Failed to load admin notifications", err);
      setInternalNotifs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealNotifs().then(() => {
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    });
  }, []);

  const notifications = propNotifications || internalNotifs;

  const handleMarkAsRead = (id: string) => {
    if (propOnMarkAsRead) {
      propOnMarkAsRead(id);
    }
    const currentRead = getReadIds();
    const nextRead = [...currentRead, String(id)];
    saveReadIds(nextRead);
    setInternalNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = () => {
    if (propOnMarkAllAsRead) {
      propOnMarkAllAsRead();
    }
    const allIds = notifications.map(n => String(n.id));
    const currentRead = getReadIds();
    const nextRead = [...currentRead, ...allIds];
    saveReadIds(nextRead);
    setInternalNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = (id: string) => {
    if (propOnDeleteNotification) {
      propOnDeleteNotification(id);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    } else {
      setInternalNotifs(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
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
        {/* Search Header Banner */}
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

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00236f] hover:text-[#1e3a8a] bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
          >
            <MailOpen className="w-4 h-4" /> Tandai Semua Dibaca
          </button>
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

                {/* Notification Information details */}
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

                {/* Read / Delete Operations */}
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
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Hapus Notifikasi"
                  >
                    <X className="w-4 h-4" />
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
