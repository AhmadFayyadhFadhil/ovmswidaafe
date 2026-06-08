import { useState } from "react";
import {
  Bell,
  CheckCircle,
  X,
  MailOpen,
} from "lucide-react";
import type { SystemNotification } from "@/types";
import { Layout } from "@/components/layout/RoleLayout";

interface NotificationProps {
  notifications?: SystemNotification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (id: string) => void;
  onNavigate?: (p: string) => void;
}

const MOCK_NOTIFICATIONS: SystemNotification[] = [
  {
    id: '1',
    title: 'New Request Approval Required',
    description: 'A new fleet request from Sales department is pending approval',
    timeAgo: '2 minutes ago',
    severity: 'high',
    category: 'Approvals',
    isRead: false,
  },
  {
    id: '2',
    title: 'Vehicle Maintenance Alert',
    description: 'Toyota Avanza (ID: VEH-001) is due for maintenance',
    timeAgo: '1 hour ago',
    severity: 'medium',
    category: 'Operational',
    isRead: true,
  },
];

export default function Notification({
  notifications = MOCK_NOTIFICATIONS,
  onMarkAsRead = () => {},
  onMarkAllAsRead = () => {},
  onDeleteNotification = () => {},
  onNavigate
}: NotificationProps) {
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
      searchPlaceholder="Search notifications..."
    >
      <div className="max-w-4xl mx-auto p-6 space-y-6 animate-in fade-in duration-200">
        {/* Search Header Banner */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2 bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
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
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-bold text-[#00236f] hover:underline cursor-pointer"
          >
            <MailOpen className="w-4 h-4" /> Mark All as Read
          </button>
        </div>

        {/* Notifications list */}
        <div className="space-y-4">
          {filteredNotifications.map((not) => (
            <div
              key={not.id}
              className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                not.isRead ? "bg-white border-slate-100 opacity-70" : "bg-white border-[#cbdbf5] ring-1 ring-blue-50"
              }`}
            >
              {/* Category icon */}
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  not.severity === "critical"
                    ? "bg-rose-50 text-rose-700"
                    : not.severity === "high"
                    ? "bg-rose-50 text-rose-600"
                    : not.severity === "medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>

              {/* Notification Information details */}
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">
                      {not.title}
                    </span>
                    <span
                      className={`px-2 py-0.2 rounded-full text-[9px] font-bold border whitespace-nowrap uppercase ${
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
                {!not.isRead && (
                  <button
                    onClick={() => onMarkAsRead(not.id)}
                    className="bg-[#00236f]/10 text-[#00236f] hover:bg-[#00236f] hover:text-white p-1.5 rounded-lg text-xs font-bold font-mono transition-colors cursor-pointer"
                    title="Mark as Read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteNotification(not.id)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredNotifications.length === 0 && (
            <div className="bg-slate-50 p-12 text-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 font-bold">
              No system notifications match the "{activeCategoryFilter}" criteria.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
