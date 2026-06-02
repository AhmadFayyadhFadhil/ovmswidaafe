import { useState } from "react";
import { Layout, Icon } from "../../../components/layout/RoleLayout.tsx";
import { useApi } from "../../../hooks/useApi.ts";
import { auditLogService } from "../../../services/modules/auditLogService.ts";

// Audit logs will be loaded from backend via `auditLogService.getAll()`

// ── Severity styling ──────────────────────────
const SEV: Record<string, { badge: string; dot: string; row: string }> = {
  Critical: { badge: "bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]", dot: "bg-[#dc2626]", row: "bg-[#fff5f5]" },
  High:     { badge: "bg-[#fff7ed] text-[#d97706] border border-[#fcd34d]", dot: "bg-[#f59e0b]", row: "" },
  Medium:   { badge: "bg-[#eff6ff] text-[#3b82f6] border border-[#93c5fd]", dot: "bg-[#3b82f6]", row: "" },
  Low:      { badge: "bg-[#f0fdf4] text-[#16a34a] border border-[#86efac]", dot: "bg-[#22c55e]", row: "" },
};

// ── Donut gauge ───────────────────────────────
function Donut({ pct, color, size = 72 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 8, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${(pct/100)*c} ${c}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize="13" fontWeight="800"
        fill="#0f172a" fontFamily="Inter,sans-serif">{pct}%</text>
    </svg>
  );
}

// ── Mini sparkbar ─────────────────────────────
function MiniSparkbar({ vals, colors }: { vals: number[]; colors: string[] }) {
  const max = Math.max(...vals);
  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {vals.map((v, i) => (
        <div key={i} className={`flex-1 rounded-sm ${colors[i] || colors[colors.length - 1]}`}
          style={{ height: `${(v / max) * 100}%`, minHeight: 2 }} />
      ))}
    </div>
  );
}

// ── Avatar ────────────────────────────────────
function Avatar({ name, img }: { name: string; img: string }) {
  const initials = name === "System Automator" ? "SA"
    : name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bgColor = name === "System Automator" ? "bg-[#1e3a8a]"
    : name === "k.thompson" ? "bg-[#dc2626]" : "bg-[#e2e8f0]";
  return img ? (
    <img src={img} alt={name} className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0]"
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
  ) : (
    <div className={`w-9 h-9 rounded-full ${bgColor} flex items-center justify-center text-[11px] font-bold text-white border border-[#e2e8f0]`}>
      {initials}
    </div>
  );
}

