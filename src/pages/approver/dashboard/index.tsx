import { useNavigate } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { auditLogService } from "@/services/modules/auditLogService";
import { useAuthContext } from "@/auth/authContext";

interface PendingRequest {
  id: string;
  reqId: string;
  requesterName: string;
  role: string;
  department: string;
  avatar: string;
  priority: "URGENT" | "NORMAL" | "CRITICAL";
  destination: string;
  schedule: string;
  passengers: string;
  rawStatus?: string;
  approvals?: any[];
}

interface ActivityItem {
  id: string;
  type: "approved" | "new" | "rejected";
  text: string;
  time: string;
}

// ── Status Mapping Helpers ──────────────────────────────────────────────────
function getStageLabel(rawStatus: string | undefined) {
  switch (rawStatus) {
    case "submitted":
      return "MENUNGGU DEPT HEAD";
    case "approved_department":
      return "MENUNGGU K.DEP HRD&GA";
    case "approved_hrd_ga":
    case "approved_hrd":
      return "MENUNGGU DRIVER";
    case "waiting_driver":
      return "MENUNGGU KONFIRMASI DRIVER";
    case "driver_assigned":
      return "TERJADWAL";
    case "on_going":
      return "BERJALAN";
    case "completed":
      return "SELESAI";
    case "rejected":
      return "DITOLAK";
    default:
      return rawStatus?.toUpperCase() || "PENDING";
  }
}

function getStatusBadgeStyle(rawStatus: string | undefined) {
  switch (rawStatus) {
    case "completed":
      return "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]";
    case "rejected":
      return "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]";
    case "on_going":
      return "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]";
    case "driver_assigned":
      return "bg-[#f5f3ff] text-[#7c3aed] border border-[#ddd6fe]";
    case "approved_hrd_ga":
    case "approved_hrd":
      return "bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]";
    default:
      return "bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]";
  }
}

// ── Priority badge ─────────────────────────────────────────────────────────
function PriBadge({ p }: { p: string }) {
  const cfg: Record<string, string> = {
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
  };
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg[p] ?? cfg.NORMAL}`}>
      {p} PRIORITY
    </span>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, iconBg, iconColor }: {
  icon: string; label: string; value: string; iconBg: string; iconColor: string;
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon name={icon} className={`text-[22px] ${iconColor}`} />
      </div>
      <div className="text-[13px] text-[#64748b] font-medium mb-1">{label}</div>
      <div className="text-[32px] font-bold text-[#0f172a] leading-none">{value}</div>
    </div>
  );
}

// ── Pending request row ────────────────────────────────────────────────────
function PendingRow({ req }: { req: PendingRequest }) {
  const approvals = req.approvals || [];
  const isDeptHeadApproved = approvals.some((a: any) => a.role === 'dept_head' && a.status === 'approved');
  const isHrdApproved = approvals.some((a: any) => a.role === 'hrd_head' && a.status === 'approved');
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate("/approver/requests")}
      className="border border-[#e2e8f0] rounded-2xl overflow-hidden bg-white hover:border-[#1e3a8a] hover:shadow-xs transition-all cursor-pointer"
      title="Klik untuk melihat detail & memproses request ini"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src={req.avatar}
            alt={req.requesterName}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0]"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
          />
          <div>
            <div className="text-[14px] font-bold text-[#0f172a]">{req.requesterName}</div>
            <div className="text-[12px] text-[#64748b]">{req.role} • {req.department}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriBadge p={req.priority} />
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getStatusBadgeStyle(req.rawStatus)}`}>
            {getStageLabel(req.rawStatus)}
          </span>
        </div>
      </div>

      {/* Detail strip */}
      <div className="mx-4 mb-4 bg-[#f8faff] border border-[#e5eeff] rounded-xl px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Icon name="location_on" className="text-[14px] text-[#94a3b8]" /> Destination
          </div>
          <div className="text-[13px] font-semibold text-[#0f172a]">{req.destination}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Icon name="calendar_month" className="text-[14px] text-[#94a3b8]" /> Schedule
          </div>
          <div className="text-[13px] font-semibold text-[#0f172a]">{req.schedule}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-1 flex items-center gap-1">
            <Icon name="group" className="text-[14px] text-[#94a3b8]" /> Passengers
          </div>
          <div className="text-[13px] font-semibold text-[#0f172a]">{req.passengers}</div>
        </div>
      </div>

      {/* Approvals checklist footer */}
      <div className="px-5 py-3 bg-[#fafbfc] border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold">
            <Icon 
              name={isDeptHeadApproved ? "check_circle" : "radio_button_unchecked"} 
              className={isDeptHeadApproved ? "text-green-600 text-[15px]" : "text-gray-400 text-[15px]"} 
            />
            <span className={isDeptHeadApproved ? "text-green-800" : "text-gray-500"}>
              Approve K.Dep Asal
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <Icon 
              name={isHrdApproved ? "check_circle" : "radio_button_unchecked"} 
              className={isHrdApproved ? "text-green-600 text-[15px]" : "text-gray-400 text-[15px]"} 
            />
            <span className={isHrdApproved ? "text-green-800" : "text-gray-500"}>
              Approve K.Dep HRD&GA
            </span>
          </div>
        </div>
        <span className="text-[11px] text-[#94a3b8] font-bold">ID: {req.reqId}</span>
      </div>
    </div>
  );
}

