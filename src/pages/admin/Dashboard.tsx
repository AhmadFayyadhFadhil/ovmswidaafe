import { useState } from "react";
import { Layout, Icon } from "../../components/layout/layout.tsx";
import { useApi } from "../../hooks/useApi.ts";
import { requestService } from "../../services/requestService.ts";

// ── Types ────────────────────────────────────
interface StatCard { icon: string; iconBg: string; iconColor: string; value: string; label: string; barColor: string; barWidth: string; trend?: string }
interface Schedule { month: string; day: string; title: string; sub: string; time: string; accentColor: string }
interface Request  { id: string; initials: string; name: string; destination: string; vehicle: string; driver: string; date: string; status: "Approved" | "Pending" | "Rejected"; priority: "HIGH" | "MEDIUM" | "LOW" }

// ── Data ─────────────────────────────────────
const STATS: StatCard[] = [
  { icon: "directions_car", iconBg: "bg-[#e8edf8]",  iconColor: "text-[#1e3a8a]", value: "120", label: "Total Vehicles",   barColor: "bg-[#1e3a8a]",  barWidth: "85%"},
  { icon: "check_circle",   iconBg: "bg-[#dcfce7]",  iconColor: "text-[#16a34a]", value: "67",  label: "Available",        barColor: "bg-[#22c55e]",  barWidth: "56%" },
  { icon: "commute",        iconBg: "bg-[#e0f2fe]",  iconColor: "text-[#0369a1]", value: "45",  label: "In Use",           barColor: "bg-[#0ea5e9]",  barWidth: "38%" },
  { icon: "pending_actions",iconBg: "bg-[#fff7ed]",  iconColor: "text-[#c2410c]", value: "18",  label: "Pending Requests", barColor: "bg-[#f97316]",  barWidth: "15%" },
  { icon: "badge",          iconBg: "bg-[#ede9fe]",  iconColor: "text-[#6d28d9]", value: "42",  label: "Active Drivers",   barColor: "bg-[#8b5cf6]",  barWidth: "90%" },
];

const SCHEDULES: Schedule[] = [
  { month: "OCT", day: "14", title: "Executive M...",   sub: "Toyota Camry - JFK Airport",    time: "08:30", accentColor: "#1e3a8a" },
  { month: "OCT", day: "14", title: "Site Inspection",  sub: "Ford Ranger - Project Alpha",   time: "10:15", accentColor: "#0369a1" },
  { month: "OCT", day: "15", title: "Logistics Su...",  sub: "Isuzu Truck - Warehouse",       time: "09:00", accentColor: "#c2410c" },
];

// Requests will be loaded from backend

// ── Sub-components ───────────────────────────
function StatusBadge({ status }: { status: Request["status"] }) {
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
}

function PriorityBadge({ priority }: { priority: Request["priority"] }) {
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
}

