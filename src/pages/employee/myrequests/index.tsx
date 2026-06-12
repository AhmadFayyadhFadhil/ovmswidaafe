// src/pages/employee/my-requests/index.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";

interface StepState { done: boolean; active?: boolean }

const STEP_LABELS = ["Submitted", "Approved", "Assigned", "Complete"];
const STEP_ICONS  = ["send", "approval", "person_add", "flag"];

function getRequestSteps(rawStatus: string): StepState[] {
  const isRejected = rawStatus === "rejected";
  
  if (isRejected) {
    return [
      { done: true },
      { done: false },
      { done: false },
      { done: false }
    ];
  }

  const step0Done = true;
  const step0Active = rawStatus === "submitted";

  const step1Done = [
    "approved_department",
    "approved_hrd",
    "approved_hrd_ga",
    "waiting_driver",
    "driver_assigned",
    "on_going",
    "completed"
  ].includes(rawStatus);
  const step1Active = [
    "approved_department",
    "approved_hrd",
    "approved_hrd_ga",
    "waiting_driver"
  ].includes(rawStatus);

  const step2Done = ["driver_assigned", "on_going", "completed"].includes(rawStatus);
  const step2Active = rawStatus === "driver_assigned";

  const step3Done = rawStatus === "completed";
  const step3Active = rawStatus === "completed";

  return [
    { done: step0Done, active: step0Active },
    { done: step1Done, active: step1Active },
    { done: step2Done, active: step2Active },
    { done: step3Done, active: step3Active }
  ];
}

function getStatusConfig(rawStatus: string) {
  switch (rawStatus) {
    case "submitted":
      return {
        label: "Submitted",
        color: "bg-[#e0f2fe] text-[#0369a1]",
      };
    case "approved_department":
      return {
        label: "Approved Dept",
        color: "bg-[#e5eeff] text-[#00236f]",
      };
    case "approved_hrd":
    case "approved_hrd_ga":
      return {
        label: "Approved HR/GA",
        color: "bg-[#dbeafe] text-[#1d4ed8]",
      };
    case "waiting_driver":
    case "driver_assigned":
      return {
        label: "Driver Assigned",
        color: "bg-[#dcfce7] text-[#15803d]",
      };
    case "on_going":
      return {
        label: "In Progress",
        color: "bg-[#fef9c3] text-[#854d0e]",
      };
    case "completed":
      return {
        label: "Completed",
        color: "bg-[#f1f5f9] text-[#64748b]",
      };
    case "rejected":
      return {
        label: "Rejected",
        color: "bg-[#fef2f2] text-[#dc2626]",
      };
    default:
      return {
        label: rawStatus || "Pending",
        color: "bg-[#fef9c3] text-[#854d0e]",
      };
  }
}

