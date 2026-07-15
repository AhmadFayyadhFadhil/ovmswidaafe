import { useState, useEffect } from "react";
import { Layout as RoleLayout } from "../../../components/layout/RoleLayout";
import { Icon } from "../../../components/ui/Icon";
import { requestService } from "@/services/modules/requestService";
import { RequestDetailModal } from "@/components/ui/RequestDetailModal";

const TABS = ["All", "Schedules", "Approvals", "Assignments"];

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
  raw: any;
}

export default function NotificationsPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await requestService.getAll({ per_page: 1000 });
      setRequests(res.data || []);
    } catch (err) {
      console.error("Gagal mengambil data notifikasi karyawan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Map requests to notifications
  const notifs: NotifItem[] = requests.map(req => {
    let type = "WAITING APPROVAL";
    let typeIcon = "pending_actions";
    let typeBg = "bg-amber-50";
    let typeColor = "text-amber-700";
    let body = `Permintaan kendaraan Anda ke ${req.destination} telah diajukan dan sedang menunggu persetujuan Kepala Departemen.`;
    
    if (req.status === "COMPLETED") {
      type = "TRIP COMPLETED";
      typeIcon = "task_alt";
      typeBg = "bg-sky-50";
      typeColor = "text-sky-700";
      body = `Perjalanan dinas ke ${req.destination} telah selesai. Driver: ${req.driverName && req.driverName !== 'Not Assigned' ? req.driverName : 'Internal/Eksternal'}.`;
    } else if (req.status === "REJECTED") {
      type = "REQUEST REJECTED";
      typeIcon = "cancel";
      typeBg = "bg-rose-50";
      typeColor = "text-rose-700";
      body = `Permintaan kendaraan ke ${req.destination} ditolak oleh pihak approver.`;
    } else if (req.status === "ONGOING") {
      type = "TRIP ONGOING";
      typeIcon = "commute";
      typeBg = "bg-indigo-50";
      typeColor = "text-indigo-700";
      body = `Perjalanan dinas Anda ke ${req.destination} sedang dalam perjalanan (On Going).`;
    } else if (req.status === "APPROVED") {
      type = "REQUEST APPROVED";
      typeIcon = "check_circle";
      typeBg = "bg-emerald-50";
      typeColor = "text-emerald-700";
      body = `Permintaan kendaraan ke ${req.destination} telah disetujui. Driver: ${req.driverName && req.driverName !== 'Not Assigned' ? req.driverName : 'Menunggu Penugasan'}.`;
    }

    return {
      id: req.id,
      type,
      typeIcon,
      typeBg,
      typeColor,
      title: `Permintaan Kendaraan #RQ-${req.id}`,
      time: `${req.date} ${req.time}`,
      unread: false,
      body,
      action: {
        label: "Lihat Detail",
        primary: true,
        onClick: () => {
          setSelectedRequest(req);
          setIsDetailOpen(true);
        }
      },
      raw: req
    };
  });

  const filtered = notifs.filter(n => {
    if (activeTab === "Assignments") return n.raw.status === "APPROVED" || n.raw.status === "ONGOING";
    if (activeTab === "Schedules")   return n.raw.status === "PENDING";
    if (activeTab === "Approvals")   return n.raw.status === "APPROVED" || n.raw.status === "REJECTED";
    return true;
  }).filter(n => 
    search === "" || 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic stat counts
  const totalNotifications = notifs.length;
  const pendingCount = notifs.filter(n => n.raw.status === "PENDING").length;
  const activeCount = notifs.filter(n => n.raw.status === "APPROVED" || n.raw.status === "ONGOING").length;
  const completedCount = notifs.filter(n => n.raw.status === "COMPLETED").length;

  // Dynamic live activity based on latest requests
  const liveActivities = requests.slice(0, 3).map(req => {
    let dot = "bg-[#64748b]";
    let title = "Trip Updated";
    let desc = `Status request ke ${req.destination} diperbarui`;

    if (req.status === "COMPLETED") {
      dot = "bg-sky-500";
      title = "Trip Completed";
      desc = `Tiba di tujuan ${req.destination}`;
    } else if (req.status === "ONGOING") {
      dot = "bg-indigo-500";
      title = "Trip Active";
      desc = `Menuju ke ${req.destination}`;
    } else if (req.status === "APPROVED") {
      dot = "bg-emerald-500";
      title = "Trip Approved";
      desc = `Request disetujui & terjadwal`;
    } else if (req.status === "PENDING") {
      dot = "bg-amber-500";
      title = "Request Created";
      desc = `Menunggu persetujuan kadep`;
    }

    return {
      dot,
      title,
      desc,
      time: `${req.date} ${req.time}`
    };
  });

  return (
    <RoleLayout
      activeNav="Notifications"
      onNavigate={(p: string) => onNavigate?.(p)}
      topbarTitle="Notification Center"
      userRole="Employee"
      searchPlaceholder="Cari notifikasi..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 animate-fadeup space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-bold text-[#0f172a]">Notification Center</h2>
            <p className="text-[12.5px] text-[#64748b] mt-0.5">Pantau status persetujuan, jadwal penugasan driver, dan aktivitas perjalanan dinas Anda secara real-time.</p>
          </div>
          <button 
            onClick={fetchNotifications}
            className="flex items-center gap-2 h-9 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm transition-colors cursor-pointer w-fit"
          >
            <Icon name="refresh" className="text-[16px]" /> Segarkan Data
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "mail",           iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]",  value: totalNotifications, label: "Total Notifications",  bar: "bg-[#00236f]",  barW: "100%" },
            { icon: "pending_actions", iconBg: "bg-amber-50",  iconColor: "text-amber-700",  value: pendingCount,       label: "Pending Approvals",     bar: "bg-amber-600",  barW: `${totalNotifications ? (pendingCount / totalNotifications) * 100 : 0}%` },
            { icon: "event_note",     iconBg: "bg-emerald-50", iconColor: "text-emerald-700", value: activeCount,        label: "Active / Scheduled",    bar: "bg-emerald-600", barW: `${totalNotifications ? (activeCount / totalNotifications) * 100 : 0}%` },
            { icon: "task_alt",       iconBg: "bg-sky-50",     iconColor: "text-sky-700",     value: completedCount,     label: "Completed Trips",       bar: "bg-sky-600",     barW: `${totalNotifications ? (completedCount / totalNotifications) * 100 : 0}%` },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.iconColor} text-[18px]`} />
                </div>
              </div>
              <div className="text-[26px] font-bold text-[#0f172a]">{loading ? "..." : c.value}</div>
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
              className={`px-4 py-2 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                activeTab === tab ? "bg-[#0f2a5e] text-white shadow-sm" : "text-[#64748b] hover:text-[#0f172a]"
              }`}>{tab}</button>
          ))}
        </div>

        {/* Content Row */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Notifications List */}
          <div className="flex-1 min-w-0 space-y-3">
            {loading ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center text-[#94a3b8]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2a5e] mx-auto mb-3"></div>
                <span>Memuat data notifikasi dinas...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-10 text-center text-[#94a3b8] text-[13px]">
                Tidak ada notifikasi untuk kategori ini
              </div>
            ) : (
              filtered.map(n => (
                <div key={n.id} className="bg-white rounded-2xl border border-[#e2e8f0] transition-all shadow-sm hover:shadow-md">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 ${n.typeBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon name={n.typeIcon} className={`${n.typeColor} text-[18px]`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${n.typeColor}`}>{n.type}</span>
                          <span className="text-[11px] text-[#94a3b8] flex-shrink-0">{n.time}</span>
                        </div>
                        <div className="text-[13px] font-bold text-[#0f172a]">{n.title}</div>
                        <p className="text-[12px] text-[#475569] mt-1 leading-relaxed">{n.body}</p>
                        {n.action && (
                          <div className="mt-3">
                            <button 
                              onClick={n.action.onClick}
                              className="h-8 px-4 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-[#e2e8f0] text-[#0f2a5e] hover:bg-[#f8fafc]"
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
              <h3 className="text-[13px] font-bold text-[#0f172a] mb-3">Live Activity</h3>
              <div className="space-y-3">
                {loading ? (
                  <div className="text-[11px] text-[#94a3b8] text-center py-4">Memuat...</div>
                ) : liveActivities.length === 0 ? (
                  <div className="text-[11px] text-[#94a3b8] text-center py-4">Belum ada aktivitas perjalanan</div>
                ) : (
                  liveActivities.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${item.dot} mt-1.5 flex-shrink-0`} />
                      <div>
                        <div className="text-[12px] font-bold text-[#0f172a]">{item.title}</div>
                        <div className="text-[11px] text-[#64748b] leading-tight">{item.desc}</div>
                        <div className="text-[10px] text-[#94a3b8] mt-0.5 font-semibold">{item.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Policy Update */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
              <div className="flex items-start gap-2.5 mb-2">
                <Icon name="info" className="text-[#00236f] text-[18px] flex-shrink-0 mt-0.5" />
                <div className="text-[12px] font-bold text-[#0f172a]">Regulasi Operasional</div>
              </div>
              <p className="text-[11px] text-[#475569] leading-relaxed">Pengajuan kendaraan dinas disarankan diajukan maksimal H-1 sebelum keberangkatan untuk kepastian ketersediaan driver.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detail Request */}
      <RequestDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </RoleLayout>
  );
}