import React, { useState, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { vehicleService } from "@/services/modules/vehicleService";
import { userService } from "@/services/modules/userService";

// ── Types ────────────────────────────────────
interface StatCard { icon: string; iconBg: string; iconColor: string; value: string; label: string; barColor: string; barWidth: string; trend?: string }
interface Schedule { month: string; day: string; title: string; sub: string; time: string; accentColor: string }
interface Request  { id: string; initials: string; name: string; destination: string; vehicle: string; driver: string; date: string; status: "Approved" | "Pending" | "Rejected"; priority: "HIGH" | "MEDIUM" | "LOW" }

// ── Data ─────────────────────────────────────
// STATS and SCHEDULES are calculated dynamically inside the component

// Requests will be loaded from backend

// ── Sub-components ───────────────────────────
const StatusBadge = React.memo(function StatusBadge({ status }: { status: Request["status"] }) {
  const map = {
    Approved: "bg-[#dcfce7] text-[#15803d]",
    Pending:  "bg-[#fef9c3] text-[#854d0e]",
    Rejected: "bg-[#fee2e2] text-[#991b1b]",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
});

const PriorityBadge = React.memo(function PriorityBadge({ priority }: { priority: Request["priority"] }) {
  const map = {
    HIGH:   { dot: "bg-[#ef4444]", text: "text-[#ef4444]" },
    MEDIUM: { dot: "bg-[#f59e0b]", text: "text-[#d97706]" },
    LOW:    { dot: "bg-[#94a3b8]", text: "text-[#64748b]" },
  };
  const c = map[priority];
  return (
    <div className={`flex items-center gap-1.5 ${c.text} font-bold text-[11px]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {priority}
    </div>
  );
});



export default function Dashboard({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [statusFilter, setStatusFilter] = useState("All Status");

  // Fetch all dashboard metrics in parallel
  const { data: dashboardData, loading: reqLoading, error: reqError, refetch } = useApi(async () => {
    const [reqsRes, vehiclesRes, usersRes] = await Promise.all([
      requestService.getAll({ per_page: 1000 }),
      vehicleService.getAll({ per_page: 1000 }),
      userService.getAll({ per_page: 1000 }),
    ]);
    return {
      data: {
        requests: reqsRes.data || [],
        vehicles: vehiclesRes.data || [],
        users: usersRes.data || [],
      }
    };
  }, true, []);

  const requestsList = dashboardData?.requests || [];
  const vehiclesList = dashboardData?.vehicles || [];
  const usersList = dashboardData?.users || [];

  // Calculate stats dynamically from actual database data
  const STATS: StatCard[] = useMemo(() => {
    const totalVehicles = vehiclesList.length;
    const availableVehicles = vehiclesList.filter(v => v.status === "AVAILABLE").length;
    const inUseVehicles = vehiclesList.filter(v => v.status === "IN TRANSIT").length;
    const pendingRequests = requestsList.filter(r => r.status === "PENDING").length;
    const activeDrivers = usersList.filter(u => u.roleName === "Driver" && u.status === "ACTIVE").length;

    return [
      { icon: "directions_car", iconBg: "bg-[#e8edf8]",  iconColor: "text-[#1e3a8a]", value: String(totalVehicles), label: "Total Vehicles",   barColor: "bg-[#1e3a8a]",  barWidth: "100%"},
      { icon: "check_circle",   iconBg: "bg-[#dcfce7]",  iconColor: "text-[#16a34a]", value: String(availableVehicles),  label: "Available",        barColor: "bg-[#22c55e]",  barWidth: totalVehicles ? `${Math.round((availableVehicles/totalVehicles)*100)}%` : "0%" },
      { icon: "commute",        iconBg: "bg-[#e0f2fe]",  iconColor: "text-[#0369a1]", value: String(inUseVehicles),  label: "In Use",           barColor: "bg-[#0ea5e9]",  barWidth: totalVehicles ? `${Math.round((inUseVehicles/totalVehicles)*100)}%` : "0%" },
      { icon: "pending_actions",iconBg: "bg-[#fff7ed]",  iconColor: "text-[#c2410c]", value: String(pendingRequests),  label: "Pending Requests", barColor: "bg-[#f97316]",  barWidth: requestsList.length ? `${Math.round((pendingRequests/requestsList.length)*100)}%` : "0%" },
      { icon: "badge",          iconBg: "bg-[#ede9fe]",  iconColor: "text-[#6d28d9]", value: String(activeDrivers),  label: "Active Drivers",   barColor: "bg-[#8b5cf6]",  barWidth: "100%" },
    ];
  }, [requestsList, vehiclesList, usersList]);

  // Derive upcoming schedules dynamically from requests
  const SCHEDULES: Schedule[] = useMemo(() => {
    return requestsList
      .filter(r => r.status === "APPROVED" || r.status === "PENDING")
      .map(r => {
        let month = "OCT";
        let day = "01";
        if (r.date) {
          try {
            const d = new Date(r.date);
            if (!isNaN(d.getTime())) {
              month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
              day = String(d.getDate()).padStart(2, '0');
            }
          } catch {
            // ignore
          }
        }
        return {
          month,
          day,
          title: r.employee ? `${r.employee}'s Trip` : "Operational Trip",
          sub: `${r.vehicleModel || 'No Vehicle'} - ${r.destination}`,
          time: r.time || "09:00",
          accentColor: r.status === "APPROVED" ? "#1e3a8a" : "#c2410c"
        };
      })
      .slice(0, 3);
  }, [requestsList]);

  const requests: Request[] = useMemo(() => {
    const activeList = requestsList.filter((r: any) => {
      const raw = (r.rawStatus || r.status || "").toLowerCase();
      return !["completed", "cancelled", "rejected"].includes(raw);
    });
    return activeList.map((r: any) => {
      const name = r.employee || "Unknown";
      const initials = name.trim().split(/\s+/).map((p:string)=>p ? p[0] : "").filter(Boolean).slice(0,2).join("").toUpperCase() || "UN";
      const vehicle = r.vehicleModel || "Unassigned";
      const driver = r.driverName || (vehicle === "Unassigned" ? "Awaiting Dispatch" : "Unassigned");
      const statusMap: Record<string,string> = { APPROVED: "Approved", PENDING: "Pending", REJECTED: "Rejected", ONGOING: "Approved", COMPLETED: "Approved" };
      const status = statusMap[(r.status || "").toUpperCase()] || (r.status || "Pending");
      const priorityRaw = (r.priority || "").toUpperCase();
      const priority = priorityRaw === "HIGH" || priorityRaw === "URGENT" ? "HIGH" : (priorityRaw === "NORMAL" ? "MEDIUM" : "LOW");

      return {
        id: r.id,
        initials,
        name,
        destination: r.destination || "",
        vehicle,
        driver,
        date: r.date || "",
        status: status as Request["status"],
        priority: priority as Request["priority"],
      } as Request;
    });
  }, [requestsList]);

  const filtered = useMemo(() => {
    return statusFilter === "All Status"
      ? requests
      : requests.filter(r => r.status === statusFilter);
  }, [requests, statusFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (currentPage - 1) * perPage;
  const paginatedRequests = useMemo(() => {
    return filtered.slice(startIndex, startIndex + perPage);
  }, [filtered, startIndex, perPage]);

  return (
    <Layout
      activeNav="Dashboard"
      topbarTitle="Dashboard"
      searchPlaceholder="Search dashboard..."
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* ── STAT CARDS ── */}
        <div data-guide="admin-dashboard-stats" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATS.map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                  <Icon name={card.icon} className={`${card.iconColor} text-[19px]`} />
                </div>
                {card.trend && (
                  <span className="text-[11px] font-bold text-[#16a34a] flex items-center gap-0.5">
                    {card.trend}
                    <Icon name="trending_up" className="text-[14px] text-[#16a34a]" />
                  </span>
                )}
              </div>
              <div className="mt-1">
                <div className="text-[22px] font-bold text-[#0f172a] leading-tight">{card.value}</div>
                <div className="text-[12px] text-[#64748b] font-medium mt-0.5">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── UPCOMING SCHEDULES ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e8edf8] flex items-center justify-center">
                <Icon name="calendar_month" className="text-[#1e3a8a] text-[20px]" />
              </div>
              <div>
                <span className="text-[16px] font-bold text-[#0f172a]">Upcoming Vehicle Schedules</span>
                <div className="text-[12px] text-[#64748b]">Jadwal keberangkatan kendaraan operasional terdekat</div>
              </div>
            </div>
            <button 
              onClick={() => onNavigate ? onNavigate("Vehicle Schedule") : window.location.href = "/admin/schedules"}
              className="px-4 py-2 rounded-xl border border-[#e2e8f0] text-[12.5px] font-bold text-[#1e3a8a] hover:bg-[#eff6ff] hover:border-[#1e3a8a]/20 transition-all cursor-pointer shadow-2xs flex items-center gap-2 self-start sm:self-auto"
            >
              <span>View Full Calendar</span>
              <Icon name="arrow_forward" className="text-[15px]" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SCHEDULES.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-[13px] text-[#64748b] bg-[#f8fafc] rounded-xl border border-dashed border-[#cbd5e1]">
                Belum ada jadwal perjalanan kendaraan terdekat.
              </div>
            ) : (
              SCHEDULES.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#f8fafc] rounded-xl p-3.5 border-l-[4px] border border-[#e2e8f0] hover:shadow-sm transition-shadow"
                  style={{ borderLeftColor: s.accentColor }}
                >
                  <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-2xs px-2.5 py-1.5 min-w-[46px] border border-[#e2e8f0]">
                    <span className="text-[9px] font-bold text-[#1e3a8a] uppercase tracking-wider">{s.month}</span>
                    <span className="text-[18px] font-bold text-[#0f172a] leading-tight">{s.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate">{s.title}</div>
                    <div className="text-[11.5px] text-[#64748b] mt-0.5 leading-snug truncate">{s.sub}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1e3a8a] bg-[#e8edf8] px-2.5 py-1 rounded-md whitespace-nowrap">{s.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── REQUESTS TABLE ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[16px] font-bold text-[#0f172a]">Active Fleet Requests</div>
              <div className="text-[12.5px] text-[#64748b] mt-0.5">Real-time monitoring of all vehicle assignments</div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Icon name="filter_list" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  aria-label="Filter requests by status"
                  className="pl-8 pr-8 py-2 text-[12px] font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer appearance-none"
                >
                  {["All Status","Approved","Pending","Rejected"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto hidden md:block">
            {reqLoading && (
              <div className="px-6 py-4 text-[13px] text-[#475569] flex items-center gap-2">
                <Icon name="hourglass_top" className="text-[18px] text-[#1e3a8a]" />
                Loading requests...
              </div>
            )}
            {reqError && (
              <div className="px-6 py-4 text-[13px] text-[#b91c1c] flex items-center justify-between">
                <div className="flex items-center gap-2"><Icon name="error" className="text-red-600 text-[18px]" />Failed loading requests.</div>
                <button onClick={() => refetch()} className="ml-4 px-3 py-1.5 bg-[#1e3a8a] text-white rounded-lg">Retry</button>
              </div>
            )}
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["ID","EMPLOYEE","DESTINATION","VEHICLE/DRIVER","DATE","STATUS","PRIORITY"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[13px] text-[#64748b]">
                      No active requests found.
                    </td>
                  </tr>
                ) : (
                  paginatedRequests.map((req, index) => (
                    <tr
                      key={req.id || index}
                      className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-bold text-[#1e3a8a]">{req.id}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[11px] font-bold text-[#475569] flex-shrink-0">
                            {req.initials}
                          </div>
                          <span className="text-[13px] font-medium text-[#1e293b]">{req.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#475569]">{req.destination}</td>
                      <td className="px-5 py-3.5">
                        <div className="text-[13px] font-semibold text-[#1e293b]">{req.vehicle}</div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">
                          {req.vehicle === "Unassigned" ? req.driver : `Driver: ${req.driver}`}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#475569] whitespace-nowrap">{req.date}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={req.status} /></td>
                      <td className="px-5 py-3.5"><PriorityBadge priority={req.priority} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View (Visible on mobile, hidden on desktop) */}
          <div className="block md:hidden divide-y divide-[#f1f5f9]">
            {reqLoading && (
              <div className="p-6 text-center text-[13px] text-[#475569] flex items-center justify-center gap-2">
                <Icon name="hourglass_top" className="text-[18px] text-[#1e3a8a] animate-spin" />
                Loading requests...
              </div>
            )}
            {reqError && (
              <div className="p-6 text-center text-[13px] text-[#b91c1c] space-y-2">
                <div className="flex items-center justify-center gap-2"><Icon name="error" className="text-red-600 text-[18px]" />Failed loading requests.</div>
                <button onClick={() => refetch()} className="px-4 py-1.5 bg-[#1e3a8a] text-white rounded-xl text-[12px] font-semibold">Retry</button>
              </div>
            )}
            {!reqLoading && !reqError && paginatedRequests.length === 0 ? (
              <div className="p-8 text-center text-[13px] text-[#64748b]">
                No active requests found.
              </div>
            ) : (
              !reqLoading && !reqError && paginatedRequests.map((req, index) => (
                <div key={req.id || index} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#e2e8f0] flex items-center justify-center text-[11px] font-bold text-[#475569] flex-shrink-0">
                        {req.initials}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#1e293b]">{req.name}</div>
                        <div className="text-[11px] text-[#94a3b8]">{req.id}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={req.status} />
                      <PriorityBadge priority={req.priority} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <span className="text-[#94a3b8] block text-[9.5px] uppercase font-bold tracking-wider">Destination</span>
                      <span className="text-[12.5px] text-[#475569] font-semibold">{req.destination}</span>
                    </div>
                    <div>
                      <span className="text-[#94a3b8] block text-[9.5px] uppercase font-bold tracking-wider">Vehicle / Driver</span>
                      <div className="text-[12.5px] font-semibold text-[#1e293b]">{req.vehicle}</div>
                      <div className="text-[10px] text-[#94a3b8] mt-0.5">
                        {req.vehicle === "Unassigned" ? req.driver : `Driver: ${req.driver}`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-[#64748b]">
                    <span className="font-semibold uppercase tracking-wider text-[#94a3b8] text-[9.5px]">Request Date</span>
                    <span className="font-bold text-[#0f172a] bg-[#f8fafc] px-2.5 py-1 rounded-lg border border-[#f1f5f9]">{req.date}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
              <span className="text-[12px] text-[#94a3b8]">
                Showing <b>{startIndex + 1}–{Math.min(startIndex + perPage, filtered.length)}</b> of <b>{filtered.length}</b> results
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_left" className="text-[18px]" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${
                      n === currentPage ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"
                    }`}
                  >{n}</button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_right" className="text-[18px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
