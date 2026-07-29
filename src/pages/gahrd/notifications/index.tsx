import { useState, useEffect } from 'react';
import { Layout, Icon } from '@/components/layout/RoleLayout';

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

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NTF-001',
    category: 'assignment',
    priority: 'CRITICAL',
    title: 'Driver Assignment Overdue',
    description: 'Request REQ-0021 has been pending driver assignment for more than 2 hours. Immediate action required.',
    time: '5 mins ago',
    unread: true,
    requestId: 'REQ-0021',
  },
  {
    id: 'NTF-002',
    category: 'schedule',
    priority: 'URGENT',
    title: 'Schedule Conflict Detected',
    description: 'Driver John Doe is double-booked for Oct 28 at 14:30. Please resolve the conflict immediately.',
    time: '15 mins ago',
    unread: true,
    driverId: 'DRV-001',
  },
  {
    id: 'NTF-003',
    category: 'assignment',
    priority: 'IMPORTANT',
    title: 'New Vehicle Request Submitted',
    description: 'Andi Sullivan from Engineering submitted a new vehicle request for Soekarno-Hatta Airport pickup.',
    time: '30 mins ago',
    unread: true,
    requestId: 'REQ-0022',
  },
  {
    id: 'NTF-004',
    category: 'schedule',
    priority: 'NORMAL',
    title: 'Trip Completed Successfully',
    description: 'Driver Michael Chen successfully completed the trip to Tech Park Building B for Sarah Johnson.',
    time: '1 hour ago',
    unread: false,
    driverId: 'DRV-002',
  },
  {
    id: 'NTF-005',
    category: 'schedule',
    priority: 'IMPORTANT',
    title: 'Vehicle Maintenance Reminder',
    description: 'Toyota Camry (B-1234-XYZ) is due for its scheduled maintenance on Oct 30. Schedule accordingly.',
    time: '2 hours ago',
    unread: false,
  },
];

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