// ── Main Component ────────────────────────────
export default function AuditLogsView({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [severityF,    setSeverityF]    = useState("All");
  const [userRoleF,    setUserRoleF]    = useState("All");
  const [departmentF,  setDepartmentF]  = useState("All");
  const [search,       setSearch]       = useState("");
  const [blockClicked, setBlockClicked] = useState(false);
  const [alertDismiss, setAlertDismiss] = useState(false);

  // fetch audit logs from backend
  const { data: fetchedLogs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useApi(async () => {
    const res = await auditLogService.getAll();
    return { data: res.data };
  }, true, []);

  const LOGS = (fetchedLogs || []).map((a: any) => ({
    id: a.id,
    name: a.user || a.user || "Unknown",
    role: a.role || "",
    img: a.avatarUrl || "",
    activity: a.activityType || a.activity || "",
    action: a.action || "",
    department: a.department || "",
    severity: a.severity === "Normal" ? "Medium" : (a.severity || "Low"),
    email: a.ipAddress || a.email || "",
    time: a.timestamp || "",
  }));

  const filtered = LOGS.filter(l =>
    (severityF === "All" || l.severity === severityF) &&
    (userRoleF === "All" || l.role === userRoleF) &&
    (departmentF   === "All" || l.department === departmentF) &&
    (search === "" ||
      (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.id || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.activity || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout
      activeNav="Audit Logs"
      onNavigate={onNavigate}
      topbarTitle="Audit Logs"
      searchPlaceholder="Search audit logs..."
      userName="Admin User"
      userRole="Administrator"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-5 flex gap-4">

            {/* ── LEFT MAIN COLUMN ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* Page header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[24px] font-bold text-[#0f172a]">Audit Logs</h2>
                  <p className="text-[12.5px] text-[#64748b] mt-0.5 max-w-lg">
                    Monitor system activities, operational events, and security logs for comprehensive oversight of the enterprise fleet environment.
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button className="flex items-center gap-1.5 h-9 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[12px] font-bold shadow-sm transition-all active:scale-95">
                    <Icon name="download" className="text-[16px]" />Download Report
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-6 gap-3">
                {[
                  { label:"Total Logs",       value:"12.4k",  icon:"database",        bg:"bg-[#e8edf8]", col:"text-[#1e3a8a]",  vals:[4,5,4,6,5,7,8], colors:["bg-[#bfdbfe]","bg-[#bfdbfe]","bg-[#bfdbfe]","bg-[#bfdbfe]","bg-[#bfdbfe]","bg-[#bfdbfe]","bg-[#1e3a8a]"] },
                  { label:"Security Alerts",  value:"03",     icon:"shield",          bg:"bg-[#fee2e2]", col:"text-[#dc2626]",  vals:[2,3,2,4,3,5,4], colors:["bg-[#fecaca]","bg-[#fecaca]","bg-[#fecaca]","bg-[#ef4444]","bg-[#fecaca]","bg-[#ef4444]","bg-[#dc2626]"] },
                  { label:"Failed Logins",    value:"24",     icon:"login",           bg:"bg-[#f1f5f9]", col:"text-[#64748b]",  vals:[5,6,4,7,5,6,8], colors:["bg-[#e2e8f0]","bg-[#e2e8f0]","bg-[#e2e8f0]","bg-[#cbd5e1]","bg-[#e2e8f0]","bg-[#cbd5e1]","bg-[#94a3b8]"] },
                  { label:"Permissions",      value:"18",     icon:"key",             bg:"bg-[#f1f5f9]", col:"text-[#64748b]",  vals:[4,4,5,4,5,4,5], colors:["bg-[#e2e8f0]","bg-[#e2e8f0]","bg-[#e2e8f0]","bg-[#e2e8f0]","bg-[#cbd5e1]","bg-[#e2e8f0]","bg-[#94a3b8]"] },
                  { label:"Operational",      value:"142",    icon:"settings",        bg:"bg-[#e0f2fe]", col:"text-[#0369a1]",  vals:[5,6,7,6,8,7,9], colors:["bg-[#bae6fd]","bg-[#bae6fd]","bg-[#7dd3fc]","bg-[#bae6fd]","bg-[#38bdf8]","bg-[#7dd3fc]","bg-[#0ea5e9]"] },
                  { label:"Suspicious",       value:"02",     icon:"verified_user",   bg:"bg-[#e8edf8]", col:"text-[#1e3a8a]",  vals:[1,0,1,0,1,0,1], colors:["bg-[#e2e8f0]","bg-[#f1f5f9]","bg-[#e2e8f0]","bg-[#f1f5f9]","bg-[#cbd5e1]","bg-[#f1f5f9]","bg-[#94a3b8]"] },
                ].map(c => (
                  <div key={c.label} className="bg-white rounded-2xl p-4 border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center`}>
                        <Icon name={c.icon} className={`${c.col} text-[17px]`} />
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full $`}>
                        
                      </span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mt-2">{c.label}</div>
                    <div className="text-[22px] font-bold text-[#0f172a] leading-tight">{c.value}</div>
                    <MiniSparkbar vals={c.vals} colors={c.colors} />
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="grid grid-cols-4 gap-3">
                  <button className="flex items-center gap-2 h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] hover:border-[#1e3a8a]/30 hover:bg-[#eff6ff] transition-colors">
                    <Icon name="calendar_today" className="text-[15px] text-[#94a3b8]" />
                    Date Range: Last 24 Hours
                    <Icon name="keyboard_arrow_down" className="text-[15px] text-[#94a3b8] ml-auto" />
                  </button>
                  <select value={userRoleF} onChange={e => setUserRoleF(e.target.value)}
                    className="h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all">
                    <option value="All">User Role: All</option>
                    <option>Employee</option>
                    <option>Driver</option>
                    <option>Approver</option>
                    <option>Internal Bot</option>
                    <option>Administrator</option>
                  </select>
                  <select value={severityF} onChange={e => setSeverityF(e.target.value)}
                    className="h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all">
                    <option value="All">Severity: All</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                  <div className="flex gap-2">
                    <select value={departmentF} onChange={e => setDepartmentF(e.target.value)}
                      className="flex-1 h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20">
                      <option value="All">Department: All</option>
                      <option>IT</option>
                      <option>FA</option>
                      <option>QA</option>
                      <option>HRD & GA</option>
                      <option>Production</option>
                      <option>Engineering</option>
                      <option>Technical</option>
                    </select>
                    <button onClick={() => { setSeverityF("All"); setUserRoleF("All"); setDepartmentF("All"); setSearch(""); }}
                      className="w-10 h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center hover:bg-[#eff6ff] hover:border-[#1e3a8a]/30 transition-colors" title="Refresh">
                      <Icon name="refresh" className="text-[#64748b] text-[18px]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Log Table */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                        {["ID","USER","ACTIVITY TYPE","DEPARTMENT","SEVERITY","EMAIL","TIME"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                  </thead>
                  <tbody>
                      {logsLoading && (
                        <tr><td colSpan={7} className="px-4 py-6 text-center text-[13px] text-[#475569]">Loading logs...</td></tr>
                      )}
                      {logsError && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-[13px] text-[#b91c1c]">
                            Failed to load logs. <button onClick={() => refetchLogs()} className="ml-3 px-3 py-1 bg-[#1e3a8a] text-white rounded-lg">Retry</button>
                          </td>
                        </tr>
                      )}
                    {filtered.map((log, i) => (
                      <tr key={log.id}
                        className={`border-b border-[#f8fafc] hover:bg-[#f8fafc] transition-all group ${log.severity === "Critical" ? "bg-[#fff8f8]" : ""}`}
                        style={{ animation: `fadeSlideIn 0.2s ease-out ${i * 40}ms both` }}>
                        <td className="px-4 py-4">
                          <span className="text-[12px] font-bold text-[#1e3a8a]">{log.id}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={log.name} img={log.img} />
                            <div>
                              <div className="text-[12px] font-bold text-[#0f172a]">{log.name}</div>
                              <div className="text-[10px] text-[#94a3b8]">{log.role}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[12px] font-semibold text-[#0f172a]">{log.activity}</div>
                          <div className="text-[10.5px] text-[#94a3b8]">Action: {log.action}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#475569] rounded-lg text-[11px] font-semibold">
                            {log.department}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${SEV[log.severity].badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${SEV[log.severity].dot} ${log.severity === "Critical" ? "animate-pulse" : ""}`} />
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[12px] text-[#64748b]">{log.email}</td>
                        <td className="px-4 py-4 text-[11px] text-[#94a3b8]">{log.time}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-[13px] text-[#94a3b8]">No logs match the current filters.</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
                  <span className="text-[12px] text-[#94a3b8]">
                    Showing <b>1–{filtered.length}</b> of <b>12,441</b> entries
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center opacity-40" disabled>
                      <Icon name="chevron_left" className="text-[16px]" />
                    </button>
                    {[1,2,3,"…","1244"].map((n,i) => (
                      <button key={i} className={`h-7 px-2 rounded text-[12px] font-semibold border transition-colors ${n===1?"bg-[#1e3a8a] text-white border-[#1e3a8a]":"border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"}`}>{n}</button>
                    ))}
                    <button className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9]">
                      <Icon name="chevron_right" className="text-[16px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT SIDEBAR ── */}
            <div className="w-[240px] flex-shrink-0 space-y-4">

              {/* Critical Alert Card */}
              {!alertDismiss && (
                <div className="bg-white rounded-2xl border-2 border-[#fca5a5] shadow-md p-4 animate-pulse-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-[#fee2e2] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon name="warning" className="text-[#dc2626] text-[17px]" />
                    </div>
                    <span className="text-[14px] font-bold text-[#dc2626]">Critical Alert</span>
                  </div>
                  <p className="text-[12px] text-[#dc2626] leading-relaxed mb-3">
                    Brute force attempt detected on Admin portal from unauthorized IP range (Region: Unknown).
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setBlockClicked(true)}
                      className={`flex-1 py-2 rounded-xl text-[12px] font-bold transition-all active:scale-95 ${blockClicked ? "bg-[#16a34a] text-white" : "bg-[#dc2626] hover:bg-[#b91c1c] text-white"}`}>
                      {blockClicked ? "✓ Blocked" : "Block IP"}
                    </button>
                    <button onClick={() => setAlertDismiss(true)}
                      className="flex-1 py-2 rounded-xl border-2 border-[#fca5a5] text-[#dc2626] text-[12px] font-bold hover:bg-[#fff1f2] transition-colors">
                      Details
                    </button>
                  </div>
                </div>
              )}

              {/* Compliance Status */}
              <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
                <div className="text-[11px] font-bold uppercase tracking-widest text-[#94a3b8] mb-4">Compliance Status</div>
                <div className="flex items-center gap-3 mb-4">
                  <Donut pct={92} color="#1e3a8a" />
                  <div>
                    <div className="text-[14px] font-bold text-[#0f172a]">Data Integrity</div>
                    <div className="text-[11px] text-[#94a3b8]">Last audit 2h ago</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label:"Retention Status", badge:"OK",     badgeBg:"bg-[#dcfce7] text-[#16a34a]" },
                    { label:"Log Encryption",   badge:"ACTIVE", badgeBg:"bg-[#dcfce7] text-[#16a34a]" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#f1f5f9] last:border-0">
                      <span className="text-[12px] text-[#475569] font-medium">{item.label}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.badgeBg}`}>{item.badge}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>{/* end right sidebar */}
          </div>

      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
        .material-symbols-outlined{font-family:'Material Symbols Outlined';font-weight:normal;font-style:normal;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;vertical-align:middle;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:8px;}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse-border{0%,100%{border-color:#fca5a5}50%{border-color:#ef4444}}
        .animate-pulse-border{animation:pulse-border 2s ease-in-out infinite;}
      `}</style>
    </Layout>
  );
}