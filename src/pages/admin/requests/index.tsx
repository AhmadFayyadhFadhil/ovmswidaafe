import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#16a34a]";
    case "ONGOING":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    case "PENDING":
      return "bg-[#fef3c7] text-[#d97706]";
    case "COMPLETED":
      return "bg-[#e2e8f0] text-[#475569]";
    case "REJECTED":
      return "bg-[#fee2e2] text-[#991b1b]";
    default:
      return "bg-[#f1f5f9] text-[#64748b]";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT":
      return "text-red-600 font-bold";
    case "HIGH":
      return "text-orange-600 font-semibold";
    default:
      return "text-gray-600";
  }
};

export default function Request({ onNavigate = () => {} }: { onNavigate?: (p: string) => void }) {
  const { data: requests, loading, error, refetch } = useApi(() => requestService.getAll());
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAddRequest = async () => {
    setAdding(true);
    try {
      const newId = `REQ-${Math.floor(2000 + Math.random() * 1000)}`;
      await requestService.create({
        id: newId,
        employee: "New Requester " + Math.floor(Math.random() * 100),
        department: "Operations",
        destination: "Offsite Substation",
        vehicleModel: "Tesla Model 3",
        driverName: "John Doe",
        date: "Oct 26, 2024",
        time: "09:00",
        status: "PENDING",
        priority: "NORMAL"
      });
      refetch();
    } catch (err) {
      console.error("Failed to add request", err);
    } finally {
      setAdding(false);
    }
  };

  const list = requests || [];

  const filtered = list
    .filter(r => statusFilter === "All" || r.status === statusFilter)
    .filter(r => r.employee.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()));

  const totalRequestsCount = list.length;
  const pendingCount = list.filter(r => r.status === "PENDING").length;
  const ongoingCount = list.filter(r => r.status === "ONGOING").length;
  const completedCount = list.filter(r => r.status === "COMPLETED").length;

  return (
    <Layout
      activeNav="Request Monitoring"
      onNavigate={onNavigate}
      topbarTitle="Request Monitoring"
      searchPlaceholder="Search requests..."
      userRole="Administrator"
    >
      <div className="p-6 space-y-5 animate-fadein">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Request Monitoring</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Real-time oversight of vehicle dispatch and mission status across the enterprise.</p>
          </div>
          <div className="flex gap-2.5">
            <button className="flex items-center gap-2 px-4 py-2.5 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-bold text-[#475569] hover:bg-[#f8fafc] shadow-sm">
              <Icon name="download" className="text-[17px]" />Export
            </button>
            <button
              onClick={handleAddRequest}
              disabled={adding}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <Icon name="add" className="text-[17px]" />
              {adding ? "Adding..." : "New Request"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Requests",    value: totalRequestsCount, icon: "assignment",      bg: "bg-[#e8edf8]", color: "text-[#1e3a8a]" },
            { label: "Pending Approval",  value: pendingCount,       icon: "pending_actions", bg: "bg-[#fff7ed]", color: "text-[#c2410c]" },
            { label: "Active Missions",   value: ongoingCount,       icon: "commute",         bg: "bg-[#e0f2fe]", color: "text-[#0369a1]" },
            { label: "Completed Today",   value: completedCount,     icon: "task_alt",        bg: "bg-[#dcfce7]", color: "text-[#16a34a]" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.color} text-[20px]`} />
                </div>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">{c.label}</div>
              <div className="text-[28px] font-bold text-[#0f172a] leading-tight">{loading ? "..." : c.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Requests..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All", "APPROVED", "PENDING", "ONGOING", "COMPLETED", "REJECTED"].map(s => <option key={s} value={s}>Status: {s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>Priority: All</option>
              <option>HIGH</option>
              <option>URGENT</option>
              <option>NORMAL</option>
              <option>LOW</option>
            </select>
            <div className="flex items-center gap-2 h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] text-[#475569]">
              <Icon name="calendar_today" className="text-[15px]" />
              Oct 20, 2024 – Oct 27, 2024
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading requests...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load requests.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["REQUEST ID", "REQUESTER", "VEHICLE & DRIVER", "DESTINATION", "SCHEDULE", "PRIORITY", "STATUS", "ACTIONS"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-4 py-4 text-[13px] font-bold text-[#1e3a8a]">{r.id}</td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] font-bold text-[#0f172a]">{r.employee}</div>
                      <div className="text-[10px] font-bold uppercase text-[#94a3b8] tracking-wider">{r.department}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[12px] font-bold text-[#0f172a]">{r.vehicleModel}</div>
                      <div className="text-[11px] text-[#94a3b8]">Driver: {r.driverName}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[13px] text-[#0f172a]">{r.destination}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[12px] text-[#0f172a]">{r.date}</div>
                      <div className="text-[11px] text-[#94a3b8]">{r.time || "All day"}</div>
                    </td>
                    <td className="px-4 py-4 text-[12px]">
                      <span className={getPriorityColor(r.priority)}>{r.priority}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-semibold hover:bg-[#dbeafe] transition">
                          <Icon name="edit" className="text-[14px]" />Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
            <span className="text-[12px] text-[#94a3b8]">Showing 1 to {filtered.length} of {totalRequestsCount} requests</span>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((n, i) => (
                <button key={i} className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${n === 1 ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"}`}>{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