function NotifCard({ item, onMarkAsRead, onDelete }: {
  item: NotificationItem;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
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
            <span className="text-[10px] text-[#94a3b8] font-bold font-mono">Req: {item.requestId}</span>
          )}
          {item.driverId && (
            <span className="text-[10px] text-[#94a3b8] font-bold font-mono">Driver: {item.driverId}</span>
          )}
          <span className="text-[10px] text-[#94a3b8] ml-auto">{item.time}</span>
        </div>
        <h4 className="text-[14px] font-bold text-[#0f172a] mt-1">{item.title}</h4>
        <p className="text-[12px] text-[#64748b] mt-1.5 leading-relaxed">{item.description}</p>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-[#f1f5f9]">
          {item.unread && (
            <button
              onClick={() => onMarkAsRead(item.id)}
              className="text-[12px] font-bold text-[#1e3a8a] hover:underline"
            >
              Mark As Read
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="text-[12px] font-bold text-[#94a3b8] hover:text-[#dc2626] flex items-center gap-1 ml-auto transition-colors"
          >
            <Icon name="delete" className="text-[14px]" />
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const GAHRD_NOTIFS_KEY = 'ovms_gahrd_notifications';

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const stored = localStorage.getItem(GAHRD_NOTIFS_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return SAMPLE_NOTIFICATIONS;
  });

  const saveNotifications = (newNotifs: NotificationItem[]) => {
    setNotifications(newNotifs);
    localStorage.setItem(GAHRD_NOTIFS_KEY, JSON.stringify(newNotifs));
    // Signal Topbar to immediately re-check unread count
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

  // Auto-mark all as read when user opens the notifications page (like WhatsApp/Gmail)
  useEffect(() => {
    const stored = localStorage.getItem(GAHRD_NOTIFS_KEY);
    if (stored) {
      try {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.some((n: NotificationItem) => n.unread)) {
          const updated = list.map((n: NotificationItem) => ({ ...n, unread: false }));
          localStorage.setItem(GAHRD_NOTIFS_KEY, JSON.stringify(updated));
          setNotifications(updated);
          window.dispatchEvent(new CustomEvent('ovms-notif-read'));
        }
      } catch {}
    } else {
      // First time: save sample data as all-read and signal Topbar
      const updated = SAMPLE_NOTIFICATIONS.map(n => ({ ...n, unread: false }));
      localStorage.setItem(GAHRD_NOTIFS_KEY, JSON.stringify(updated));
      setNotifications(updated);
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            <p className="text-[14px] text-[#64748b] mt-1">Monitor fleet alerts, schedule conflicts, and emergency vehicle maintenance.</p>
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
            <button
              onClick={() => alert('Exporting logs...')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e3a8a] text-white rounded-xl text-[12px] font-bold hover:bg-[#1e40af] transition-all"
            >
              <Icon name="download" className="text-[16px]" />
              Export Logs
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-7">
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Unread</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Total {notifications.length}</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#1e3a8a] mt-1">{String(unreadCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] border-l-4 border-l-[#dc2626] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#dc2626] font-bold leading-tight">Urgent Alerts</p>
              <span className="text-[9px] sm:text-[10px] text-white font-black bg-[#dc2626] px-1.5 py-0.5 rounded self-start shrink-0 animate-pulse">Urgent</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#dc2626] mt-1">{String(urgentCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Schedule Updates</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Last 24h</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#0369a1] mt-1">{String(scheduleCount).padStart(2, '0')}</h3>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
              <p className="text-[11px] sm:text-[12px] text-[#64748b] font-bold leading-tight">Driver Assignments</p>
              <span className="text-[9px] sm:text-[10px] text-[#94a3b8] font-semibold bg-[#f1f5f9] px-1.5 py-0.5 rounded self-start shrink-0">Active Trips</span>
            </div>
            <h3 className="text-[26px] sm:text-[32px] font-black text-[#475569] mt-1">{String(assignCount).padStart(2, '0')}</h3>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Left: notifications list */}
          <div className="space-y-5">
            {/* Filter + sort bar */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-2 flex items-center gap-1.5 max-w-full overflow-x-auto scrollbar-none">
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
            {sorted.length === 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center text-center">
                <Icon name="notifications_off" className="text-[48px] text-[#e2e8f0] mb-3" />
                <p className="font-bold text-[#475569]">No Notifications</p>
                <p className="text-[12px] text-[#94a3b8] mt-1 max-w-xs">No records match current filter. Try changing it.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map(item => (
                  <NotifCard
                    key={item.id}
                    item={item}
                    onMarkAsRead={markRead}
                    onDelete={deleteNotif}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Insights + Live Status */}
          <div className="space-y-5">
            {/* Insights Panel */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-2">
                <Icon name="trending_up" className="text-[18px] text-[#1e3a8a]" />
                <h3 className="font-bold text-[#0f172a] text-[13px] uppercase tracking-wider">Operational Insights</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-[#fef2f2] p-3.5 rounded-xl border border-[#fecaca] flex gap-3">
                  <Icon name="warning" className="text-[20px] text-[#dc2626] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[12px] font-bold text-[#dc2626]">Delayed Trips Spike</h4>
                    <p className="text-[11px] text-[#64748b] mt-1">Heavy rain in West Jakarta area causing 22% slowdown in delivery speed.</p>
                  </div>
                </div>
                <div className="bg-[#f0fdf4] p-3.5 rounded-xl border border-[#bbf7d0] flex gap-3">
                  <Icon name="check_circle" className="text-[20px] text-[#16a34a] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[12px] font-bold text-[#16a34a]">Safe Capacity</h4>
                    <p className="text-[11px] text-[#64748b] mt-1">SUV and Sedan driver availability is sufficient to handle remaining scheduled requests today.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Status */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="radio_button_checked" className="text-[18px] text-[#16a34a] animate-pulse" />
                  <h3 className="font-bold text-[#0f172a] text-[13px] uppercase tracking-wider">Live Status Tracker</h3>
                </div>
                <span className="w-2 h-2 bg-[#16a34a] rounded-full" />
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-[#64748b]">Active Transit Load</span>
                    <span className="font-bold text-[#0f172a]">68% Capacity</span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] rounded-full h-2">
                    <div className="bg-[#1e3a8a] h-2 rounded-full" style={{ width: '68%' }} />
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-3">Real-time GPS Logs</h4>
                  <div className="space-y-3 border-l-2 border-[#e2e8f0] pl-4 ml-1.5">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#1e3a8a]" />
                      <p className="text-[12px] font-bold text-[#0f172a]">SUV B-1029-SJD</p>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">Departed from Cengkareng logistics hub</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#cbd5e1]" />
                      <p className="text-[12px] font-semibold text-[#475569]">Sedan B-402-ZXL</p>
                      <p className="text-[10px] text-[#94a3b8] mt-0.5">Arrived at Kemang Head Office</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
