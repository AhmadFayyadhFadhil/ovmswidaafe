import { useState, useEffect } from "react";
import { Layout as RoleLayout } from "../../../components/layout/RoleLayout";
import { Icon } from "../../../components/ui/Icon";
import { assignmentService } from "@/services/modules/assignmentService";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/auth/authContext";

const TABS = ["All", "Unread", "New Assignments"];

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

interface ActivityItem {
  dot: string;
  title: string;
  desc: string;
  time: string;
}

interface Props { onNavigate?: (page: string) => void; }

export default function DriverNotificationsPage({ onNavigate }: Props) {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("All");
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const loadRealNotifs = async () => {
    setLoading(true);
    try {
      const res = await assignmentService.getAll();
      const list = res.data || [];

      const assignmentNotifs: NotifItem[] = list
        .map(a => {
          const req = a.request || {};
          const name = req.requested_by?.name || "Staff";
          const dest = req.destination_city && req.destination_place 
            ? `${req.destination_city} - ${req.destination_place}` 
            : req.destination_city || "Tujuan Operasional";
          const dateVal = req.start_time ? req.start_time.split("T")[0] : "Besok";
          
          return {
            id: `assign-${a.id}`,
            type: "NEW ASSIGNMENT",
            typeColor: "text-[#1e3a8a]",
            typeBg: "bg-[#dbeafe]",
            typeIcon: "local_taxi",
            title: `Penugasan Driver: ${dest}`,
            time: dateVal,
            unread: false,
            isNew: false,
            body: `Anda ditugaskan mengantar penumpang (${name}) ke ${dest}. Keberangkatan tanggal ${dateVal}. Status: ${a.status || 'Aktif'}.`,
            action: { 
              label: "Lihat Tugas", 
              primary: true, 
              onClick: () => navigate("/driver/dashboard") 
            }
          };
        });

      setNotifs(assignmentNotifs);

      const realActivities: ActivityItem[] = list.slice(0, 5).map(a => {
        const req = a.request || {};
        const dest = req.destination_city || "Tujuan Dinas";
        let dot = "bg-[#1e3a8a]";
        let title = "Tugas Penugasan";

        if (a.status === "completed" || a.status === "COMPLETED") {
          dot = "bg-emerald-500";
          title = "Perjalanan Selesai";
        } else if (a.status === "on_going" || a.status === "ONGOING") {
          dot = "bg-indigo-500";
          title = "Perjalanan Aktif";
        }

        return {
          dot,
          title,
          desc: `Tugas perjalanan ke ${dest}`,
          time: req.start_time ? req.start_time.split("T")[0] : "Terbaru",
        };
      });

      setActivities(realActivities);
    } catch (err) {
      console.error("Failed to load real assignments in notifications", err);
      setNotifs([]);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealNotifs().then(() => {
      setNotifs(prev => prev.map(n => ({ ...n, unread: false, isNew: false })));
      window.dispatchEvent(new CustomEvent('ovms-notif-read'));
    });
  }, []);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, unread: false, isNew: false })));
    window.dispatchEvent(new CustomEvent('ovms-notif-read'));
  };

  const filtered = notifs.filter(n => {
    if (activeTab === "Unread")          return n.unread;
    if (activeTab === "New Assignments") return n.type.includes("ASSIGNMENT");
    return true;
  }).filter(n => search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase()));

  const unreadCount = notifs.filter(n => n.unread).length;
  const assignmentCount = notifs.filter(n => n.type === "NEW ASSIGNMENT").length;

  return (
    <RoleLayout
      activeNav="Notifications"
      onNavigate={(p: string) => onNavigate?.(p)}
      topbarTitle="Notification Center"
      userName={user?.name || "Driver"}
      userRole="Driver"
      searchPlaceholder="Cari notifikasi..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 animate-fadeup space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-bold text-[#0f172a]">Notification Center</h2>
            <p className="text-[12.5px] text-[#64748b] mt-0.5">Pantau tugas penugasan baru dan jadwal kendaraan operasional Anda.</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={markAllRead} className="flex items-center gap-2 h-9 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm transition-colors cursor-pointer">
              <Icon name="done_all" className="text-[16px]" />Tandai Semua Dibaca
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "mail",           iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]",  value: String(unreadCount).padStart(2, '0'),       label: "Belum Dibaca",      bar: "bg-[#00236f]",  barW: "33%", accent: false },
            { icon: "assignment",     iconBg: "bg-[#dbeafe]", iconColor: "text-[#1e3a8a]",  value: String(assignmentCount).padStart(2, '0'),   label: "Penugasan Driver",   bar: "bg-[#1e3a8a]",  barW: "100%", accent: true },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.iconColor} text-[18px]`} />
                </div>
              </div>
              <div className={`text-[26px] font-bold ${c.accent ? "text-[#0f2a5e]" : "text-[#0f172a]"}`}>{c.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mt-1">{c.label}</div>
              <div className="mt-2 h-[3px] bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className={`${c.bar} h-full rounded-full`} style={{ width: c.barW }} />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f1f5f9] p-1 rounded-2xl w-full sm:w-fit max-w-full overflow-x-auto no-scrollbar scrollbar-none flex-nowrap">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap flex-shrink-0 px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === tab ? "bg-[#0f2a5e] text-white shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
              }`}>{tab}</button>
          ))}
        </div>

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Notifications List */}
          <div className="flex-1 min-w-0 space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-[#64748b] text-[13px] flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e3a8a]"></div>
                <span>Memuat penugasan real-time...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-[#94a3b8] text-[13px]">
                Tidak ada penugasan untuk kategori ini
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
                            <button 
                              onClick={n.action.onClick}
                              className={`h-8 px-4 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                                n.action.primary
                                  ? "bg-[#0f2a5e] text-white hover:bg-[#1e3a8a]"
                                  : "border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc]"
                              }`}
                            >
                              {n.action.label}
                            </button>
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
              <h3 className="text-[13px] font-bold text-[#0f172a] mb-3">Aktivitas Terkini</h3>
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-[11px] text-[#94a3b8] py-2">Belum ada aktivitas penugasan.</p>
                ) : (
                  activities.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.dot} mt-1 flex-shrink-0`} />
                      <div className="min-w-0">
                        <div className="text-[12px] font-bold text-[#0f172a] leading-tight">{item.title}</div>
                        <div className="text-[11px] text-[#64748b] truncate mt-0.5">{item.desc}</div>
                        <div className="text-[10px] text-[#94a3b8] font-semibold mt-0.5">{item.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleLayout>
  );
}
