// src/pages/employee/notifications/index.tsx
import { useState } from "react";
import { Layout as RoleLayout } from "../../../components/layout/RoleLayout";
import { Icon } from "../../../components/ui/Icon";

const TABS = ["All", "Unread", "Assignments", "Schedules", "Approvals", "Announcements"];

interface NotifAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

interface NotifItem {
  id: string;
  type: string;
  typeColor: string;
  typeBg: string;
  typeIcon: string;
  title: string;
  time: string;
  unread: boolean;
  isNew?: boolean;
  body: string;
  action: NotifAction | null;
}

const NOTIFS: NotifItem[] = [
  {
    id: "n1", type: "APPROVAL REQUIRED", typeColor: "text-[#4059aa]", typeBg: "bg-[#e5eeff]", typeIcon: "task_alt",
    title: "Vehicle Request VR-2024-089", time: "2 mins ago", unread: false,
    body: "Fleet Manager David S. has submitted a request for 5 heavy-duty transport vehicles for the Northern Corridor route starting tomorrow at 06:00.",
    action: { label: "View Details", onClick: () => {} },
  },
  {
    id: "n2", type: "DRIVER ASSIGNMENT", typeColor: "text-[#006591]", typeBg: "bg-[#e0f4fe]", typeIcon: "person_add",
    title: "New Driver Assigned: Michael Chen", time: "45 mins ago", unread: true, isNew: true,
    body: "Driver Michael Chen has been assigned to Route Delta-7. Schedule updated in the master log.",
    action: null,
  },
  {
    id: "n3", type: "SCHEDULE UPDATE", typeColor: "text-[#ba1a1a]", typeBg: "bg-[#ffd9d5]", typeIcon: "refresh",
    title: "Route Interruption Alert: South Bypass", time: "2 hours ago", unread: false,
    body: "Construction on South Bypass (Exit 12) is causing 30-minute delays. 14 active trips affected. Automated rerouting suggested.",
    action: { label: "Review Rerouting", primary: true, onClick: () => {} },
  },
  {
    id: "n4", type: "DRIVER ASSIGNMENT", typeColor: "text-[#006591]", typeBg: "bg-[#e0f4fe]", typeIcon: "build",
    title: "Vehicle Maintenance Overdue", time: "45 mins ago", unread: true, isNew: true,
    body: "Truck #442 (Unit K-09) has missed its scheduled 10k mile engine check. Priority: Medium.",
    action: null,
  },
];

const LIVE_ACTIVITY = [
  { dot: "bg-[#0f2a5e]",  title: "Vehicle Selected",   desc: "Truck K-55 for VR-2024-090",      time: "NOW"      },
  { dot: "bg-[#64748b]",  title: "Trip Completed",      desc: "Driver Sam T. arrived at Depo-A", time: "14:22 PM" },
  { dot: "bg-[#64748b]",  title: "Route Optimized",     desc: "System updated Cluster 4 routes", time: "12:05 PM" },
];

interface Props { onNavigate?: (page: string) => void; }

