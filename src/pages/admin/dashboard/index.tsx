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

// ── Chart ────────────────────────────────────
const UsageChart = React.memo(function UsageChart({
  labels,
  thisPeriodPct,
  prevPeriodPct,
  periodName
}: {
  labels: string[];
  thisPeriodPct: number[];
  prevPeriodPct: number[];
  periodName: string;
}) {
  const count = labels.length;
  const startX = 44;
  const endX = 626;
  const step = count > 1 ? (endX - startX) / (count - 1) : 0;
  const xCoords = labels.map((_, i) => startX + i * step);

  const thisPeriodPoints = thisPeriodPct.map((p, i) => ({
    x: xCoords[i],
    y: 190 - (Math.min(100, Math.max(0, p)) / 100) * 160
  }));

  const prevPeriodPoints = prevPeriodPct.map((p, i) => ({
    x: xCoords[i],
    y: 190 - (Math.min(100, Math.max(0, p)) / 100) * 160
  }));

  const getSplinePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX = (p1.x - p0.x) * 0.4;
      path += ` C ${p0.x + cpX},${p0.y} ${p1.x - cpX},${p1.y} ${p1.x},${p1.y}`;
    }
    return path;
  };

  const thisPath = getSplinePath(thisPeriodPoints);
  const prevPath = getSplinePath(prevPeriodPoints);
  const fillPath = thisPath ? `${thisPath} L ${xCoords[xCoords.length - 1]},210 L ${xCoords[0]},210 Z` : "";

  const now = new Date();
  let activeIdx = 0;
  if (periodName === "Weekly") {
    let dayIndex = now.getDay() - 1; // 0 = Mon, ..., 6 = Sun
    if (dayIndex === -1) dayIndex = 6;
    activeIdx = dayIndex;
  } else {
    activeIdx = now.getMonth(); // 0 = Jan, ..., 11 = Dec
  }
  if (activeIdx >= count) activeIdx = count - 1;

  const todayX = xCoords[activeIdx];
  const todayY = thisPeriodPoints[activeIdx]?.y || 190;
  const todayPct = thisPeriodPct[activeIdx] || 0;

  return (
    <div className="relative w-full" style={{ height: 248 }}>
      <svg viewBox="0 0 670 210" preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1e3a8a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {[40, 80, 120, 160, 200].map(y => (
          <line key={y} x1="44" y1={y} x2="626" y2={y} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={prevPath} fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="6 4" strokeOpacity="0.8" />
        <path d={fillPath} fill="url(#waveGrad)" />
        <path d={thisPath} fill="none" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        
        <circle cx={todayX} cy={todayY} r="5.5" fill="#1e3a8a" />
        <circle cx={todayX} cy={todayY} r="11" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeOpacity="0.25">
          <animate attributeName="r"              from="6"   to="18"  dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.4" to="0"   dur="1.8s" repeatCount="indefinite" />
        </circle>
        
        <g>
          <rect x={todayX - 50} y={todayY - 30} width="100" height="26" rx="6" fill="#1e3a8a" />
          <polygon points={`${todayX - 5},${todayY - 4} ${todayX + 5},${todayY - 4} ${todayX},${todayY + 4}`} fill="#1e3a8a" />
          <text x={todayX} y={todayY - 12} textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
            Usage: {todayPct}%
          </text>
        </g>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ paddingLeft: 30, paddingRight: 16 }}>
        {labels.map((d, i) => (
          <div key={d} className="flex-1 text-center" style={{ fontSize: labels.length > 7 ? 10 : 12, color: i === activeIdx ? "#1e3a8a" : "#94a3b8", fontWeight: i === activeIdx ? 700 : 500 }}>
            {d}
            {i === activeIdx && <div className="w-1 h-1 rounded-full bg-[#1e3a8a] mx-auto mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
});

export default function Dashboard({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [periodFilter, setPeriodFilter] = useState<"Weekly" | "Monthly">("Weekly");

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

  // Calculate dynamic usage analytics based on REAL database request data for Weekly & Monthly modes
  const { labels, finalThisPct, finalPrevPct, legendThis, legendPrev } = useMemo(() => {
    const totalVehiclesCount = Math.max(1, vehiclesList.length);

    if (periodFilter === "Weekly") {
      const getStartOfWeek = (date: Date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
      };

      const formatDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const todayDate = new Date();
      const startOfThisWeek = getStartOfWeek(todayDate);
      const startOfPrevWeek = new Date(startOfThisWeek);
      startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

      const thisWeekUsage = Array(7).fill(0);
      const prevWeekUsage = Array(7).fill(0);

      for (let d = 0; d < 7; d++) {
        const dateThis = new Date(startOfThisWeek);
        dateThis.setDate(dateThis.getDate() + d);
        const strThis = formatDate(dateThis);

        const datePrev = new Date(startOfPrevWeek);
        datePrev.setDate(datePrev.getDate() + d);
        const strPrev = formatDate(datePrev);

        const countThis = requestsList.filter((r: any) => (r.date === strThis || r.start_time?.startsWith(strThis)) && r.status !== 'REJECTED' && r.status !== 'rejected').length;
        const countPrev = requestsList.filter((r: any) => (r.date === strPrev || r.start_time?.startsWith(strPrev)) && r.status !== 'REJECTED' && r.status !== 'rejected').length;

        thisWeekUsage[d] = Math.min(100, Math.round((countThis / totalVehiclesCount) * 100));
        prevWeekUsage[d] = Math.min(100, Math.round((countPrev / totalVehiclesCount) * 100));
      }

      return {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        finalThisPct: thisWeekUsage,
        finalPrevPct: prevWeekUsage,
        legendThis: "Minggu Ini (This Week)",
        legendPrev: "Minggu Lalu (Prev. Week)"
      };
    } else {
      // Monthly Mode
      const currentYear = new Date().getFullYear();
      const prevYear = currentYear - 1;

      const thisYearUsage = Array(12).fill(0);
      const prevYearUsage = Array(12).fill(0);

      requestsList.forEach((r: any) => {
        if (r.status === 'REJECTED' || r.status === 'rejected') return;
        const dateStr = r.date || r.start_time || r.created_at;
        if (!dateStr) return;

        try {
          // Parse DD-MM-YYYY or YYYY-MM-DD
          let y = currentYear;
          let m = -1;

          if (/^\d{2}-\d{2}-\d{4}/.test(dateStr)) {
            const parts = dateStr.split(' ')[0].split('-');
            y = parseInt(parts[2], 10);
            m = parseInt(parts[1], 10) - 1;
          } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            const parts = dateStr.split(' ')[0].split('-');
            y = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10) - 1;
          } else {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              y = d.getFullYear();
              m = d.getMonth();
            }
          }

          if (m >= 0 && m < 12) {
            if (y === currentYear) {
              thisYearUsage[m] += 1;
            } else if (y === prevYear) {
              prevYearUsage[m] += 1;
            }
          }
        } catch {}
      });

      const monthlyCapacity = Math.max(1, totalVehiclesCount * 10);
      const thisMonthPct = thisYearUsage.map(c => Math.min(100, Math.round((c / monthlyCapacity) * 100)));
      const prevMonthPct = prevYearUsage.map(c => Math.min(100, Math.round((c / monthlyCapacity) * 100)));

      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        finalThisPct: thisMonthPct,
        finalPrevPct: prevMonthPct,
        legendThis: `Tahun ${currentYear}`,
        legendPrev: `Tahun ${prevYear}`
      };
    }
  }, [periodFilter, requestsList, vehiclesList]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

        {/* ── CHART + SCHEDULES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="col-span-8 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col min-w-0">
                <span className="text-[16px] font-bold text-[#0f172a] truncate">Vehicle Usage Analytics</span>
                <div className="flex items-center gap-3.5 mt-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" />
                    <span className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider">{legendThis}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 2" /></svg>
                    <span className="text-[10.5px] font-semibold text-[#64748b] uppercase tracking-wider">{legendPrev}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <select 
                  aria-label="Analytics Filter Period" 
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value as "Weekly" | "Monthly")}
                  className="text-[12px] font-bold border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[#1e3a8a] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer shadow-2xs"
                >
                  <option value="Weekly">Weekly (Mingguan)</option>
                  <option value="Monthly">Monthly (Bulanan)</option>
                </select>
                <button 
                  onClick={() => refetch()} 
                  title="Segarkan Data Analytics"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                >
                  <Icon name="refresh" className="text-[#94a3b8] hover:text-[#1e3a8a] text-[18px]" />
                </button>
              </div>
            </div>
            <UsageChart 
              labels={labels} 
              thisPeriodPct={finalThisPct} 
              prevPeriodPct={finalPrevPct} 
              periodName={periodFilter}
            />
          </div>

          <div className="col-span-4 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Upcoming Schedules</div>
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {SCHEDULES.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#f8fafc] rounded-xl p-3 border-l-[3px]"
                  style={{ borderLeftColor: s.accentColor }}
                >
                  <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm px-2.5 py-1.5 min-w-[44px] border border-[#e2e8f0]">
                    <span className="text-[9px] font-bold text-[#1e3a8a] uppercase">{s.month}</span>
                    <span className="text-[18px] font-bold text-[#0f172a] leading-tight">{s.day}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate">{s.title}</div>
                    <div className="text-[11px] text-[#64748b] mt-0.5 leading-snug">{s.sub}</div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#94a3b8] whitespace-nowrap">{s.time}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate ? onNavigate("Vehicle Schedule") : window.location.href = "/admin/schedules"}
              className="mt-4 w-full py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] font-bold text-[#1e3a8a] hover:bg-[#eff6ff] hover:border-[#1e3a8a]/20 transition-all cursor-pointer shadow-2xs flex items-center justify-center gap-2"
            >
              <Icon name="calendar_month" className="text-[17px]" />
              View Calendar
            </button>
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
