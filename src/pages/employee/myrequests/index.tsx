// src/pages/employee/my-requests/index.tsx
import { useState } from "react";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";

interface StepState { done: boolean; active?: boolean }
interface Request {
  id: string; title: string; location: string; date: string; pax: number;
  status: string; statusColor: string; priority: string; priorityColor: string;
  steps: StepState[];
}

const REQUESTS: Request[] = [
  {
    id: "#REQ-9012", title: "Airport Transfer - C-Level",
    location: "Soekarno-Hatta Int'l", date: "Oct 28, 14:30", pax: 1,
    status: "In Progress", statusColor: "bg-[#dce1ff] text-[#00236f]",
    priority: "URGENT", priorityColor: "text-[#ba1a1a]",
    steps: [{ done: true }, { done: true }, { done: true }, { done: true, active: true }],
  },
  {
    id: "#REQ-8291", title: "Site Visit - Tech Park",
    location: "Building B, Hub", date: "Oct 24, 09:00 AM", pax: 3,
    status: "In Progress", statusColor: "bg-[#dce1ff] text-[#00236f]",
    priority: "CRITICAL", priorityColor: "text-[#ba1a1a]",
    steps: [{ done: true }, { done: true, active: true }, { done: false }, { done: false }],
  },
  {
    id: "#REQ-8001", title: "Monthly Branch Review",
    location: "West Office Cluster", date: "Oct 20, 08:00 AM", pax: 5,
    status: "Closed", statusColor: "bg-[#f1f5f9] text-[#64748b]",
    priority: "NORMAL", priorityColor: "text-[#64748b]",
    steps: [{ done: true }, { done: true }, { done: true }, { done: true }],
  },
];

const STEP_LABELS = ["Submitted", "Approved", "Assigned", "Complete"];
const STEP_ICONS  = ["send", "approval", "person_add", "flag"];

interface Props { onNavigate?: (page: string) => void; }

