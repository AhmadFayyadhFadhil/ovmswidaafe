import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";

const STAT_CARDS = [
  { label: "Total Requests Today", value: "24", icon: "assignment", color: "text-[#2563eb]", bg: "bg-[#eff6ff]", border: "border-l-[#2563eb]" },
  { label: "Pending Assignment", value: "7", icon: "pending_actions", color: "text-[#d97706]", bg: "bg-[#fffbeb]", border: "border-l-[#d97706]" },
  { label: "Active Trips", value: "5", icon: "route", color: "text-[#059669]", bg: "bg-[#ecfdf5]", border: "border-l-[#059669]" },
  { label: "Available Drivers", value: "8", icon: "directions_car", color: "text-[#7c3aed]", bg: "bg-[#f5f3ff]", border: "border-l-[#7c3aed]" },
];

const RECENT_REQUESTS = [
  { id: "REQ-0031", name: "Budi Santoso", dept: "Engineering", dest: "Soekarno-Hatta Airport", time: "09:30", status: "PENDING" },
  { id: "REQ-0030", name: "Siti Rahayu", dept: "HR", dest: "Sudirman Business District", time: "08:45", driver: "John Doe", status: "ON TRIP" },
  { id: "REQ-0029", name: "Agus Wijaya", dept: "Finance", dest: "Kemang Head Office", time: "08:00", driver: "Michael Chen", status: "COMPLETED" },
  { id: "REQ-0028", name: "Dewi Lestari", dept: "Marketing", dest: "Tech Park Building B", time: "07:30", driver: "Robert Lee", status: "COMPLETED" },
  { id: "REQ-0027", name: "Reza Pratama", dept: "Operations", dest: "Kuningan City Mall", time: "07:00", status: "REJECTED" },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: "Pending",   className: "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]" },
  "ON TRIP": { label: "On Trip",   className: "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]" },
  COMPLETED: { label: "Completed", className: "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]" },
  REJECTED:  { label: "Rejected",  className: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]" },
};

const DRIVERS_SUMMARY = [
  { name: "John Doe",     id: "DRV-001", status: "ON TRIP",  dest: "Sudirman" },
  { name: "Michael Chen", id: "DRV-002", status: "ON TRIP",  dest: "Kemang" },
  { name: "Robert Lee",   id: "DRV-003", status: "AVAILABLE", dest: null },
  { name: "Ahmad Yusuf",  id: "DRV-004", status: "AVAILABLE", dest: null },
  { name: "Benny Tan",    id: "DRV-005", status: "OFF DUTY",  dest: null },
];

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();
}