export default function NotificationsPage({ onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState("All");
  const [notifs, setNotifs] = useState<NotifItem[]>(NOTIFS);
  const [search, setSearch] = useState("");

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, unread: false, isNew: false })));

  const filtered = notifs.filter(n => {
    if (activeTab === "Unread")      return n.unread;
    if (activeTab === "Assignments") return n.type.includes("ASSIGNMENT");
    if (activeTab === "Schedules")   return n.type.includes("SCHEDULE");
    if (activeTab === "Approvals")   return n.type.includes("APPROVAL");
    if (activeTab === "Announcements") return false;
    return true;
  }).filter(n => search === "" || n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <RoleLayout
      activeNav="Notifications"
      onNavigate={(p: string) => onNavigate?.(p)}
      topbarTitle="Notification Center"
      userName="Andi Sullivan"
      userRole="Employee"
      searchPlaceholder="Search requests, vehicles..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 animate-fadeup space-y-5">


        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-bold text-[#0f172a]">Notification Center</h2>
            <p className="text-[12.5px] text-[#64748b] mt-0.5">Monitor approvals, operational updates, assignments, schedules, and company activity in real-time.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={markAllRead} className="flex items-center gap-2 h-9 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm transition-colors">
              <Icon name="done_all" className="text-[16px]" />Mark All as Read
            </button>
            <button className="flex items-center gap-2 h-9 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm transition-colors">
              <Icon name="tune" className="text-[16px]" />Filter
            </button>
            <button className="h-9 w-9 bg-[#0f2a5e] text-white rounded-xl flex items-center justify-center hover:bg-[#1e3a8a] transition-colors shadow-sm">
              <Icon name="settings" className="text-[18px]" />
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "mail",          iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]",  value: "12",              label: "Unread Notifications",  bar: "bg-[#00236f]",  barW: "70%" },
            { icon: "pending_actions",iconBg: "bg-[#ffd9d5]",iconColor: "text-[#ba1a1a]",  value: "04", accent: true, label: "Pending Approvals",     bar: "bg-[#ba1a1a]",  barW: "30%" },
            { icon: "event_note",    iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]",  value: "08", accent: true, label: "Schedule Updates",      bar: "bg-[#ba1a1a]",  barW: "50%" },
            { icon: "campaign",      iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]",  value: "02", accent: true, label: "Announcements",         bar: "bg-[#ba1a1a]",  barW: "15%" },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.iconColor} text-[18px]`} />
                </div>
              </div>
              <div className={`text-[26px] font-bold ${c.accent ? "text-[#ba1a1a]" : "text-[#0f172a]"}`}>{c.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">{c.label}</div>
              <div className="mt-2 h-[3px] bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className={`${c.bar} h-full rounded-full`} style={{ width: c.barW }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-2xl w-fit">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all ${
                activeTab === tab ? "bg-[#0f2a5e] text-white shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
              }`}>{tab}</button>
          ))}
        </div>

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Notifications List */}
          <div className="flex-1 min-w-0 space-y-3">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-[#94a3b8] text-[13px]">
                Tidak ada notifikasi untuk kategori ini
              </div>
            ) : (
              filtered.map(n => (
                <div key={n.id} className={`bg-white rounded-2xl border transition-all shadow-sm hover:shadow-md ${n.unread ? "border-l-4 border-l-[#00236f] border-[#e2e8f0]" : "border-[#e2e8f0]"}`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${n.typeBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon name={n.typeIcon} className={`${n.typeColor} text-[18px]`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${n.typeColor}`}>{n.type}</span>
                            {n.isNew && <span className="bg-[#ba1a1a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">NEW</span>}
                          </div>
                          <span className="text-[11px] text-[#94a3b8] flex-shrink-0">{n.time}</span>
                        </div>
                        <div className="text-[13px] font-bold text-[#0f172a]">{n.title}</div>
                        <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">{n.body}</p>
                        {n.action && (
                          <div className="mt-3">
                            <button className={`h-8 px-4 rounded-lg text-[11px] font-bold transition-colors ${
                              n.action.primary
                                ? "bg-[#0f2a5e] text-white hover:bg-[#1e3a8a]"
                                : "border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]"
                            }`}>{n.action.label}</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[240px] flex-shrink-0 space-y-4">
            {/* Live Activity */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <h3 className="text-[13px] font-bold text-[#0f172a] mb-3">Live Activity</h3>
              <div className="space-y-3">
                {LIVE_ACTIVITY.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${item.dot} mt-1.5 flex-shrink-0`} />
                    <div>
                      <div className="text-[12px] font-bold text-[#0f172a]">{item.title}</div>
                      <div className="text-[11px] text-[#64748b]">{item.desc}</div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5 font-semibold">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Today's Throughput */}
            <div className="bg-[#0f2a5e] rounded-2xl p-4 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <Icon name="speed" className="text-[80px] text-white" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#93c5fd] mb-3">Today's Throughput</p>
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <div className="text-[32px] font-bold text-white">142</div>
                  <div className="text-[10px] text-[#93c5fd]">Trips Dispatched</div>
                </div>
                <div>
                  <div className="text-[32px] font-bold text-[#39b8fd]">98%</div>
                  <div className="text-[10px] text-[#93c5fd]">On-Time Arrival</div>
                </div>
              </div>
              <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[12px] font-bold transition-colors border border-white/10">
                Download Daily PDF
              </button>
            </div>

            {/* Policy Update */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <div className="flex items-start gap-2.5 mb-2">
                <Icon name="info" className="text-[#00236f] text-[18px] flex-shrink-0 mt-0.5" />
                <div className="text-[12px] font-bold text-[#0f172a]">Policy Update</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">New overnight parking regulations effective July 1st for all Class A vehicles.</p>
            </div>

            {/* Server Maintenance */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 bg-[#e5eeff] rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon name="groups" className="text-[#00236f] text-[17px]" />
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[#0f172a]">Server Maintenance</div>
                  <p className="text-[11px] text-[#64748b] mt-0.5 leading-snug">Brief downtime scheduled for Sunday at 02:00 AM UTC for security patching.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}