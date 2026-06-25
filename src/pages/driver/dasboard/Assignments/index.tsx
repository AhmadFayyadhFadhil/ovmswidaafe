import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export interface Assignment {
  id: string;
  avatar: string;
  requesterName: string;
  department: string;
  priority: "URGENT" | "NORMAL" | "CRITICAL";
  reqId: string;
  destination: string;
  date: string;
  time: string;
  vehicleType: string;
  purpose: string;
}

interface MyAssignmentsPageProps {
  assignments: Assignment[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function PriBadge({ p }: { p: Assignment["priority"] }) {
  const map: Record<Assignment["priority"], string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${map[p] || map.NORMAL}`}>{p}</span>
  );
}

function ReqIdBadge({ id }: { id: string }) {
  return (
    <span className="text-[10px] font-bold text-[#475569] bg-[#f1f5f9] border border-[#e2e8f0] px-2.5 py-1 rounded-lg">
      {id}
    </span>
  );
}

function AssignmentCard({ req, onApprove, onReject }: {
  req: Assignment;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl flex flex-col overflow-hidden hover:border-[#c7d7f7] hover:shadow-sm transition-all">
      <div className="p-5 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <img
              src={req.avatar} alt={req.requesterName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0] flex-shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
            />
            <div>
              <div className="text-[14px] font-bold text-[#0f172a]">{req.requesterName}</div>
              <div className="text-[11px] text-[#94a3b8]">{req.department}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <PriBadge p={req.priority} />
            <ReqIdBadge id={req.reqId} />
          </div>
        </div>

        <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl px-3 py-2.5 flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-[#eff4ff] rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="location_on" className="text-[15px] text-[#1e3a8a]" />
          </div>
          <div>
            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Destination</div>
            <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Date</div>
            <div className="font-bold text-[#0f172a]">{req.date}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Time</div>
            <div className="font-bold text-[#0f172a]">{req.time}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Vehicle Type</div>
            <div className="font-bold text-[#0f172a]">{req.vehicleType}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Purpose</div>
            <div className="font-bold text-[#0f172a]">{req.purpose}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 px-5 py-4 border-t border-[#f1f5f9] bg-[#fafbff]">
        <button
          onClick={() => onApprove(req.id)}
          className="w-full sm:flex-1 h-9 bg-[#1e3a8a] text-white text-[12px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all cursor-pointer"
        >
          Approve
        </button>
        <button
          onClick={() => onReject(req.id)}
          className="w-full sm:flex-1 h-9 bg-white border border-[#dc2626] text-[#dc2626] text-[12px] font-bold rounded-xl hover:bg-[#fef2f2] active:scale-95 transition-all cursor-pointer"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function MyAssignmentsPage({ assignments, onApprove, onReject }: MyAssignmentsPageProps) {
  const [tab, setTab]             = useState<"All" | "Urgent" | "Normal">("All");
  const [search, setSearch]       = useState("");

  const filtered = assignments.filter((a) => {
    const matchTab =
      tab === "All" ||
      (tab === "Urgent" && (a.priority === "URGENT" || a.priority === "CRITICAL")) ||
      (tab === "Normal" && a.priority === "NORMAL");
    const q = search.toLowerCase();
    const matchQ = a.requesterName.toLowerCase().includes(q) || a.destination.toLowerCase().includes(q) || a.reqId.toLowerCase().includes(q);
    return matchTab && matchQ;
  });

  const total    = assignments.length;
  const normal   = assignments.filter((a) => a.priority === "NORMAL").length;
  const urgent   = assignments.filter((a) => a.priority === "URGENT").length;
  const critical = assignments.filter((a) => a.priority === "CRITICAL").length;

  return (
    <div className="p-4 sm:p-8">
      {/* Search Input bar */}
      <div className="relative mb-6 max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assignments..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
        />
      </div>

      <h2 className="text-[26px] font-bold text-[#0f172a] mb-1">My Operational Assignments</h2>
      <p className="text-[13px] text-[#64748b] mb-7">Monitor assigned transportation requests and operational activities.</p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-[#0f1f3d] rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Assignment</div>
            <Icon name="assignment" className="text-[20px] text-white/50" />
          </div>
          <div className="text-[40px] font-extrabold leading-none mb-2">{String(total).padStart(2, "0")}</div>
          <div className="text-[11px] text-white/50">All active requests</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Normal Status</div>
            <Icon name="info" className="text-[20px] text-[#0ea5e9]" />
          </div>
          <div className="text-[40px] font-extrabold text-[#0f172a] leading-none mb-2">{String(normal).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#94a3b8]">Standard priority</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Urgent Status</div>
            <Icon name="error_outline" className="text-[20px] text-[#f97316]" />
          </div>
          <div className="text-[40px] font-extrabold text-[#0f172a] leading-none mb-2">{String(urgent).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#94a3b8]">Requires attention</div>
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">Critical Status</div>
            <Icon name="close" className="text-[20px] text-[#ef4444]" />
          </div>
          <div className="text-[40px] font-extrabold text-[#0f172a] leading-none mb-2">{String(critical).padStart(2, "0")}</div>
          <div className="text-[11px] text-[#94a3b8]">Immediate action</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-bold text-[#0f172a]">Pending Assignment</span>
          <div className="flex gap-1 bg-[#f1f5f9] rounded-xl p-1">
            {(["All", "Urgent", "Normal"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 h-8 rounded-lg text-[12px] font-semibold transition-all ${
                  tab === t ? "bg-[#1e3a8a] text-white shadow-sm" : "text-[#64748b] hover:text-[#334155]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
          <Icon name="inbox" className="text-[40px] text-[#cbd5e1] mb-2" />
          <p className="font-bold text-[#0f172a]">No assignments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((a) => (
            <AssignmentCard
              key={a.id} req={a}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
