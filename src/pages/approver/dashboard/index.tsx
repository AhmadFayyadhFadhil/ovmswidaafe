import { Layout, Icon } from "@/components/layout/RoleLayout";
import type { ActivityItem, PendingRequest } from "@/config/data";
import { ACTIVITY_FEED, DASHBOARD_PENDING } from "@/config/data";

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
  return (
    <div className="border border-[#e2e8f0] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
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
        <PriBadge p={req.priority} />
      </div>

      {/* Detail strip */}
      <div className="mx-4 mb-4 bg-[#f8faff] border border-[#e5eeff] rounded-xl px-4 py-3 grid grid-cols-3 gap-4">
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
export default function DashboardPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <Layout
      activeNav="Dashboard"
      onNavigate={onNavigate}
      topbarTitle="Department Operations Dashboard"
      searchPlaceholder="Search operations..."
    >
      <div className="p-8 bg-[#f8f9ff] min-h-screen">
        {/* Page title + Quick Approval button */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a] leading-tight">
              Department Operations Dashboard
            </h2>
            <p className="text-[14px] text-[#64748b] mt-1">Monitor department approvals.</p>
          </div>
          <button
            onClick={() => onNavigate("Requests")}
            className="h-11 px-5 bg-[#1e3a8a] text-white text-[13px] font-bold rounded-xl hover:bg-[#1e40af] active:scale-95 transition-all flex items-center gap-2 shadow-sm"
          >
            <Icon name="bolt" className="text-[18px]" />
            Quick Approval
          </button>
        </div>

        {/* Hero banner */}
        <div className="relative bg-[#1e3a8a] rounded-2xl px-8 py-7 mb-7 overflow-hidden">
          {/* decorative star */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 opacity-10">
            <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
              <path d="M60 0 L65 55 L120 60 L65 65 L60 120 L55 65 L0 60 L55 55 Z" fill="white"/>
            </svg>
          </div>
          <div className="relative z-10">
            <div className="text-[22px] font-bold text-white mb-2">Good Morning, Head of IT 👋</div>
            <div className="text-[14px] text-white/65 max-w-lg leading-relaxed">
              Today's fleet operational density is at 74%. You have{" "}
              <span className="text-white font-semibold">12 pending requests</span> that require
              your attention before the 14:00 cutoff.
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-5 mb-7">
          <StatCard icon="pending_actions" label="Pending Approvals"  value="12"    iconBg="bg-[#f0f4ff]" iconColor="text-[#1e3a8a]" />
          <StatCard icon="list_alt"        label="Total Requests"     value="1,341" iconBg="bg-[#f0f4ff]" iconColor="text-[#1e3a8a]" />
          <StatCard icon="cancel"          label="Rejected Requests"  value="15"    iconBg="bg-[#fef2f2]" iconColor="text-[#dc2626]" />
          <StatCard icon="check_circle"    label="Approved Today"     value="45"    iconBg="bg-[#f0fdf4]" iconColor="text-[#16a34a]" />
        </div>

        {/* Two-column lower */}
        <div className="grid grid-cols-[1fr_300px] gap-5">
          {/* Latest pending */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-[16px] font-bold text-[#0f172a]">Latest Pending Requests</div>
                <div className="text-[12px] text-[#64748b] mt-0.5">
                  Immediate action required for next 24h operational cycle
                </div>
              </div>
              <button
                onClick={() => onNavigate("Requests")}
                className="text-[13px] font-semibold text-[#1e3a8a] hover:underline flex items-center gap-1"
              >
                View All Requests
                <Icon name="arrow_forward" className="text-[16px]" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {DASHBOARD_PENDING.map((req) => (
                <PendingRow key={req.id} req={req} />
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Icon name="history" className="text-[20px] text-[#64748b]" />
              <span className="text-[15px] font-bold text-[#0f172a]">Activity Feed</span>
            </div>
            <div>
              {ACTIVITY_FEED.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}