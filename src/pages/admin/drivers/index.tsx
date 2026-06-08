import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { driverService } from "@/services/modules/driverService";

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-[#dcfce7] text-[#16a34a]";
    case "ON DUTY":
      return "bg-[#dbeafe] text-[#1d4ed8]";
    default:
      return "bg-[#f1f5f9] text-[#64748b]";
  }
};

const getAvatarUrl = (id: string, gender: 'men' | 'women' = 'men') => {
  const num = parseInt(id.replace(/\D/g, '')) || 1;
  return `https://randomuser.me/api/portraits/thumb/${gender}/${num % 100}.jpg`;
};

export default function Driver({ onNavigate = () => {} }: { onNavigate?: (p: string) => void }) {
  const { data: drivers, loading, error, refetch } = useApi(() => driverService.getAll());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [adding, setAdding] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await driverService.delete(id);
      refetch();
    } catch (err) {
      console.error("Failed to delete driver", err);
    }
  };

  const handleAddDriver = async () => {
    setAdding(true);
    try {
      const newId = `D-${Math.floor(100 + Math.random() * 900)}`;
      await driverService.create({
        id: newId,
        name: "New Driver " + Math.floor(Math.random() * 100),
        status: "AVAILABLE",
        licenseType: "Class A",
        licenseExpiry: "Jun 15, 2026",
        performance: 5.0,
      });
      refetch();
    } catch (err) {
      console.error("Failed to add driver", err);
    } finally {
      setAdding(false);
    }
  };

  const list = drivers || [];

  const filtered = list
    .filter(d => statusFilter === "All" || d.status === statusFilter)
    .filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));

  const totalDriversCount = list.length;
  const onDutyCount = list.filter(d => d.status === "ON DUTY").length;
  const expiringSoonCount = 0; // Hardcoded or calculated if needed

  return (
    <Layout
      activeNav="Driver Management"
      onNavigate={onNavigate}
      topbarTitle="Driver Management"
      searchPlaceholder="Search drivers..."
      userRole="Administrator"
    >
      <div className="p-6 space-y-5 animate-fadein">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Driver Management</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Manage and monitor driver assignments, certifications, and availability.</p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleAddDriver}
              disabled={adding}
              className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Icon name="person_add" className="text-[17px]" />
              {adding ? "Adding..." : "Add Driver"}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Drivers", value: totalDriversCount, sub: "+4% vs last month", icon: "groups", color: "text-[#1e3a8a]", bg: "bg-[#e8edf8]" },
            { label: "Active / On Duty", value: onDutyCount, sub: `${totalDriversCount ? Math.round((onDutyCount / totalDriversCount) * 100) : 0}%`, icon: "commute", color: "text-[#0369a1]", bg: "bg-[#e0f2fe]", bar: true, barVal: totalDriversCount ? Math.round((onDutyCount / totalDriversCount) * 100) : 0 },
            { label: "Expiring Soon", value: expiringSoonCount, sub: "Requires immediate action", icon: "notification_important", color: "text-[#dc2626]", bg: "bg-[#fee2e2]", border: "border-[#fecdd3]", urgent: expiringSoonCount > 0 },
          ].map(c => (
            <div key={c.label} className={`bg-white rounded-2xl p-5 border ${c.border || "border-[#e2e8f0]"} shadow-sm hover:shadow-md transition-shadow ${c.urgent ? "border-l-4 border-l-[#dc2626]" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.color} text-[20px]`} />
                </div>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">{c.label}</div>
              <div className={`text-[32px] font-bold leading-tight ${c.urgent ? "text-[#dc2626]" : "text-[#0f172a]"}`}>{loading ? "..." : c.value}</div>
              {c.bar ? (
                <div className="mt-2">
                  <div className="h-[3px] bg-[#f1f5f9] rounded-full overflow-hidden">
                    <div className="bg-[#0ea5e9] h-full rounded-full" style={{ width: `${c.barVal}%` }} />
                  </div>
                  <div className="text-[11px] text-[#64748b] mt-1">{c.sub}</div>
                </div>
              ) : (
                <div className={`text-[11px] mt-1 ${c.urgent ? "text-[#dc2626] font-semibold" : "text-[#64748b]"}`}>{c.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search Driver or ID..."
                className="w-full h-9 pl-9 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none"
            >
              {["All", "AVAILABLE", "ON DUTY", "OFF DUTY"].map(s => <option key={s} value={s}>Status: {s}</option>)}
            </select>
            <select className="h-9 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] focus:outline-none">
              <option>License Type</option>
              <option>Class A</option>
              <option>Class B</option>
            </select>
            <button
              onClick={() => { setSearch(""); setStatusFilter("All"); }}
              className="h-9 px-4 border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9]"
            >
              Reset
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[12px] text-[#94a3b8]">Showing 1-{filtered.length} of {totalDriversCount}</span>
              <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center opacity-40" disabled>
                <Icon name="chevron_left" className="text-[16px]" />
              </button>
              <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9]">
                <Icon name="chevron_right" className="text-[16px]" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-[14px] text-[#64748b]">Loading drivers...</div>
          ) : error ? (
            <div className="p-8 text-center text-[14px] text-red-500">Failed to load drivers data.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["DRIVER", "STATUS", "ASSIGNED VEHICLE", "LICENSE TYPE", "LICENSE EXPIRY", "ACTIONS"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={d.avatarUrl || getAvatarUrl(d.id, d.name.includes("Sarah") || d.name.includes("Elena") ? 'women' : 'men')}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0]"
                        />
                        <div>
                          <div className="text-[13px] font-bold text-[#0f172a]">{d.name}</div>
                          <div className="text-[11px] text-[#94a3b8]">{d.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(d.status)}`}>{d.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[#0f172a]">
                      {d.assignedVehicleId || "Unassigned"}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#475569]">{d.licenseType}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-[#475569]">
                        <div className="text-[13px]">{d.licenseExpiry}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-semibold hover:bg-[#dbeafe] transition">
                          <Icon name="edit" className="text-[14px]" />Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#fee2e2] text-[#b91c1c] text-[12px] font-semibold hover:bg-[#fecaca] transition"
                        >
                          <Icon name="delete" className="text-[14px]" />Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
            <span className="text-[12px] text-[#94a3b8]">Showing 1 to {filtered.length} of {totalDriversCount} entries</span>
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
