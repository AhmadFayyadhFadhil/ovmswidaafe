import { useState, useEffect } from 'react';
import { Layout, Icon } from '@/components/layout/RoleLayout';
import { requestService } from '@/services/modules/requestService';
import { useNavigate } from 'react-router-dom';

export interface NotificationItem {
  id: string;
  category: 'assignment' | 'schedule';
  priority: 'CRITICAL' | 'URGENT' | 'IMPORTANT' | 'NORMAL';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  requestId?: string;
  driverId?: string;
}

function PriorityBadge({ priority }: { priority: NotificationItem['priority'] }) {
  const cfg: Record<NotificationItem['priority'], string> = {
    CRITICAL:  'bg-[#dc2626] text-white',
    URGENT:    'bg-[#f97316] text-white',
    IMPORTANT: 'bg-[#3b82f6] text-white',
    NORMAL:    'bg-[#f1f5f9] text-[#64748b]',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${cfg[priority]}`}>
      {priority}
    </span>
  );
}

function NotifCard({ item, onMarkAsRead, onDelete, onNavigate }: {
  item: NotificationItem;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: () => void;
}) {
  const isCritical  = item.priority === 'CRITICAL';
  const isUrgent    = item.priority === 'URGENT';
  const accentColor = isCritical ? 'bg-[#dc2626]' : isUrgent ? 'bg-[#f97316]' : item.priority === 'IMPORTANT' ? 'bg-[#3b82f6]' : 'bg-[#94a3b8]';
  const iconBg      = isCritical ? 'bg-[#fef2f2] text-[#dc2626]' : isUrgent ? 'bg-[#fff7ed] text-[#f97316]' : 'bg-[#f1f5f9] text-[#64748b]';

  return (
    <div className={`bg-white border rounded-xl p-5 flex items-start gap-4 transition-all relative overflow-hidden ${
      item.unread ? 'border-[#c7d7f7] bg-[#fafbff]' : 'border-[#e2e8f0] opacity-90'
    } ${isCritical ? 'border-[#fecaca]' : ''}`}>
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`} />

      {/* Icon */}
      <div className={`p-2.5 rounded-full flex-shrink-0 ml-2 ${iconBg}`}>
        <Icon name={isCritical ? 'warning' : isUrgent ? 'priority_high' : 'notifications'} className="text-[20px]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {(item.priority === 'CRITICAL' || item.priority === 'URGENT') && (
            <PriorityBadge priority={item.priority} />
          )}
          {item.requestId && (
            <span className="text-[10px] text-[#94a3b8] font-bold font-mono">Req: #{item.requestId}</span>
          )}
          {item.driverId && (
            <span className="text-[10px] text-[#94a3b8] font-bold font-mono">Driver ID: {item.driverId}</span>
          )}
          <span className="text-[10px] text-[#94a3b8] ml-auto">{item.time}</span>
        </div>
        <h4 className="text-[14px] font-bold text-[#0f172a] mt-1">{item.title}</h4>
        <p className="text-[12px] text-[#64748b] mt-1.5 leading-relaxed">{item.description}</p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#f1f5f9]">
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="text-[12px] font-bold text-[#1e3a8a] hover:underline"
            >
              Lihat Pengajuan
            </button>
          )}
          {item.unread && (
            <button
              onClick={() => onMarkAsRead(item.id)}
              className="text-[12px] font-bold text-[#64748b] hover:underline"
            >
              Tandai Dibaca
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-[12px] font-bold text-[#94a3b8] hover:text-[#dc2626] flex items-center gap-1 ml-auto transition-colors"
          >
            <Icon name="delete" className="text-[14px]" />
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const GAHRD_NOTIFS_KEY = 'ovms_gahrd_notifications';
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRealNotifs = async () => {
    setLoading(true);
    try {
      const res = await requestService.getAll({ per_page: 1000 });
      const list = res.data || [];

      const realNotifs: NotificationItem[] = list.map(r => {
        let category: 'assignment' | 'schedule' = 'assignment';
        let priority: NotificationItem['priority'] = 'NORMAL';
        let title = `Pengajuan #${r.id} (${r.employee || 'Karyawan'})`;
        let description = `Perjalanan dinas ke ${r.destination || 'Tujuan'} tanggal ${r.date}. Status: ${r.status}.`;

        if (r.status === 'PENDING') {
          priority = 'URGENT';
          category = 'assignment';
          title = `Penugasan Driver: Request #${r.id}`;
          description = `Request perjalanan ke ${r.destination || 'Tujuan'} membutuhkan penugasan armada & driver.`;
        } else if (r.status === 'ONGOING') {
          priority = 'IMPORTANT';
          category = 'schedule';
          title = `Perjalanan Aktif: Request #${r.id}`;
          description = `Driver ${r.driverName || 'Driver'} sedang dalam perjalanan membawa penumpang.`;
        } else if (r.status === 'COMPLETED') {
          priority = 'NORMAL';
          category = 'schedule';
          title = `Perjalanan Selesai: Request #${r.id}`;
          description = `Perjalanan dinas ke ${r.destination} telah selesai dilaksanakan.`;
        }

        return {
          id: `gahrd-notif-${r.id}`,
          category,
          priority,
          title,
          description,
          time: r.date || 'Hari ini',
          unread: false,
          requestId: String(r.id),
          driverId: r.driverId ? String(r.driverId) : undefined,
        };
      });

      setNotifications(realNotifs);
    } catch (err) {
      console.error("Failed to load GAHRD notifications", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealNotifs().then(() => {
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    });
  }, []);

  const saveNotifications = (newNotifs: NotificationItem[]) => {
    setNotifications(newNotifs);
    localStorage.setItem(GAHRD_NOTIFS_KEY, JSON.stringify(newNotifs));
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));
  };

  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent' | 'assignment' | 'schedule'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('newest');

  const filtered = notifications.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'unread') return item.unread;
    if (filter === 'urgent') return item.priority === 'CRITICAL' || item.priority === 'URGENT';
    return item.category === filter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      const w: Record<string, number> = { CRITICAL: 4, URGENT: 3, IMPORTANT: 2, NORMAL: 1 };
      return (w[b.priority] || 0) - (w[a.priority] || 0);
    }
    return 0;
  });

  const unreadCount    = notifications.filter(n => n.unread).length;
  const urgentCount    = notifications.filter(n => n.priority === 'CRITICAL' || n.priority === 'URGENT').length;
  const scheduleCount  = notifications.filter(n => n.category === 'schedule').length;
  const assignCount    = notifications.filter(n => n.category === 'assignment').length;

  const markAllRead = () => saveNotifications(notifications.map(n => ({ ...n, unread: false })));
  const markRead    = (id: string) => saveNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
  const deleteNotif = (id: string) => saveNotifications(notifications.filter(n => n.id !== id));

  const FILTERS = [
    { key: 'all',        label: 'All Notifications' },
    { key: 'unread',     label: `Unread (${unreadCount})` },
    { key: 'urgent',     label: `Urgent (${urgentCount})` },
    { key: 'assignment', label: 'Assignments' },
    { key: 'schedule',   label: 'Schedule' },
  ] as const;

  return (
    <Layout
      activeNav="Notifications"
      onNavigate={onNavigate}
      topbarTitle="Notification Center"
      userRole="GA/HRD"
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Operational Notification Center</h2>
            <p className="text-[14px] text-[#64748b] mt-1">Pantau notifikasi penugasan armada, jadwal pengajuan, dan pergerakan armada secara real-time.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] text-[#1e3a8a] hover:bg-[#f1f5f9] rounded-xl text-[12px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="mark_email_read" className="text-[16px]" />
              Mark All As Read
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-7">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Belum Dibaca</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Total {notifications.length}</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#1e3a8a] mt-1">{String(unreadCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] border-l-4 border-l-[#dc2626] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#dc2626] font-bold leading-tight">Mendesak</p>
              <span className="text-[9px] sm:text-[10px] text-white font-black bg-[#dc2626] px-1.5 py-0.5 rounded self-start shrink-0">Urgent</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#dc2626] mt-1">{String(urgentCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Jadwal Perjalanan</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Realtime</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#0369a1] mt-1">{String(scheduleCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Penugasan Driver</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Aktif</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#475569] mt-1">{String(assignCount).padStart(2, '0')}</h3>
          </div>
        </div>

        {/* Filter + sort bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2 flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none mb-4">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap shrink-0 ${
                filter === f.key
                  ? 'bg-[#1e3a8a] text-white'
                  : 'text-[#64748b] hover:bg-[#f1f5f9]'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1.5 px-3">
            <Icon name="sort" className="text-[16px] text-[#94a3b8]" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'newest' | 'priority')}
              className="bg-transparent border-none focus:ring-0 text-[12px] font-bold text-[#475569] outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="priority">Priority Level</option>
            </select>
          </div>
        </div>

        {/* Notif items */}
        {loading ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a] mb-2"></div>
            <p className="text-[13px] text-[#64748b]">Memuat notifikasi real-time...</p>
          </div>
        ) : sorted.length === 0 ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center text-center">
            <Icon name="notifications_off" className="text-[48px] text-[#e2e8f0] mb-3" />
            <p className="font-bold text-[#475569]">Tidak Ada Notifikasi</p>
            <p className="text-[12px] text-[#94a3b8] mt-1 max-w-xs">Belum ada notifikasi terkini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map(item => (
              <NotifCard
                key={item.id}
                item={item}
                onMarkAsRead={markRead}
                onDelete={deleteNotif}
                onNavigate={() => navigate('/gahrd/requests')}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