// ── Activity feed item ─────────────────────────────────────────────────────
function ActivityRow({ item }: { item: ActivityItem }) {
  const cfg = {
    approved: { icon: "check_circle", cls: "text-[#16a34a] bg-[#f0fdf4]" },
    new:      { icon: "add_circle",   cls: "text-[#2563eb] bg-[#eff6ff]" },
    rejected: { icon: "cancel",       cls: "text-[#dc2626] bg-[#fef2f2]" },
  }[item.type];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f1f5f9] last:border-0">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
        <Icon name={cfg.icon} className={`text-[16px] ${cfg.cls.split(" ")[0]}`} />
      </div>
      <div>
        <div
          className="text-[13px] text-[#334155] leading-snug"
          dangerouslySetInnerHTML={{ __html: item.text.replace(/\b([A-Z]\.\s[A-Za-z]+|[A-Z][a-z]+ [A-Z][a-z]+|[A-Z]\. [A-Z][a-z]+|[A-Za-z]+ [A-Z][a-z]+)\b/g, '<strong>$1</strong>') }}
        />
        <div className="text-[11px] text-[#94a3b8] mt-0.5">{item.time}</div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const { data: dashboardData, loading } = useApi(async () => {
    const [reqsRes, logsRes] = await Promise.all([
      requestService.getAll({ per_page: 1000 }),
      auditLogService.getAll({ per_page: 1000 }).catch(err => {
        console.warn("Audit logs access restricted or failed", err);
        return { data: [] };
      }),
    ]);
    return {
      data: {
        requests: reqsRes.data || [],
        logs: logsRes.data || [],
      }
    };
  }, true, []);

  const requestsList = dashboardData?.requests || [];
  const logsList = dashboardData?.logs || [];

  // Metrics
  const isHrGaHead = user?.role === "approver" && 
    (user?.department_id === "HR&GA" || user?.department_id === "HRD&GA" || user?.department_id === "HRD & GA" || user?.department_name === "HRD & GA") && 
    !!user?.is_department_head;

  const totalRequestsCount = requestsList.length;
  const pendingCount = requestsList.filter(r => r.canApprove).length;
  const rejectedCount = requestsList.filter(r => r.rawStatus === "rejected").length;
  const approvedCount = requestsList.filter(r => ["approved_hrd", "approved_hrd_ga", "driver_assigned", "on_going", "completed"].includes(r.rawStatus || "")).length;

  const pendingRequests: PendingRequest[] = requestsList
    .filter(r => {
      const raw = (r.rawStatus || "").toLowerCase();
      if (["completed", "cancelled", "rejected"].includes(raw)) {
        return false;
      }
      if (isHrGaHead) {
        // Show pending approvals OR approved/ongoing active requests
        return r.canApprove || ["assigned_by_ga", "approved_hrd_ga", "approved_hrd", "waiting_driver", "driver_assigned", "on_going"].includes(r.rawStatus || "");
      }
      return r.canApprove;
    })
    .map(r => ({
      id: r.id,
      reqId: `#RQ-${r.id}`,
      requesterName: r.employee || "Staff",
      role: "Staff Member",
      department: r.department || "IT Department",
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.employee || "Staff")}&background=1e3a8a&color=fff`,
      priority: (r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL") as "URGENT" | "NORMAL" | "CRITICAL",
      destination: r.destination,
      schedule: `${r.date} ${r.time}`,
      passengers: "1 Person",
      rawStatus: r.rawStatus,
      approvals: r.approvals || [],
    }))
    .slice(0, 5);

  // Activity Feed mapped from Audit Logs
  const activityFeed: ActivityItem[] = logsList
    .map(log => {
      let type: "approved" | "new" | "rejected" = "new";
      if (log.action.toLowerCase().includes("approve")) type = "approved";
      else if (log.action.toLowerCase().includes("reject")) type = "rejected";

      return {
        id: log.id,
        type,
        text: `${log.user} performed ${log.action} on ${log.activityType}`,
        time: log.timestamp || "Recently",
      };
    })
    .slice(0, 4);

  return (
    <Layout
      activeNav="Dashboard"
      topbarTitle="Department Operations Dashboard"
      searchPlaceholder="Search operations..."
    >
      <div className="p-4 sm:p-8 bg-[#f8f9ff] min-h-screen">
        {/* Page title + Quick Approval button */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-[26px] font-bold text-[#0f172a] leading-tight">
              Department Operations Dashboard
            </h2>
            <p className="text-[14px] text-[#64748b] mt-1">Monitor department approvals.</p>
          </div>
          <button
            onClick={() => navigate("/approver/requests")}
            className="h-11 px-5 bg-[#1e3a8a] text-white text-[13px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all flex items-center gap-2 shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Icon name="bolt" className="text-[18px]" />
            Quick Approval
          </button>
        </div>

        {/* Hero banner */}
        <div className="relative bg-[#1e3a8a] rounded-2xl px-8 py-7 mb-7 overflow-hidden">
          <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-10">
            <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
              <path d="M60 0 L65 55 L120 60 L65 65 L60 120 L55 65 L0 60 L55 55 Z" fill="white"/>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="text-[22px] font-bold text-white mb-2">Welcome back, {user?.name || "Approver"} 👋</div>
            <div className="text-[14px] text-white/65 max-w-lg leading-relaxed">
              Today's fleet operational density is active. You have{" "}
              <span className="text-white font-semibold">{pendingCount} pending requests</span> that require
              your attention.
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
          <StatCard icon="pending_actions" label="Pending Approvals"  value={loading ? "..." : String(pendingCount)}    iconBg="bg-[#f0f4ff]" iconColor="text-[#1e3a8a]" />
          <StatCard icon="list_alt"        label="Total Requests"     value={loading ? "..." : String(totalRequestsCount)} iconBg="bg-[#f0f4ff]" iconColor="text-[#1e3a8a]" />
          <StatCard icon="cancel"          label="Rejected Requests"  value={loading ? "..." : String(rejectedCount)}    iconBg="bg-[#fef2f2]" iconColor="text-[#dc2626]" />
          <StatCard icon="check_circle"    label="Approved Trips"     value={loading ? "..." : String(approvedCount)}    iconBg="bg-[#f0fdf4]" iconColor="text-[#16a34a]" />
        </div>

        {/* Two-column lower */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          {/* Latest pending */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-5">
              <div>
                <div className="text-[15px] sm:text-[16px] font-bold text-[#0f172a]">Latest Pending Requests</div>
                <div className="text-[11.5px] sm:text-[12px] text-[#64748b] mt-0.5 leading-snug">
                  Immediate action required for next 24h operational cycle
                </div>
              </div>
              <button
                onClick={() => navigate("/approver/requests")}
                className="text-[12px] sm:text-[13px] font-bold text-[#1e3a8a] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                View All Requests
                <Icon name="arrow_forward" className="text-[15px]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {loading ? (
                <div className="p-8 text-center text-[#64748b]">Loading pending requests...</div>
              ) : pendingRequests.length === 0 ? (
                <div className="p-8 text-center text-[#94a3b8] font-semibold border border-dashed rounded-xl border-[#e2e8f0]">No pending requests.</div>
              ) : (
                pendingRequests.map((req) => (
                  <PendingRow key={req.id} req={req} />
                ))
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="history" className="text-[20px] text-[#64748b]" />
              <span className="text-[15px] font-bold text-[#0f172a]">Activity Feed</span>
            </div>
            <div>
              {loading ? (
                <div className="text-center text-[#64748b]">Loading activity...</div>
              ) : activityFeed.length === 0 ? (
                <div className="text-center text-[#94a3b8] py-8">No recent activity.</div>
              ) : (
                activityFeed.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}