export default function GAHRDDashboard({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [_active, setActive] = useState("Dashboard");

  const handleNavigate = (p: string) => {
    setActive(p);
    onNavigate(p);
  };

  return (
    <Layout
      activeNav="Dashboard"
      onNavigate={handleNavigate}
      topbarTitle="GAHRD Dashboard"
      userRole="GA/HRD"
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1e3b8a] to-[#2563eb] rounded-2xl p-5 sm:p-8 mb-7 text-white">
          <div className="relative z-10">
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-70 mb-1">GA / HRD Portal</div>
            <h2 className="text-[22px] sm:text-[28px] font-extrabold mb-1">Logistics Command Center</h2>
            <p className="text-[13px] opacity-80 max-w-lg">Kelola permintaan kendaraan, penugasan driver, dan operasional logistik harian secara terpusat.</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={() => handleNavigate("Requests")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1e3a8a] text-[12px] font-bold rounded-xl hover:bg-[#f1f5f9] active:scale-95 transition-all"
              >
                <Icon name="assignment" className="text-[16px]" />
                Kelola Permintaan
              </button>
              <button
                onClick={() => handleNavigate("Driver Availability")}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/30 text-white text-[12px] font-bold rounded-xl hover:bg-white/20 active:scale-95 transition-all"
              >
                <Icon name="directions_car" className="text-[16px]" />
                Lihat Driver
              </button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -right-4 top-10 w-24 h-24 bg-white/5 rounded-full" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {STAT_CARDS.map((s) => (
            <div key={s.label} className={`bg-white border border-[#e2e8f0] border-l-4 ${s.border} rounded-2xl p-4 sm:p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest leading-tight">{s.label}</div>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <Icon name={s.icon} className={`text-[18px] ${s.color}`} />
                </div>
              </div>
              <div className={`text-[32px] sm:text-[38px] font-extrabold leading-none ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Left: Recent Requests Table */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="receipt_long" className="text-[18px] text-[#1e3a8a]" />
                <h3 className="font-bold text-[#0f172a] text-[13px] uppercase tracking-wider">Permintaan Terbaru</h3>
              </div>
              <button
                onClick={() => handleNavigate("Requests")}
                className="text-[11px] font-bold text-[#2563eb] hover:underline"
              >
                Lihat Semua →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] min-w-[560px]">
                <thead>
                  <tr className="border-b border-[#f1f5f9]">
                    <th className="px-5 sm:px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">ID</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Karyawan</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Tujuan</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Driver</th>
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#94a3b8]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f8fafc]">
                  {RECENT_REQUESTS.map((r) => {
                    const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG["PENDING"];
                    return (
                      <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-5 sm:px-6 py-3.5 font-bold font-mono text-[#0f172a] text-[12px]">#{r.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#e5eeff] text-[#1e3a8a] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                              {getInitials(r.name)}
                            </div>
                            <div>
                              <div className="font-bold text-[#0f172a] text-[12px]">{r.name}</div>
                              <div className="text-[10px] text-[#94a3b8]">{r.dept}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 text-[#475569] max-w-[130px]">
                            <Icon name="location_on" className="text-[12px] text-[#94a3b8] flex-shrink-0" />
                            <span className="truncate text-[12px]">{r.dest}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-[12px]">
                          {r.driver ? (
                            <span className="font-semibold text-[#0f172a]">{r.driver}</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#f59e0b] bg-[#fef9c3] px-2 py-0.5 rounded">Belum Ditugaskan</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit ${sc.className}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {sc.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Driver Status Panel */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="directions_car" className="text-[18px] text-[#1e3a8a]" />
                <h3 className="font-bold text-[#0f172a] text-[13px] uppercase tracking-wider">Status Driver</h3>
              </div>
              <button
                onClick={() => handleNavigate("Driver Availability")}
                className="text-[11px] font-bold text-[#2563eb] hover:underline"
              >
                Semua →
              </button>
            </div>
            <div className="divide-y divide-[#f8fafc]">
              {DRIVERS_SUMMARY.map((d) => {
                const isAvail = d.status === "AVAILABLE";
                const isOnTrip = d.status === "ON TRIP";
                const dotColor = isAvail ? "bg-green-500" : isOnTrip ? "bg-blue-500" : "bg-slate-300";
                const badgeClass = isAvail
                  ? "bg-[#dcfce7] text-[#15803d]"
                  : isOnTrip
                  ? "bg-[#dbeafe] text-[#1d4ed8]"
                  : "bg-[#f1f5f9] text-[#64748b]";
                return (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#f8fafc] transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#e5eeff] text-[#1e3a8a] flex items-center justify-center text-[11px] font-bold">
                        {getInitials(d.name)}
                      </div>
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 ${dotColor} border-2 border-white rounded-full`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[#0f172a] text-[13px] truncate">{d.name}</div>
                      <div className="text-[10px] text-[#94a3b8]">{d.id}{d.dest ? ` · ${d.dest}` : ""}</div>
                    </div>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
                      {d.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Action */}
            <div className="p-5 border-t border-[#f1f5f9]">
              <button
                onClick={() => handleNavigate("Requests")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1e3a8a] text-white text-[12px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all"
              >
                <Icon name="add_circle" className="text-[16px]" />
                Tugaskan Driver Sekarang
              </button>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