function getPriorityColor(priority: string) {
  const p = priority.toUpperCase();
  if (p === "CRITICAL" || p === "URGENT" || p === "HIGH") {
    return "text-[#dc2626]";
  }
  return "text-[#64748b]";
}

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All Status");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { data: requestsData, loading, error, refetch } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requests = (requestsData || []) as any[];

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const filtered = requests.filter(r => {
    const matchSearch =
      search === "" ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.purpose || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "All Status") return matchSearch;
    if (statusFilter === "In Progress") {
      return matchSearch && ["on_going", "driver_assigned", "approved_hrd_ga", "approved_hrd"].includes(r.rawStatus);
    }
    if (statusFilter === "Closed") {
      return matchSearch && ["completed", "rejected"].includes(r.rawStatus);
    }
    if (statusFilter === "Pending") {
      return matchSearch && ["submitted", "approved_department", "waiting_driver"].includes(r.rawStatus);
    }
    return matchSearch;
  });

  const totalCount = requests.length;
  const pendingCount = requests.filter(r => ["submitted", "approved_department"].includes(r.rawStatus)).length;
  const activeCount = requests.filter(r => r.rawStatus === "on_going").length;
  const completedCount = requests.filter(r => r.rawStatus === "completed").length;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCancel = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan permintaan kendaraan ini?")) return;
    setActionLoading(true);
    try {
      await requestService.delete(id);
      alert("Permintaan berhasil dibatalkan.");
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal membatalkan permintaan.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout
      activeNav="My Requests"
      topbarTitle="Employee Dashboard"
      userName={user?.name || "Andi Sullivan"}
      userRole="Employee"
      searchPlaceholder="Search requests, vehicles..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="p-4 sm:p-6 animate-fadeup space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">My Requests</h2>
            <p className="text-[13px] text-[#64748b] mt-1">Monitor operational vehicle requests, approvals, driver assignments, and progress.</p>
          </div>
          <button
            onClick={() => navigate("/employee/createrequest")}
            className="flex items-center gap-2 h-10 px-5 bg-[#0f2a5e] hover:bg-[#1e3a8a] text-white rounded-xl text-[13px] font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="add" className="text-[17px]" /> Create Request
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "receipt_long", iconBg: "bg-[#e5eeff]", iconColor: "text-[#00236f]", value: String(totalCount), label: "Total Requests", sub: "Across all time" },
            { icon: "pending_actions", iconBg: "bg-[#ffd9d5]", iconColor: "text-[#ba1a1a]", value: String(pendingCount), label: "Pending Approval", sub: "Action required", live: pendingCount > 0 },
            { icon: "commute", iconBg: "bg-[#e5eeff]", iconColor: "text-[#4059aa]", value: String(activeCount), label: "Active Requests", sub: "Currently en route", active: activeCount > 0 },
            { icon: "task_alt", iconBg: "bg-[#f1f5f9]", iconColor: "text-[#64748b]", value: String(completedCount), label: "Completed Requests", sub: "Successfully closed" },
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by title, ID, or driver..."
              className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 appearance-none pr-8">
            {["All Status", "In Progress", "Closed", "Pending"].map(s => <option key={s}>{s}</option>)}
          </select>
          <button className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
            <Icon name="calendar_today" className="text-[15px]" />Select Date Range
          </button>
          <button className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[12px] font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors flex items-center gap-2">
            <Icon name="sort" className="text-[15px]" />Sort
          </button>
        </div>

        {/* Request List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-[#e2e8f0]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00236f]"></div>
            <p className="mt-4 text-[13px] text-[#64748b]">Memuat data permintaan...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center bg-red-50 border border-red-200 rounded-2xl">
            <Icon name="error" className="text-red-500 text-[32px] mb-2" />
            <p className="text-[13px] text-red-600 font-semibold">Gagal memuat data permintaan.</p>
            <button onClick={() => refetch()} className="mt-3 px-4 py-2 bg-red-600 text-white text-[12px] font-bold rounded-lg hover:bg-red-700 transition-colors">
              Coba Lagi
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#e2e8f0]">
            <Icon name="receipt_long" className="text-[#94a3b8] text-[48px] mb-2" />
            <p className="text-[14px] text-[#475569] font-bold">Tidak ada data permintaan ditemukan</p>
            <p className="text-[12px] text-[#94a3b8] mt-1">Silakan buat permintaan kendaraan baru jika diperlukan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map(r => {
              const isExpanded = expanded === r.id;
              const steps = getRequestSteps(r.rawStatus);
              const currentStep = steps.findIndex(s => s.active) !== -1
                ? steps.findIndex(s => s.active)
                : steps.filter(s => s.done).length - 1;

              const sc = getStatusConfig(r.rawStatus);

              return (
                <div key={r.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    r.rawStatus === "on_going" ? "border-[#b6c4ff]" : "border-[#e2e8f0]"
                  }`}
                >
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-bold text-[#00236f] bg-[#e5eeff] px-2 py-0.5 rounded-full">#{r.id}</span>
                          {r.rawStatus === "on_going" && (
                            <span className="text-[10px] font-bold text-[#4059aa] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4059aa] animate-pulse" />
                              IN PROGRESS
                            </span>
                          )}
                        </div>
                        <h4 className="text-[16px] font-bold text-[#0f172a]">{r.purpose || "Vehicle Request"}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-[#64748b]">
                          <span className="flex items-center gap-1"><Icon name="location_on" className="text-[14px]" />{r.destination}</span>
                          <span className="flex items-center gap-1"><Icon name="schedule" className="text-[14px]" />{r.startTime || (r.date + " " + r.time)}</span>
                          <span className="flex items-center gap-1"><Icon name="groups" className="text-[14px]" />{r.passengerCount || 1} Pax</span>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div className="overflow-x-auto hidden sm:block">
                        <div className="flex items-center gap-0 relative mx-4" style={{ minWidth: 280 }}>
                          <div className="absolute top-4 left-5 right-5 h-0.5 bg-[#e2e8f0]" />
                          {steps.map((s, si) => (
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
                      </div>

                      {/* Right: status + actions */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.color}`}>{sc.label}</span>
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${getPriorityColor(r.priority)}`}>
                          {r.priority !== "NORMAL" && <Icon name="warning" className="text-[12px]" />}
                          {r.priority}
                        </span>
                        <button
                          onClick={() => setExpanded(isExpanded ? null : r.id)}
                          className="text-[12px] font-bold text-[#00236f] border border-[#00236f]/20 px-3 py-1.5 rounded-lg hover:bg-[#e5eeff] transition-colors cursor-pointer"
                        >
                          {isExpanded ? "Hide Detail" : "View Details"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-[#f1f5f9] animate-fadeup space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Request ID</div>
                            <div className="font-mono font-bold text-[#00236f]">#{r.id}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Destination</div>
                            <div className="font-semibold text-[#0f172a]">{r.destination}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Schedule</div>
                            <div className="font-semibold text-[#0f172a]">{r.startTime || (r.date + " " + r.time)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Purpose</div>
                            <div className="font-semibold text-[#0f172a] truncate" title={r.purpose}>{r.purpose || "-"}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] pt-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Driver</div>
                            <div className="font-semibold text-[#0f172a]">{r.driverName || "Not Assigned"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Vehicle</div>
                            <div className="font-semibold text-[#0f172a]">{r.vehicleModel || "Not Assigned"}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Passengers</div>
                            <div className="font-semibold text-[#0f172a] truncate">
                              {r.passengers && r.passengers.length > 0
                                ? r.passengers.map((p: any) => p.name).join(", ")
                                : `${r.passengerCount || 1} Pax`}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Notes</div>
                            <div className="font-semibold text-[#0f172a] truncate" title={r.notes}>{r.notes || "-"}</div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button className="h-8 px-4 bg-[#0f2a5e] text-white rounded-lg text-[11px] font-bold hover:bg-[#1e3a8a] transition-colors flex items-center gap-1 cursor-pointer">
                            <Icon name="track_changes" className="text-[14px]" /> Track Real-time
                          </button>
                          {r.driverName && r.driverName !== "Not Assigned" && (
                            <button className="h-8 px-4 border border-[#e2e8f0] text-[#475569] rounded-lg text-[11px] font-bold hover:bg-[#f8fafc] transition-colors flex items-center gap-1 cursor-pointer">
                              <Icon name="chat" className="text-[14px]" /> Contact Driver
                            </button>
                          )}
                          {r.rawStatus === "submitted" && (
                            <button
                              onClick={() => handleCancel(r.id)}
                              disabled={actionLoading}
                              className="h-8 px-4 border border-[#fecdd3] text-[#ba1a1a] rounded-lg text-[11px] font-bold hover:bg-[#fff1f2] transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                              <Icon name="cancel" className="text-[14px]" /> Cancel Request
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
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between pb-4">
            <span className="text-[12px] text-[#94a3b8]">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}-
              {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} requests
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <Icon name="chevron_left" className="text-[18px]" />
              </button>
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(n => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-8 h-8 rounded-lg text-[12px] font-bold border transition-colors cursor-pointer ${
                    n === currentPage
                      ? "bg-[#0f2a5e] text-white border-[#0f2a5e]"
                      : "border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#f1f5f9] transition-colors cursor-pointer"
              >
                <Icon name="chevron_right" className="text-[18px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}