// ── Chart ────────────────────────────────────
function UsageChart() {
  const thisWeek  = "M 44,188 C 80,188 100,148 140,120 S 200,96 240,104 S 300,148 340,96 S 400,24 440,40 S 500,56 536,88 S 590,148 626,120";
  const prevWeek  = "M 44,164 C 80,160 110,172 150,180 S 210,144 255,136 S 320,116 360,128 S 420,152 460,136 S 510,120 560,124 S 600,108 626,100";
  const fillPath  = thisWeek + " L 626,210 L 44,210 Z";

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
        <path d={prevWeek} fill="none" stroke="#93c5fd" strokeWidth="1.8" strokeDasharray="6 4" strokeOpacity="0.8" />
        <path d={fillPath} fill="url(#waveGrad)" />
        <path d={thisWeek} fill="none" stroke="#1e3a8a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="440" cy="40" r="5.5" fill="#1e3a8a" />
        <circle cx="440" cy="40" r="11" fill="none" stroke="#1e3a8a" strokeWidth="1.5" strokeOpacity="0.25">
          <animate attributeName="r"              from="6"   to="18"  dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" from="0.4" to="0"   dur="1.8s" repeatCount="indefinite" />
        </circle>
        <g>
          <rect x="390" y="10" width="100" height="26" rx="6" fill="#1e3a8a" />
          <polygon points="435,36 445,36 440,44" fill="#1e3a8a" />
          <text x="440" y="28" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="Inter, sans-serif">
            Usage: 84%
          </text>
        </g>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex" style={{ paddingLeft: 30, paddingRight: 16 }}>
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
          <div key={d} className="flex-1 text-center" style={{ fontSize: 12, color: d === "Fri" ? "#1e3a8a" : "#94a3b8", fontWeight: d === "Fri" ? 700 : 500 }}>
            {d}
            {d === "Fri" && <div className="w-1 h-1 rounded-full bg-[#1e3a8a] mx-auto mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [statusFilter, setStatusFilter] = useState("All Status");

  // fetch requests from backend and map to UI shape
  const { data: fetchedRequests, loading: reqLoading, error: reqError, refetch } = useApi(async () => {
    const res = await requestService.getAll();
    return { data: res.data };
  }, true, []);

  const requests: Request[] = (fetchedRequests || []).map((r: any) => {
    const name = r.employee || r.fullName || "Unknown";
    const initials = name.split(" ").map((p:string)=>p[0]).slice(0,2).join("").toUpperCase() || "";
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
      destination: r.destination || r.destinationAddress || "",
      vehicle,
      driver,
      date: r.date || r.dateLabel || "",
      status: status as Request["status"],
      priority: priority as Request["priority"],
    } as Request;
  });

  const filtered = statusFilter === "All Status"
    ? requests
    : requests.filter(r => r.status === statusFilter);

  return (
    <Layout
      activeNav="Dashboard"
      onNavigate={onNavigate}
      topbarTitle="Dashboard"
      searchPlaceholder="Search dashboard..."
    >
      <div className="p-6 space-y-5 animate-fadein">
        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-6 gap-3">
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
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-5">
                <span className="text-[16px] font-bold text-[#0f172a]">Vehicle Usage Analytics</span>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#1e3a8a]" />
                    <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">This Week</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#93c5fd" strokeWidth="2" strokeDasharray="4 3" /></svg>
                    <span className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Prev. Week</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select className="text-[12px] font-semibold border border-[#e2e8f0] rounded-lg px-3 py-1.5 text-[#475569] bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer">
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
                <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] transition-colors">
                  <Icon name="more_vert" className="text-[#94a3b8] text-[20px]" />
                </button>
              </div>
            </div>
            <UsageChart />
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
            <button className="mt-4 w-full py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] font-bold text-[#1e3a8a] hover:bg-[#eff6ff] hover:border-[#1e3a8a]/20 transition-all">
              View Calendar
            </button>
          </div>
        </div>

        {/* ── REQUESTS TABLE ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <div>
              <div className="text-[16px] font-bold text-[#0f172a]">Active Fleet Requests</div>
              <div className="text-[12.5px] text-[#64748b] mt-0.5">Real-time monitoring of all vehicle assignments</div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Icon name="filter_list" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[16px]" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="pl-8 pr-8 py-2 text-[12px] font-semibold text-[#475569] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer appearance-none"
                >
                  {["All Status","Approved","Pending","Rejected"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <button className="flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white px-4 py-2 rounded-lg text-[13px] font-bold transition-colors shadow-sm">
                <Icon name="add" className="text-[18px]" />
                New Request
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
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
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc]">
                  {["ID","EMPLOYEE","DESTINATION","VEHICLE/DRIVER","DATE","STATUS","PRIORITY","ACTIONS"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10.5px] font-bold text-[#94a3b8] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr
                    key={req.id}
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
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 rounded-lg hover:bg-[#eff6ff] flex items-center justify-center transition-colors">
                          <Icon name="visibility" className="text-[#1e3a8a] text-[16px]" />
                        </button>
                        <button className="w-7 h-7 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center transition-colors">
                          <Icon name="edit" className="text-[#64748b] text-[16px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
            <span className="text-[12px] text-[#94a3b8]">Showing {filtered.length} of 124 results</span>
            <div className="flex items-center gap-1.5">
              <button disabled className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center opacity-40 cursor-not-allowed">
                <Icon name="chevron_left" className="text-[#475569] text-[18px]" />
              </button>
              {[1,2,3].map(n => (
                <button key={n} className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${n === 1 ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"}`}>
                  {n}
                </button>
              ))}
              <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
                <Icon name="chevron_right" className="text-[#475569] text-[18px]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
