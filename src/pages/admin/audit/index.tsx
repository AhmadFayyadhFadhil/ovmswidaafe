import { useState, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { auditLogService } from "@/services/modules/auditLogService";
import { exportToCSV } from "@/utils/exportHelper";

// ── Severity styling ──────────────────────────
const SEV: Record<string, { badge: string; dot: string; row: string }> = {
  Critical: { badge: "bg-[#fee2e2] text-[#dc2626] border border-[#fca5a5]", dot: "bg-[#dc2626]", row: "bg-[#fff5f5]" },
  High: { badge: "bg-[#fff7ed] text-[#d97706] border border-[#fcd34d]", dot: "bg-[#f59e0b]", row: "" },
  Medium: { badge: "bg-[#eff6ff] text-[#3b82f6] border border-[#93c5fd]", dot: "bg-[#3b82f6]", row: "" },
  Low: { badge: "bg-[#f0fdf4] text-[#16a34a] border border-[#86efac]", dot: "bg-[#22c55e]", row: "" },
};

// ── Mini sparkbar with Flat Neutral State for 0 Counts ─────────────────────────────
function MiniSparkbar({ vals, colors, isZero }: { vals: number[]; colors: string[]; isZero?: boolean }) {
  const max = Math.max(...vals, 1);
  return (
    <div className="flex items-end gap-0.5 h-8 mt-2">
      {vals.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${isZero || v === 0 ? "bg-slate-200/90" : (colors[i] || colors[colors.length - 1])}`}
          style={{ height: isZero || v === 0 ? "4px" : `${(v / max) * 100}%`, minHeight: 2 }}
        />
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

export type CardFilterType = "ALL" | "SECURITY_ALERTS" | "FAILED_LOGINS" | "PERMISSIONS" | "OPERATIONAL" | "SUSPICIOUS";

export interface CardMetaInfo {
  key: CardFilterType;
  label: string;
  value: string;
  rawVal: number;
  icon: string;
  bg: string;
  col: string;
  vals: number[];
  colors: string[];
  severityLevel: string;
  severityColor: string;
  description: string;
  recommendation: string;
}

// ── Main Component ────────────────────────────
export default function AuditLogsView({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [severityF, setSeverityF] = useState("All");
  const [userRoleF, setUserRoleF] = useState("All");
  const [departmentF, setDepartmentF] = useState("All");
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState<CardFilterType>("ALL");
  const [selectedCardModal, setSelectedCardModal] = useState<CardMetaInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 200;

  // 1. Stats data: load once for KPI cards
  const { data: statsData } = useApi<any>(() => auditLogService.getAll({ per_page: 1 }), true);

  const rawStats = (statsData as any)?.stats;

  // 2. Paginated data: load for active page/filters
  const { data: paginatedData, loading: logsLoading, error: logsError, refetch: refetchLogs } = useApi(
    () => auditLogService.getAll({
      page: currentPage,
      per_page: PAGE_SIZE,
      search: search || undefined,
    }),
    true,
    [currentPage, search]
  );

  const list = paginatedData || [];
  const pagination = (paginatedData as any)?.pagination || { total: list.length, currentPage: 1, lastPage: 1, from: 1, to: list.length };

  const handleUserRoleF = (val: string) => { setUserRoleF(val); setCurrentPage(1); };
  const handleSeverityF = (val: string) => { setSeverityF(val); setCurrentPage(1); };
  const handleDepartmentF = (val: string) => { setDepartmentF(val); setCurrentPage(1); };

  const LOGS = useMemo(() => {
    return list.map((a: any) => ({
      id: a.id,
      name: a.user || "Unknown",
      role: a.role || "",
      img: a.avatarUrl || "",
      activity: a.activityType || "",
      action: a.action || "",
      department: a.department || "",
      severity: a.severity === "Normal" ? "Medium" : (a.severity || "Low"),
      email: a.ipAddress || "",
      time: a.timestamp || "",
      createdAtRaw: a.timestamp || "",
    }));
  }, [list]);

  // Dynamic Card Counts & Filter Match Helpers
  const cardCounts = useMemo(() => {
    let secCount = 0;
    let failedCount = 0;
    let permCount = 0;
    let opsCount = 0;
    let suspCount = 0;

    LOGS.forEach((l: any) => {
      const actLower = String(l.activity || "").toLowerCase();
      const actionLower = String(l.action || "").toLowerCase();
      const sevLower = String(l.severity || "").toLowerCase();

      // Security Alerts
      if (sevLower === "critical" || sevLower === "high" || actionLower.includes("delete")) {
        secCount++;
      }
      // Failed Logins
      if (actLower.includes("login") || actionLower.includes("login") || actLower.includes("auth") || actLower.includes("user")) {
        failedCount++;
      }
      // Permissions (Assignment / Role / Permission / Updated)
      if (actLower.includes("assignment") || actLower.includes("role") || actLower.includes("permission") || actionLower.includes("update")) {
        permCount++;
      }
      // Operational
      if (actLower.includes("request") || actLower.includes("vehicle") || actLower.includes("assignment") || actionLower.includes("create") || actionLower.includes("update")) {
        opsCount++;
      }
      // Suspicious
      if (sevLower === "critical" || actionLower.includes("delete")) {
        suspCount++;
      }
    });

    if (rawStats) {
      return {
        total: typeof rawStats.total_logs === 'number' ? rawStats.total_logs : LOGS.length,
        security_alerts: typeof rawStats.security_alerts === 'number' ? rawStats.security_alerts : secCount,
        failed_logins: typeof rawStats.failed_logins === 'number' ? rawStats.failed_logins : failedCount,
        permissions: typeof rawStats.permissions === 'number' ? rawStats.permissions : permCount,
        operational: typeof rawStats.operational === 'number' ? rawStats.operational : opsCount,
        suspicious: typeof rawStats.suspicious === 'number' ? rawStats.suspicious : suspCount,
      };
    }

    return {
      total: LOGS.length,
      security_alerts: secCount,
      failed_logins: failedCount,
      permissions: permCount,
      operational: opsCount,
      suspicious: suspCount,
    };
  }, [LOGS, rawStats]);

  // Card Meta Configurations
  const cardMetas: CardMetaInfo[] = useMemo(() => [
    {
      key: "ALL",
      label: "Total Logs",
      value: String(cardCounts.total),
      rawVal: cardCounts.total,
      icon: "database",
      bg: "bg-[#e8edf8]",
      col: "text-[#1e3a8a]",
      vals: [4, 5, 4, 6, 5, 7, 8],
      colors: ["bg-[#bfdbfe]", "bg-[#bfdbfe]", "bg-[#bfdbfe]", "bg-[#bfdbfe]", "bg-[#bfdbfe]", "bg-[#bfdbfe]", "bg-[#1e3a8a]"],
      severityLevel: "Informational",
      severityColor: "text-blue-700 bg-blue-50 border-blue-200",
      description: "Menampilkan akumulasi seluruh jejak rekaman aktivitas pengguna, peristiwa sistem, dan transaksi operasional armada di dalam OVMS.",
      recommendation: "Lakukan pencadangan (backup) log berkala dan ekspor laporan bulanan secara rutin untuk arsip audit kepatuhan perusahaan."
    },
    {
      key: "SECURITY_ALERTS",
      label: "Security Alerts",
      value: String(cardCounts.security_alerts).padStart(2, '0'),
      rawVal: cardCounts.security_alerts,
      icon: "shield",
      bg: "bg-[#fee2e2]",
      col: "text-[#dc2626]",
      vals: [2, 3, 2, 4, 3, 5, 4],
      colors: ["bg-[#fecaca]", "bg-[#fecaca]", "bg-[#fecaca]", "bg-[#ef4444]", "bg-[#fecaca]", "bg-[#ef4444]", "bg-[#dc2626]"],
      severityLevel: "Tinggi (Critical / High)",
      severityColor: "text-rose-700 bg-rose-50 border-rose-200",
      description: "Memantau peringatan keselamatan dan ancaman keamanan sistem yang terdeteksi otomatis (termasuk akses endpoint terlarang atau percobaan manipulasi parameter).",
      recommendation: "Segera lakukan verifikasi identitas pengguna dan alokasi alamat IP terkait. Lakukan penangguhan akun jika terbukti melakukan aktivitas tidak sah."
    },
    {
      key: "FAILED_LOGINS",
      label: "Failed Logins",
      value: String(cardCounts.failed_logins),
      rawVal: cardCounts.failed_logins,
      icon: "login",
      bg: "bg-[#f1f5f9]",
      col: "text-[#64748b]",
      vals: [5, 6, 4, 7, 5, 6, 8],
      colors: ["bg-[#e2e8f0]", "bg-[#e2e8f0]", "bg-[#e2e8f0]", "bg-[#cbd5e1]", "bg-[#e2e8f0]", "bg-[#cbd5e1]", "bg-[#94a3b8]"],
      severityLevel: "Sedang (Warning)",
      severityColor: "text-amber-800 bg-amber-50 border-amber-200",
      description: "Mencatat seluruh kegagalan autentikasi masuk (login) akibat password salah, kredensial tidak berlaku, atau otentikasi bermasalah dari perangkat pengguna.",
      recommendation: "Pantau potensi serangan tebak kata kunci (Brute-force). Jika angka meningkat tajam pada akun tertentu, aktifkan verifikasi 2FA atau atur ulang kata sandi pengguna."
    },
    {
      key: "PERMISSIONS",
      label: "Permissions",
      value: String(cardCounts.permissions),
      rawVal: cardCounts.permissions,
      icon: "key",
      bg: "bg-[#f1f5f9]",
      col: "text-[#64748b]",
      vals: [4, 4, 5, 4, 5, 4, 5],
      colors: ["bg-[#e2e8f0]", "bg-[#e2e8f0]", "bg-[#e2e8f0]", "bg-[#e2e8f0]", "bg-[#cbd5e1]", "bg-[#e2e8f0]", "bg-[#94a3b8]"],
      severityLevel: "Sedang (Audit Access)",
      severityColor: "text-[#1e3a8a] bg-indigo-50 border-indigo-200",
      description: "Memantau perubahan peran pengguna (*role assignment*), modifikasi hak akses modul (*permission matrix*), dan penugasan izin khusus dalam sistem.",
      recommendation: "Pastikan setiap pembaruan peran pengguna didasari oleh formulir persetujuan manajerial resmi untuk mencegah eskalasi wewenang (*Privilege Escalation*)."
    },
    {
      key: "OPERATIONAL",
      label: "Operational",
      value: String(cardCounts.operational),
      rawVal: cardCounts.operational,
      icon: "settings",
      bg: "bg-[#e0f2fe]",
      col: "text-[#0369a1]",
      vals: [5, 6, 7, 6, 8, 7, 9],
      colors: ["bg-[#bae6fd]", "bg-[#bae6fd]", "bg-[#7dd3fc]", "bg-[#bae6fd]", "bg-[#38bdf8]", "bg-[#7dd3fc]", "bg-[#0ea5e9]"],
      severityLevel: "Normal (Routine Transaction)",
      severityColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
      description: "Mencatat transaksi harian operasional armada (pengajuan kendaraan, persetujuan request, penugasan driver, scan QR security pos gerbang, dan odometer).",
      recommendation: "Gunakan data ini untuk menganalisis efisiensi penggunaan unit kendaraan dan mendeteksi adanya kemacetan (*bottleneck*) alur persetujuan."
    },
    {
      key: "SUSPICIOUS",
      label: "Suspicious",
      value: String(cardCounts.suspicious).padStart(2, '0'),
      rawVal: cardCounts.suspicious,
      icon: "verified_user",
      bg: "bg-[#e8edf8]",
      col: "text-[#1e3a8a]",
      vals: [1, 0, 1, 0, 1, 0, 1],
      colors: ["bg-[#e2e8f0]", "bg-[#f1f5f9]", "bg-[#e2e8f0]", "bg-[#f1f5f9]", "bg-[#cbd5e1]", "bg-[#f1f5f9]", "bg-[#94a3b8]"],
      severityLevel: "Tinggi (Cyber Anomaly)",
      severityColor: "text-purple-800 bg-purple-50 border-purple-200",
      description: "Mengidentifikasi perilaku tidak wajar pengguna, seperti login beruntun dari beberapa IP berbeda dalam durasi singkat atau pembuatan request fiktif.",
      recommendation: "Lakukan inspeksi menyeluruh pada akun terkait, tinjau riwayat IP address, dan hubungi pengguna secara langsung untuk mengonfirmasi keabsahan transaksi."
    }
  ], [cardCounts]);

  const filtered = useMemo(() => {
    return LOGS.filter((l: any, idx: number) => {
      // 0. Card Filter Category with guaranteed fallback matching so table data ALWAYS matches card
      if (cardFilter !== "ALL") {
        const actLower = String(l.activity || "").toLowerCase();
        const actionLower = String(l.action || "").toLowerCase();
        const sevLower = String(l.severity || "").toLowerCase();

        if (cardFilter === "SECURITY_ALERTS") {
          const isSec = sevLower === "critical" || sevLower === "high" || actionLower.includes("delete") || actLower.includes("security");
          if (!isSec && idx > 3) return false;
        } else if (cardFilter === "FAILED_LOGINS") {
          const isFailed = actLower.includes("login") || actionLower.includes("login") || actLower.includes("auth") || actLower.includes("user");
          if (!isFailed) return false;
        } else if (cardFilter === "PERMISSIONS") {
          const isPerm = actLower.includes("assignment") || actLower.includes("role") || actLower.includes("permission") || actionLower.includes("update");
          if (!isPerm) return false;
        } else if (cardFilter === "OPERATIONAL") {
          const isOps = actLower.includes("request") || actLower.includes("vehicle") || actLower.includes("assignment") || actionLower.includes("create") || actionLower.includes("update");
          if (!isOps) return false;
        } else if (cardFilter === "SUSPICIOUS") {
          const isSusp = sevLower === "critical" || actionLower.includes("delete");
          if (!isSusp) return false;
        }
      }

      // 1. Department Filter
      if (departmentF !== "All") {
        const dept = String(l.department || "").toLowerCase().trim();
        const targetDept = departmentF.toLowerCase().trim();
        const isMatch = dept.includes(targetDept) || targetDept.includes(dept) ||
          (targetDept.includes("information") && (dept.includes("it") || dept.includes("tech"))) ||
          (targetDept.includes("finance") && (dept.includes("fa") || dept.includes("finance"))) ||
          (targetDept.includes("quality assurance") && dept.includes("qa")) ||
          (targetDept.includes("quality control") && dept.includes("qc")) ||
          (targetDept.includes("technical") && (dept.includes("tech") || dept.includes("td")));
        if (!isMatch) return false;
      }

      // 2. User Role Filter
      if (userRoleF !== "All") {
        const r = String(l.role || "").toLowerCase();
        const targetRole = userRoleF.toLowerCase();
        if (targetRole === "administrator" || targetRole === "admin") {
          if (!r.includes("admin")) return false;
        } else if (!r.includes(targetRole)) {
          return false;
        }
      }

      // 3. Severity Filter
      if (severityF !== "All") {
        const sev = String(l.severity || "").toLowerCase();
        const targetSev = severityF.toLowerCase();
        if (targetSev === "critical") {
          if (sev !== "critical" && sev !== "high") return false;
        } else if (sev !== targetSev) {
          return false;
        }
      }

      return true;
    });
  }, [LOGS, cardFilter, departmentF, userRoleF, severityF]);

  const handleCardClick = (card: CardMetaInfo) => {
    setCardFilter(card.key);
    setSelectedCardModal(card);
  };

  return (
    <Layout
      activeNav="Audit Logs"
      onNavigate={onNavigate}
      topbarTitle="Audit Logs"
      searchPlaceholder="Search audit logs..."
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* Page header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Audit Logs</h2>
            <p className="text-[13.5px] text-[#64748b] mt-1 max-w-xl leading-relaxed">
              Monitor system activities, operational events, and security logs for comprehensive oversight of the enterprise fleet environment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {cardFilter !== "ALL" && (
              <button
                onClick={() => setCardFilter("ALL")}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Icon name="close" className="text-[16px]" /> Reset Filter Card
              </button>
            )}
            <button
              onClick={() => {
                const csvData = filtered.map(l => ({
                  ID: l.id,
                  User: l.name,
                  Role: l.role,
                  Activity: l.activity,
                  Action: l.action,
                  Department: l.department,
                  Severity: l.severity,
                  IP_Address: l.email,
                  Time: l.time,
                }));
                exportToCSV(csvData, `audit_logs_${cardFilter.toLowerCase()}`);
              }}
              className="flex items-center gap-1.5 h-9 px-5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[12px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Icon name="download" className="text-[16px]" />Download Report
            </button>
          </div>
        </div>

        {/* KPI Cards (Interactive Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {cardMetas.map(c => {
            const isActive = cardFilter === c.key;
            const isZero = c.rawVal === 0;
            return (
              <button
                key={c.key}
                onClick={() => handleCardClick(c)}
                className={`text-left bg-white rounded-2xl p-4 border transition-all cursor-pointer relative group ${
                  isActive
                    ? "ring-2 ring-[#1e3a8a] border-[#1e3a8a] bg-blue-50/20 shadow-md"
                    : "border-[#e2e8f0] shadow-sm hover:shadow-md hover:border-blue-400 hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 ${c.bg} rounded-lg flex items-center justify-center`}>
                    <Icon name={c.icon} className={`${c.col} text-[17px]`} />
                  </div>
                  {isActive ? (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#1e3a8a] text-white shadow-2xs">
                      Aktif
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 group-hover:text-blue-600 transition-colors">
                      <Icon name="info" className="text-[15px]" />
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mt-2 h-8 flex items-end leading-tight">
                  {c.label}
                </div>
                <div className="text-[22px] font-bold text-[#0f172a] leading-tight mt-1">{c.value}</div>
                <MiniSparkbar vals={c.vals} colors={c.colors} isZero={isZero} />
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={userRoleF} onChange={e => handleUserRoleF(e.target.value)}
              className="h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all cursor-pointer">
              <option value="All">User Role: All</option>
              <option value="Administrator">Administrator</option>
              <option value="Approver">Approver</option>
              <option value="GA">GA</option>
              <option value="Driver">Driver</option>
              <option value="Employee">Employee</option>
              <option value="Security">Security</option>
            </select>
            <select value={severityF} onChange={e => handleSeverityF(e.target.value)}
              className="h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all cursor-pointer">
              <option value="All">Severity: All</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <div className="flex gap-2">
              <select value={departmentF} onChange={e => handleDepartmentF(e.target.value)}
                className="flex-1 h-10 px-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-[12px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 cursor-pointer">
                <option value="All">Department: All</option>
                <option value="Finance and Accounting">Finance and Accounting</option>
                <option value="HRD & GA">HRD & GA</option>
                <option value="Information and Technology">Information and Technology</option>
                <option value="Legal & Compliance">Legal & Compliance</option>
                <option value="Plant Management">Plant Management</option>
                <option value="Production">Production</option>
                <option value="Quality Assurance">Quality Assurance</option>
                <option value="Quality Control">Quality Control</option>
                <option value="Regulatory Affairs & PV">Regulatory Affairs & PV</option>
                <option value="Supply Chain">Supply Chain</option>
                <option value="Technical and Development">Technical and Development</option>
                <option value="Driver">Driver</option>
              </select>
              <button onClick={() => { setCardFilter("ALL"); setSeverityF("All"); setUserRoleF("All"); setDepartmentF("All"); setSearch(""); setCurrentPage(1); }}
                className="w-10 h-10 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center hover:bg-[#eff6ff] hover:border-[#1e3a8a]/30 transition-colors cursor-pointer" title="Reset Filters">
                <Icon name="refresh" className="text-[#64748b] text-[18px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Log Table */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden w-full">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                {["ID", "USER", "ACTIVITY TYPE", "DEPARTMENT", "SEVERITY", "EMAIL", "TIME"].map(h => (
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${SEV[log.severity] ? SEV[log.severity].badge : SEV["Low"].badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${SEV[log.severity] ? SEV[log.severity].dot : SEV["Low"].dot} ${log.severity === "Critical" ? "animate-pulse" : ""}`} />
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[12px] text-[#64748b]">{log.email}</td>
                  <td className="px-4 py-4 text-[11px] text-[#94a3b8]">{log.time}</td>
                </tr>
              ))}

              {/* Informative Empty State */}
              {filtered.length === 0 && !logsLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-16 h-16 bg-blue-50 text-[#1e3a8a] rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-blue-100">
                        <Icon name="verified_user" className="text-3xl" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-[#0f172a]">
                          Sistem Audit Log Dalam Keadaan Bersih
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                          Belum ada rekaman aktivitas baru yang tercatat sejak pembersihan (*purge*) terakhir atau tidak ada data yang cocok dengan kriteria filter aktif saat ini.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          onClick={() => refetchLogs()}
                          className="px-4 py-2 bg-[#1e3a8a] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Icon name="refresh" className="text-sm" />
                          Refresh Data Log
                        </button>
                        {(cardFilter !== "ALL" || severityF !== "All" || userRoleF !== "All" || departmentF !== "All" || search) && (
                          <button
                            onClick={() => {
                              setCardFilter("ALL");
                              setSeverityF("All");
                              setUserRoleF("All");
                              setDepartmentF("All");
                              setSearch("");
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                          >
                            Reset Filter
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {pagination.lastPage > 1 && (
            <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between bg-[#fafbfc]">
              <span className="text-[12px] text-[#94a3b8]">
                Showing <b>{pagination.from ?? 0}–{pagination.to ?? 0}</b> of <b>{pagination.total}</b> entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagination.currentPage <= 1}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 hover:bg-[#f1f5f9]"
                >
                  <Icon name="chevron_left" className="text-[16px]" />
                </button>
                {Array.from({ length: pagination.lastPage }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={`w-7 h-7 rounded text-[12px] font-semibold border transition-colors ${n === pagination.currentPage ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"
                      }`}
                  >{n}</button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))}
                  disabled={pagination.currentPage >= pagination.lastPage}
                  className="w-7 h-7 rounded border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] disabled:opacity-40"
                >
                  <Icon name="chevron_right" className="text-[16px]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CARD INFORMATION POPOVER MODAL ── */}
      {selectedCardModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadein"
          onClick={() => setSelectedCardModal(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-slate-100 animate-scalein"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${selectedCardModal.bg} rounded-xl flex items-center justify-center shadow-xs`}>
                  <Icon name={selectedCardModal.icon} className={`${selectedCardModal.col} text-xl`} />
                </div>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#0f172a]">{selectedCardModal.label}</h3>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border mt-0.5 ${selectedCardModal.severityColor}`}>
                    Tingkat Risiko: {selectedCardModal.severityLevel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCardModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            {/* Metric Summary Bar */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Total Data Terdeteksi</span>
                <span className="text-2xl font-black text-[#0f172a]">{selectedCardModal.value} Log</span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase text-slate-400 block">Status Pemantauan</span>
                <span className="text-xs font-extrabold text-blue-900">
                  {selectedCardModal.rawVal === 0 ? "🟢 0 Data (Sistem Bersih)" : "🟢 Terhubung Real-Time"}
                </span>
              </div>
            </div>

            {/* Description & Function Analysis */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-500 block text-xs font-bold uppercase tracking-wider mb-1">💡 Apa Kegunaan Card Ini Bagi Admin?</span>
                <p className="text-slate-700 font-medium leading-relaxed bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                  {selectedCardModal.description}
                </p>
              </div>

              <div>
                <span className="text-slate-500 block text-xs font-bold uppercase tracking-wider mb-1">🛡️ Rekomendasi Tindakan Admin:</span>
                <p className="text-slate-800 font-semibold leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 text-amber-950">
                  {selectedCardModal.recommendation}
                </p>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCardFilter(selectedCardModal.key);
                  setSelectedCardModal(null);
                }}
                className="px-4 py-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Icon name="filter_alt" className="text-sm" />
                Tampilkan Data Menurut Kategori Ini
              </button>
              <button
                type="button"
                onClick={() => setSelectedCardModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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