export default function MyRequestsPage({ onNavigate = () => {} }: Props) {
  const [search,     setSearch]     = useState("");
  const [statusFilter, setStatus]   = useState("All Status");
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const filtered = REQUESTS.filter(r =>
    (statusFilter === "All Status" || r.status === statusFilter) &&
    (search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout
      activeNav="My Requests"
      onNavigate={p => onNavigate?.(p)}
      topbarTitle="Employee Dashboard"
      userName="Andi Sullivan"
      userRole="Employee"
      searchPlaceholder="Search requests, vehicles..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-6 animate-fadeup space-y-5">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#94a3b8]">
          <span className="hover:text-[#00236f] cursor-pointer" onClick={() => onNavigate?.("Dashboard")}>Portal</span>
          <Icon name="chevron_right" className="text-[15px]" />
          <span className="text-[#0f172a] font-semibold">My Requests</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">My Requests</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Monitor operational vehicle requests, approvals, driver assignments, and progress.</p>
          </div>
          <button
            onClick={() => onNavigate?.("Create Request")}
            className="flex items-center gap-2 h-10 px-5 bg-[#0f2a5e] hover:bg-[#1e3a8a] text-white rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95"
          >
            <Icon name="add" className="text-[17px]" />+ Create Request
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: "receipt_long",   iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]",   value: "24", label: "Total Requests",    sub: "Across all time" },
            { icon: "pending_actions",iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]",   value: "3",  label: "Pending Approval",  sub: "Action required",   live: true },
            { icon: "commute",        iconBg: "bg-[#e5eeff]", iconColor: "text-[#4059aa]",   value: "1",  label: "Active Requests",   sub: "Currently en route", active: true },
            { icon: "task_alt",       iconBg: "bg-[#f1f5f9]", iconColor: "text-[#64748b]",   value: "20", label: "Completed Requests",sub: "Successfully closed" },
          ].map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon name={c.icon} className={`${c.iconColor} text-[20px]`} />
                </div>
                {c.live && <span className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse" />}
                {c.active && <span className="w-2 h-2 rounded-full bg-[#4059aa] animate-pulse" />}
              </div>
              <div className={`text-[32px] font-bold leading-none ${c.active ? "text-[#4059aa]" : "text-[#0f172a]"}`}>{c.value}</div>
              <div className="text-[12px] font-semibold text-[#475569] mt-1">{c.label}</div>
              <div className="text-[11px] text-[#94a3b8] mt-0.5">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by title, ID, or driver..."
              className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 appearance-none pr-8">
            {["All Status","In Progress","Closed","Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
            <Icon name="calendar_today" className="text-[15px]" />Select Date Range
          </button>
          <button className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
            <Icon name="sort" className="text-[15px]" />Sort
          </button>
        </div>

        {/* Request Cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const isExpanded = expanded === r.id;
            const currentStep = r.steps.findIndex(s => s.active) !== -1
              ? r.steps.findIndex(s => s.active)
              : r.steps.filter(s => s.done).length - 1;

            return (
              <div key={r.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                  r.status === "In Progress" ? "border-[#b6c4ff]" : "border-[#e2e8f0]"
                }`}
              >
                <div className="p-5">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-[#00236f] bg-[#e5eeff] px-2 py-0.5 rounded-full">{r.id}</span>
                        {r.status === "In Progress" && (
                          <span className="text-[10px] font-bold text-[#4059aa] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4059aa] animate-pulse" />
                            IN PROGRESS
                          </span>
                        )}
                      </div>
                      <h4 className="text-[16px] font-bold text-[#0f172a]">{r.title}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#64748b]">
                        <span className="flex items-center gap-1"><Icon name="location_on" className="text-[14px]" />{r.location}</span>
                        <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{r.date}</span>
                        <span className="flex items-center gap-1"><Icon name="groups" className="text-[14px]" />{r.pax} Pax</span>
                      </div>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-0 relative mx-4">
                      <div className="absolute top-4 left-5 right-5 h-0.5 bg-[#e2e8f0]" />
                      {r.steps.map((s, si) => (
                        <div key={si} className="flex flex-col items-center relative z-10" style={{ width: 70 }}>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            s.done && !s.active
                              ? "bg-[#1a6e3c] border-[#1a6e3c] shadow-sm"
                              : s.active
                              ? "bg-white border-[#ff8c00] ring-4 ring-[#ffd9b0]"
                              : "bg-white border-[#e2e8f0]"
                          }`}>
                            {s.done && !s.active
                              ? <Icon name="check" className="text-white text-[14px]" />
                              : s.active
                              ? <Icon name={STEP_ICONS[si]} className="text-[#ff8c00] text-[14px]" />
                              : <Icon name={STEP_ICONS[si]} className="text-[#e2e8f0] text-[14px]" />
                            }
                          </div>
                          <div className={`text-[9px] font-bold mt-1.5 uppercase tracking-wider ${
                            s.done || s.active ? (si <= currentStep ? "text-[#1a6e3c]" : "text-[#64748b]") : "text-[#e2e8f0]"
                          }`}>{STEP_LABELS[si]}</div>
                        </div>
                      ))}
                    </div>

                    {/* Right: status + actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${r.statusColor}`}>{r.status}</span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${r.priorityColor}`}>
                        {r.priority !== "NORMAL" && <Icon name="warning" className="text-[12px]" />}
                        {r.priority}
                      </span>
                      <button
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        className="text-[12px] font-bold text-[#00236f] border border-[#00236f]/20 px-3 py-1.5 rounded-lg hover:bg-[#e5eeff] transition-colors"
                      >
                        {isExpanded ? "Hide Detail" : "View Details"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#f1f5f9] animate-fadeup">
                      <div className="grid grid-cols-3 gap-4 text-[12px]">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Request ID</div>
                          <div className="font-bold text-[#00236f]">{r.id}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Destination</div>
                          <div className="font-semibold text-[#0f172a]">{r.location}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Schedule</div>
                          <div className="font-semibold text-[#0f172a]">{r.date}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button className="h-8 px-4 bg-[#0f2a5e] text-white rounded-lg text-[11px] font-bold hover:bg-[#1e3a8a] transition-colors">
                          Track Real-time
                        </button>
                        <button className="h-8 px-4 border border-[#e2e8f0] text-[#475569] rounded-lg text-[11px] font-bold hover:bg-[#f8fafc] transition-colors">
                          Contact Driver
                        </button>
                        {r.status !== "Closed" && (
                          <button className="h-8 px-4 border border-[#fecdd3] text-[#ba1a1a] rounded-lg text-[11px] font-bold hover:bg-[#fff1f2] transition-colors">
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pb-4">
          <span className="text-[12px] text-[#94a3b8]">Showing 1-10 of {filtered.length} requests</span>
          <div className="flex items-center gap-1.5">
            <button className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center opacity-40" disabled>
              <Icon name="chevron_left" className="text-[18px]" />
            </button>
            {[1,2,3].map(n => (
              <button key={n} className={`w-8 h-8 rounded-lg text-[12px] font-bold border transition-colors ${n===1?"bg-[#0f2a5e] text-white border-[#0f2a5e]":"border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"}`}>{n}</button>
            ))}
            <button className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
              <Icon name="chevron_right" className="text-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}