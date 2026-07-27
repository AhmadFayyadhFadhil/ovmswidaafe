// src/pages/employee/my-requests/index.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/RoleLayout";
import { Icon } from "@/components/ui/Icon";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { useAuthContext } from "@/auth/authContext";

interface StepState { 
  done: boolean; 
  active?: boolean;
  activeColor?: "blue" | "yellow" | "orange";
  label?: string;
  icon?: string;
}

const STEP_LABELS = ["Submitted", "K.Dep Asal", "GA Koor", "Assignment driver", "Terjadwal", "Selesai"];
const STEP_ICONS  = ["send", "how_to_reg", "commute", "person_pin", "schedule", "flag"];

function getRequestSteps(rawStatus: string): StepState[] {
  const isRejected = rawStatus === "rejected" || rawStatus === "cancelled";
  
  if (isRejected) {
    return [
      { done: true, active: false },
      { done: false, active: false },
      { done: false, active: false },
      { done: false, active: false },
      { done: false, active: false },
      { done: false, active: false }
    ];
  }

  // 1. Submitted
  const step0Done = true;
  const step0Active = rawStatus === "submitted";

  // 2. K.Dep Asal
  const step1Done = [
    "approved_department",
    "waiting_driver",
    "driver_assigned",
    "on_going",
    "completed"
  ].includes(rawStatus);
  const step1Active = rawStatus === "submitted";

  // 3. GA Koor
  const step2Done = [
    "waiting_driver",
    "driver_assigned",
    "on_going",
    "completed"
  ].includes(rawStatus);
  const step2Active = rawStatus === "approved_department";

  // 4. Assignment driver
  const step3Done = [
    "driver_assigned",
    "on_going",
    "completed"
  ].includes(rawStatus);
  const step3Active = rawStatus === "waiting_driver";

  // 5. Terjadwal / In Progress
  const step4Done = rawStatus === "completed";
  const step4Active = rawStatus === "driver_assigned" || rawStatus === "on_going";
  const step4Color = rawStatus === "driver_assigned" ? "blue" : "yellow";
  const step4Label = rawStatus === "on_going" ? "In Progress" : "Terjadwal";
  const step4Icon = rawStatus === "on_going" ? "hourglass_empty" : "schedule";

  // 6. Selesai
  const step5Done = rawStatus === "completed";
  const step5Active = false;

  return [
    { done: step0Done, active: step0Active },
    { done: step1Done, active: step1Active },
    { done: step2Done, active: step2Active },
    { done: step3Done, active: step3Active },
    { done: step4Done, active: step4Active, activeColor: step4Color, label: step4Label, icon: step4Icon },
    { done: step5Done, active: step5Active }
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
    case "waiting_driver":
      return {
        label: "Menunggu Driver",
        color: "bg-[#fef9c3] text-[#854d0e]",
      };
    case "assigned_by_ga":
      return {
        label: "Menunggu HRD Head",
        color: "bg-[#dbeafe] text-[#1d4ed8]",
      };
    case "driver_assigned":
      return {
        label: "Siap Jalan",
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

function formatDateTime(str: string) {
  if (!str) return "";
  let datePart = "";
  let timePart = "09:00";
  
  if (str.includes("T")) {
    const parts = str.split("T");
    datePart = parts[0];
    timePart = parts[1].split(".")[0].substring(0, 5);
  } else if (str.includes(" ")) {
    const parts = str.split(" ");
    datePart = parts[0];
    timePart = parts[1].substring(0, 5);
  } else {
    datePart = str;
  }
  
  const dateSubparts = datePart.split("-");
  if (dateSubparts.length === 3) {
    datePart = `${dateSubparts[2]}-${dateSubparts[1]}-${dateSubparts[0]}`;
  }
  
  return `${datePart} ${timePart}`;
}

function formatScanTime(dateTimeStr: string | null | undefined) {
  if (!dateTimeStr) return "-";
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return dateTimeStr;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}`;
  } catch (e) {
    return dateTimeStr;
  }
}

function calculateRealDuration(outStr: string | null | undefined, inStr: string | null | undefined) {
  if (!outStr) return "-";
  try {
    const outDate = new Date(outStr);
    if (isNaN(outDate.getTime())) return "-";
    
    const inDate = inStr ? new Date(inStr) : new Date();
    if (isNaN(inDate.getTime())) return "-";
    
    const diffMs = inDate.getTime() - outDate.getTime();
    if (diffMs <= 0) return "0 Menit";
    
    const diffMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    
    const durationStr = hours > 0 ? `${hours} Jam ${mins} Menit` : `${mins} Menit`;
    if (!inStr) {
      return `${durationStr} (Sedang Berjalan)`;
    }
    return durationStr;
  } catch (e) {
    return "-";
  }
}

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("All Status");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [zoomedQrUrl, setZoomedQrUrl] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; requestId: string | null }>({
    isOpen: false,
    requestId: null,
  });
  const [cancelReason, setCancelReason] = useState('');
  const [contactDriverModal, setContactDriverModal] = useState<{
    isOpen: boolean;
    request: any | null;
  }>({
    isOpen: false,
    request: null,
  });
  const [ratingModal, setRatingModal] = useState<{
    isOpen: boolean;
    request: any | null;
    rating: number;
    notes: string;
  }>({
    isOpen: false,
    request: null,
    rating: 5,
    notes: "",
  });
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const handleRatingSubmit = async () => {
    if (!ratingModal.request) return;
    setRatingSubmitting(true);
    try {
      await requestService.rateDriver(ratingModal.request.id, {
        rating: ratingModal.rating,
        rating_notes: ratingModal.notes,
      });
      requestService.clearCache();
      refetch();
      setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" });
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan rating driver.");
    } finally {
      setRatingSubmitting(false);
    }
  };

  const { data: requestsData, loading, error, refetch } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requests = (requestsData || []) as any[];

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Auto-expand request if ID is provided in query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam) {
      setExpanded(idParam);
      // Clear query parameter from the URL address bar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const filtered = useMemo(() => requests.filter(r => {
    // Only show active or pending requests (not completed or rejected)
    const isActiveOrPending = !["completed", "rejected", "cancelled"].includes(r.rawStatus);
    if (!isActiveOrPending) return false;

    const matchSearch =
      search === "" ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.purpose || "").toLowerCase().includes(search.toLowerCase());

    if (statusFilter === "All Status") return matchSearch;
    if (statusFilter === "In Progress") {
      return matchSearch && ["on_going", "driver_assigned", "approved_hrd_ga", "approved_hrd"].includes(r.rawStatus);
    }
    if (statusFilter === "Pending") {
      return matchSearch && ["submitted", "approved_department", "waiting_driver"].includes(r.rawStatus);
    }
    return matchSearch;
  }), [requests, search, statusFilter]);

  const totalCount = requests.length;
  const pendingCount = useMemo(() => requests.filter(r => ["submitted", "approved_department"].includes(r.rawStatus)).length, [requests]);
  const activeCount = useMemo(() => requests.filter(r => r.rawStatus === "on_going").length, [requests]);
  const completedCount = useMemo(() => requests.filter(r => r.rawStatus === "completed").length, [requests]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCancelClick = (id: string) => {
    setCancelReason('');
    setCancelModal({ isOpen: true, requestId: id });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.requestId) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 5) {
      alert('Alasan pembatalan wajib diisi minimal 5 karakter.');
      return;
    }
    setActionLoading(true);
    try {
      await requestService.delete(cancelModal.requestId, cancelReason.trim());
      setCancelModal({ isOpen: false, requestId: null });
      setCancelReason('');
      refetch();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data?.errors?.rejected_reason?.[0] || 'Gagal membatalkan permintaan.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Layout
      activeNav="My Requests"
      topbarTitle="My Requests"
      userName={user?.name || "Andi Sullivan"}
      userRole={user?.role === "approver" ? "Manager Approver" : "Employee"}
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
            { icon: "check_circle", iconBg: "bg-emerald-50 border border-emerald-100", iconColor: "text-emerald-600", value: String(completedCount), label: "Completed Requests", sub: "Successfully closed" },
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
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[17px]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter by title, ID, or driver..."
              className="w-full h-10 pl-9 pr-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatus(e.target.value)}
            className="h-10 px-4 border border-[#e2e8f0] bg-white rounded-xl text-[13px] font-semibold text-[#475569] focus:outline-none focus:ring-2 focus:ring-[#00236f]/20 appearance-none pr-8">
            {["All Status", "In Progress", "Pending"].map(s => <option key={s}>{s}</option>)}
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

              const sc = getStatusConfig(r.rawStatus);

              return (
                <div key={r.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                    r.rawStatus === "on_going" ? "border-[#b6c4ff]" : "border-[#e2e8f0]"
                  }`}
                >
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#00236f] bg-[#e5eeff] px-2 py-0.5 rounded-full">#{r.id}</span>
                          {r.rawStatus === "on_going" && (
                            <span className="text-[10px] font-bold text-[#4059aa] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4059aa] animate-pulse" />
                              IN PROGRESS
                            </span>
                          )}
                        </div>
                        <h4 className="text-[16px] font-bold text-[#0f172a]">{r.purpose || "Vehicle Request"}</h4>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 mt-2 text-[12.5px] text-[#64748b] flex-wrap">
                          <span className="flex items-center gap-1.5 whitespace-nowrap"><Icon name="location_on" className="text-[14px]" />{r.destination}</span>
                          <span className="flex items-center gap-1.5 whitespace-nowrap"><Icon name="schedule" className="text-[14px]" />{formatDateTime(r.startTime || (r.date + " " + r.time))}</span>
                          <span className="flex items-center gap-1.5 whitespace-nowrap"><Icon name="groups" className="text-[14px]" />{r.passengerCount || 1} Pax</span>
                        </div>
                      </div>

                      {/* Right: status + actions */}
                      <div className="flex flex-wrap sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.color}`}>{sc.label}</span>
                        <span className={`text-[10px] font-bold flex items-center gap-1 ${getPriorityColor(r.priority)}`}>
                          {r.priority !== "NORMAL" && <Icon name="warning" className="text-[12px]" />}
                          {r.priority}
                        </span>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {!["on_going", "completed", "cancelled"].includes(r.rawStatus) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClick(r.id);
                              }}
                              disabled={actionLoading}
                              className="text-[12px] font-bold text-[#ba1a1a] bg-[#fff1f2] border border-[#fecdd3] px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              title="Batalkan Pengajuan Ini"
                            >
                              <Icon name={r.rawStatus === "rejected" ? "delete" : "cancel"} className="text-[14px]" />
                              {r.rawStatus === "rejected" ? "Hapus" : "Batalkan Request"}
                            </button>
                          )}
                          <button
                            onClick={() => setExpanded(isExpanded ? null : r.id)}
                            className="text-[12px] font-bold text-[#00236f] border border-[#00236f]/20 px-3 py-1.5 rounded-lg hover:bg-[#e5eeff] transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {isExpanded ? "Hide Detail" : "View Details"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Stepper Row (Always visible and responsive) */}
                    <div className="w-full max-w-[480px] mt-5 pt-4 border-t border-slate-50">
                      <div className="flex items-center justify-between gap-0 relative w-full">
                        {/* Connection Line */}
                        <div className="absolute top-4 left-[8.3%] right-[8.3%] h-0.5 bg-[#e2e8f0]" />
                        
                        {steps.map((s, si) => (
                          <div key={si} className="flex-1 flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                              (s.done && !s.active) || (si === STEP_LABELS.length - 1 && s.done)
                                ? "bg-[#1a6e3c] border-[#1a6e3c] shadow-sm"
                                : s.active
                                ? s.activeColor === "blue"
                                  ? "bg-white border-[#2563eb] ring-4 ring-[#dbeafe]"
                                  : s.activeColor === "yellow"
                                  ? "bg-white border-[#d97706] ring-4 ring-[#fef9c3]"
                                  : "bg-white border-[#ff8c00] ring-4 ring-[#ffd9b0]"
                                : "bg-white border-[#e2e8f0]"
                            }`}>
                              {(s.done && !s.active) || (si === STEP_LABELS.length - 1 && s.done)
                                ? <Icon name="check" className="text-white text-[14px]" />
                                : s.active
                                ? <Icon 
                                    name={s.icon || STEP_ICONS[si]} 
                                    className={`${
                                      s.activeColor === "blue"
                                        ? "text-[#2563eb]"
                                        : s.activeColor === "yellow"
                                        ? "text-[#d97706]"
                                        : "text-[#ff8c00]"
                                    } text-[14px]`} 
                                  />
                                : <Icon name={s.icon || STEP_ICONS[si]} className="text-[#e2e8f0] text-[14px]" />
                              }
                            </div>
                            <div className={`text-[8px] font-bold mt-1.5 uppercase tracking-wider text-center px-1 break-words ${
                              s.active
                                ? s.activeColor === "blue"
                                  ? "text-[#2563eb]"
                                  : s.activeColor === "yellow"
                                  ? "text-[#d97706]"
                                  : "text-[#ff8c00]"
                                : s.done
                                ? "text-[#1a6e3c]"
                                : "text-[#e2e8f0]"
                            }`}>
                              {s.label || STEP_LABELS[si]}
                            </div>
                          </div>
                        ))}
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
                          <div className="col-span-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Jadwal & Estimasi Kembali</div>
                            <div className="font-semibold text-[#0f172a] flex items-center gap-1.5 mt-0.5">
                              <Icon name="date_range" className="text-slate-400 text-sm" />
                              <span>
                                {formatDateTime(r.startTime || (r.date + " " + r.time))} s/d {r.endDate ? `${r.endDate} ${r.endTime || ""}` : "-"}
                                {r.estimated_duration ? ` (${r.estimated_duration} Jam)` : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] pt-2 border-t border-[#f1f5f9]/50 mt-1">
                          {r.is_external ? (
                            <div className="col-span-2 bg-blue-50/40 border border-blue-100 rounded-xl p-2.5 flex flex-col gap-2">
                              {r.external_trip_type === "round_trip" ? (
                                /* PP: 1 Cost & 1 Fleet */
                                <>
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                                    Detail Sewa Pihak Ketiga (Pulang Pergi)
                                  </div>
                                  {r.external_provider && <div className="text-[11px] font-extrabold text-blue-900">Provider: {r.external_provider}</div>}
                                  <div className="font-extrabold text-blue-900 leading-tight">Cost PP: Rp {(Number(r.third_party_cost || 0) + Number(r.third_party_cost_2 || 0)).toLocaleString('id-ID')}</div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                    {/* Mobil 1 */}
                                    <div className="p-2 bg-white rounded-lg border border-blue-100/60 space-y-1">
                                      <div className="font-bold text-blue-800 text-[10.5px]">Mobil 1 (Cost: Rp {Number(r.third_party_cost || 0).toLocaleString('id-ID')})</div>
                                      <div className="text-[10.5px] font-semibold text-slate-700 space-y-0.5 mt-0.5">
                                        {r.external_driver_name && <div>Driver: {r.external_driver_name}</div>}
                                        {r.external_license_plate && <div>Plat: {r.external_license_plate}</div>}
                                        {r.external_fleet_info && <div className="text-slate-500 font-medium">Detail: {r.external_fleet_info}</div>}
                                        {!r.external_driver_name && !r.external_license_plate && !r.external_fleet_info && <div className="text-slate-400 italic">Detail driver & kendaraan belum diisi.</div>}
                                      </div>
                                      {r.external_photo_url && (
                                        <a href={r.external_photo_url} target="_blank" rel="noreferrer" className="text-[9.5px] text-blue-700 hover:underline font-bold mt-0.5 inline-flex items-center gap-1">
                                          <Icon name="image" className="text-xs" /> Lihat Foto
                                        </a>
                                      )}
                                    </div>

                                    {/* Mobil 2 */}
                                    {r.passengerCount > 6 && (
                                      <div className="p-2 bg-white rounded-lg border border-blue-100/60 space-y-1">
                                        <div className="font-bold text-blue-800 text-[10.5px]">Mobil 2 (Cost: Rp {Number(r.third_party_cost_2 || 0).toLocaleString('id-ID')})</div>
                                        <div className="text-[10.5px] font-semibold text-slate-700 space-y-0.5 mt-0.5">
                                          {r.external_driver_name_2 && <div>Driver: {r.external_driver_name_2}</div>}
                                          {r.external_license_plate_2 && <div>Plat: {r.external_license_plate_2}</div>}
                                          {r.external_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {r.external_fleet_info_2}</div>}
                                          {!r.external_driver_name_2 && !r.external_license_plate_2 && !r.external_fleet_info_2 && <div className="text-slate-400 italic">Belum ditugaskan.</div>}
                                        </div>
                                        {r.external_photo_url_2 && (
                                          <a href={r.external_photo_url_2} target="_blank" rel="noreferrer" className="text-[9.5px] text-blue-700 hover:underline font-bold mt-0.5 inline-flex items-center gap-1">
                                            <Icon name="image" className="text-xs" /> Lihat Foto
                                          </a>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                /* Sekali Jalan: 2 separate fleets and costs */
                                <div className="space-y-2.5 text-[11px]">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                                    Detail Sewa Pihak Ketiga (Sekali Jalan - Armada Berbeda)
                                  </div>
                                  {r.external_provider && <div className="text-[11.5px] font-extrabold text-blue-900">Provider: {r.external_provider}</div>}
                                  
                                  {/* Keberangkatan */}
                                  <div className="p-2.5 bg-white rounded-lg border border-blue-100/60 space-y-1.5">
                                    <div className="font-bold text-blue-800 flex items-center gap-1 text-[11px] border-b border-blue-50 pb-1">
                                      <span>🚙</span> Armada Keberangkatan
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="p-1.5 bg-slate-50/50 rounded border border-slate-100 space-y-0.5">
                                        <div className="font-bold text-blue-800 text-[10px]">Mobil 1 (Cost: Rp {Number(r.external_departure_cost || 0).toLocaleString('id-ID')})</div>
                                        <div className="text-slate-600 font-semibold space-y-0.5 text-[10px]">
                                          {r.external_driver_name && <div>Driver: {r.external_driver_name}</div>}
                                          {r.external_license_plate && <div>Plat: {r.external_license_plate}</div>}
                                          {r.external_fleet_info && <div className="text-slate-500 font-medium">Detail: {r.external_fleet_info}</div>}
                                          {!r.external_driver_name && !r.external_license_plate && !r.external_fleet_info && <div className="text-slate-400 italic">Belum diisi.</div>}
                                        </div>
                                        {r.external_photo_url && (
                                          <a href={r.external_photo_url} target="_blank" rel="noreferrer" className="text-[9.5px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                            <Icon name="image" className="text-xs" /> Lihat Foto
                                          </a>
                                        )}
                                      </div>

                                      {r.passengerCount > 6 && (
                                        <div className="p-1.5 bg-slate-50/50 rounded border border-slate-100 space-y-0.5">
                                          <div className="font-bold text-blue-800 text-[10px]">Mobil 2 (Cost: Rp {Number(r.external_departure_cost_2 || 0).toLocaleString('id-ID')})</div>
                                          <div className="text-slate-600 font-semibold space-y-0.5 text-[10px]">
                                            {r.external_driver_name_2 && <div>Driver: {r.external_driver_name_2}</div>}
                                            {r.external_license_plate_2 && <div>Plat: {r.external_license_plate_2}</div>}
                                            {r.external_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {r.external_fleet_info_2}</div>}
                                            {!r.external_driver_name_2 && !r.external_license_plate_2 && !r.external_fleet_info_2 && <div className="text-slate-400 italic">Belum diisi.</div>}
                                          </div>
                                          {r.external_photo_url_2 && (
                                            <a href={r.external_photo_url_2} target="_blank" rel="noreferrer" className="text-[9.5px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                              <Icon name="image" className="text-xs" /> Lihat Foto
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Penjemputan */}
                                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                                    <div className="font-bold text-slate-700 flex items-center gap-1 text-[11px] border-b border-slate-200 pb-1">
                                      <span>🔄</span> Armada Penjemputan / Pulang
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div className="p-1.5 bg-white rounded border border-slate-100 space-y-0.5">
                                        <div className="font-bold text-slate-700 text-[10px]">Mobil 1 (Cost: Rp {Number(r.external_return_cost || 0).toLocaleString('id-ID')})</div>
                                        <div className="text-slate-600 font-semibold space-y-0.5 text-[10px]">
                                          {r.external_return_driver_name && <div>Driver: {r.external_return_driver_name}</div>}
                                          {r.external_return_license_plate && <div>Plat: {r.external_return_license_plate}</div>}
                                          {r.external_return_fleet_info && <div className="text-slate-500 font-medium">Detail: {r.external_return_fleet_info}</div>}
                                          {!r.external_return_driver_name && !r.external_return_license_plate && !r.external_return_fleet_info && <div className="text-slate-400 italic">Belum diisi.</div>}
                                        </div>
                                        {r.external_return_photo_url && (
                                          <a href={r.external_return_photo_url} target="_blank" rel="noreferrer" className="text-[9.5px] text-slate-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                            <Icon name="image" className="text-xs" /> Lihat Foto
                                          </a>
                                        )}
                                      </div>

                                      {r.passengerCount > 6 && (
                                        <div className="p-1.5 bg-white rounded border border-slate-100 space-y-0.5">
                                          <div className="font-bold text-slate-700 text-[10px]">Mobil 2 (Cost: Rp {Number(r.external_return_cost_2 || 0).toLocaleString('id-ID')})</div>
                                          <div className="text-slate-600 font-semibold space-y-0.5 text-[10px]">
                                            {r.external_return_driver_name_2 && <div>Driver: {r.external_return_driver_name_2}</div>}
                                            {r.external_return_license_plate_2 && <div>Plat: {r.external_return_license_plate_2}</div>}
                                            {r.external_return_fleet_info_2 && <div className="text-slate-500 font-medium">Detail: {r.external_return_fleet_info_2}</div>}
                                            {!r.external_return_driver_name_2 && !r.external_return_license_plate_2 && !r.external_return_fleet_info_2 && <div className="text-slate-400 italic">Belum diisi.</div>}
                                          </div>
                                          {r.external_return_photo_url_2 && (
                                            <a href={r.external_return_photo_url_2} target="_blank" rel="noreferrer" className="text-[9.5px] text-slate-600 hover:underline font-bold inline-flex items-center gap-1 mt-0.5">
                                              <Icon name="image" className="text-xs" /> Lihat Foto
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="text-[10.5px] font-bold text-blue-900 border-t border-slate-100 pt-1.5 flex justify-between">
                                    <span>Total Biaya (Berangkat + Penjemputan):</span>
                                    <span>Rp {(Number(r.third_party_cost || 0) + Number(r.third_party_cost_2 || 0)).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Driver & Vehicle Info Card Section */
                            <div className="col-span-2 space-y-1.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                                Informasi Driver & Armada
                              </div>

                              {Array.isArray(r.itineraries) && r.itineraries.length > 0 ? (
                                /* Case Spesial: Multi-Day Driver Info Cards */
                                <div className="space-y-2">
                                  {r.itineraries.map((it: any, idx: number) => {
                                    const dName = it.driver_name || r.driverName || "Belum Ditugaskan";
                                    const vName = (it.vehicle_name || it.vehicle_model || r.vehicleModel || "Armada Belum Dipilih").replace(/\s*\(\s*\)/g, '').trim();
                                    const dInitials = dName.split(',')[0].trim().split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                                    return (
                                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <div className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                                            {dInitials}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="text-[9.5px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                                                Hari ke-{idx + 1}
                                              </span>
                                              <span className="text-[12px] font-bold text-slate-800 truncate">{dName}</span>
                                            </div>
                                            <div className="text-[10.5px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                              <Icon name="directions_car" className="text-xs text-slate-400" />
                                              <span>{vName}</span>
                                            </div>
                                          </div>
                                        </div>

                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                          it.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                          it.status === 'on_going' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>
                                          {it.status === 'completed' ? '✓ Completed' : it.status === 'on_going' ? '⚡ On Going' : 'Scheduled'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                /* Case Normal: Single-Day Driver Info Card(s) */
                                <div className="space-y-2">
                                  {(() => {
                                    const rawDriverName = r.driverName || "Belum Ditugaskan";
                                    const driverNames = rawDriverName.includes(',') ? rawDriverName.split(',').map((s: string) => s.trim()) : [rawDriverName];
                                    const vName = (r.vehicleModel || "Armada Belum Dipilih").replace(/\s*\(\s*\)/g, '').trim();

                                    return driverNames.map((dName: string, dIdx: number) => {
                                      const dInitials = dName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                      const isAssigned = dName !== "Not Assigned" && dName !== "Belum Ditugaskan" && dName.trim() !== "";

                                      return (
                                        <div key={dIdx} className="p-2.5 bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8.5 h-8.5 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-sm border border-blue-900">
                                              {dInitials}
                                            </div>
                                            <div className="min-w-0">
                                              <div className="text-[12px] font-bold text-slate-800 truncate">{dName}</div>
                                              <div className="text-[10.5px] font-medium text-slate-600 truncate flex items-center gap-1 mt-0.5">
                                                <Icon name="directions_car" className="text-xs text-slate-400" />
                                                <span>{vName}</span>
                                              </div>
                                            </div>
                                          </div>

                                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                                            isAssigned 
                                              ? "bg-blue-100 text-blue-900 border border-blue-200" 
                                              : "bg-slate-100 text-slate-500 border border-slate-200"
                                          }`}>
                                            {isAssigned ? "Driver Internal" : "Menunggu Penugasan"}
                                          </span>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Passengers</div>
                            <div className="font-semibold text-[#0f172a] space-y-2 mt-1">
                              {r.passengers && r.passengers.length > 0 ? (
                                r.passengers.map((p: any, idx: number) => (
                                  <div key={idx} className="pb-1.5 border-b border-slate-100/50 last:border-b-0 last:pb-0">
                                    <div className="text-[12px] text-slate-800 font-bold leading-tight">{p.name}</div>
                                    {(p.department_name || p.department_id) && (
                                      <div className="text-[9.5px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                                        {p.department_name || p.department_id}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <span className="text-[11.5px]">{r.passengerCount || 1} Pax</span>
                              )}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Purpose</div>
                            <div className="font-semibold text-[#0f172a] truncate" title={r.purpose}>{r.purpose || "-"}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] pt-2 border-t border-[#f1f5f9] mt-2">
                          <div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Notes</div>
                            <div className="font-semibold text-[#0f172a] truncate" title={r.notes}>{r.notes || "-"}</div>
                          </div>
                          <div className="col-span-3">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] mb-1">Dokumen Terlampir</div>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {(() => {
                                const stored = localStorage.getItem(`request_attachments_${r.id}`);
                                const files = stored ? JSON.parse(stored) : [];
                                if (files.length === 0) {
                                  return (
                                    <span className="text-[11px] text-slate-400 italic">Tidak ada dokumen dilampirkan.</span>
                                  );
                                }
                                return files.map((f: any, fi: number) => (
                                  <div 
                                    key={fi} 
                                    onClick={() => setPreviewFile(f)}
                                    className="flex items-center gap-1.5 text-[11px] text-[#00236f] bg-[#e5eeff] px-2.5 py-1.5 rounded-lg border border-[#e2e8f0] cursor-pointer hover:bg-[#d4e4ff] transition-colors"
                                    title="Klik untuk pratinjau dokumen"
                                  >
                                    <Icon name="attach_file" className="text-[13px] text-[#00236f]" />
                                    <span className="font-semibold">{f.name}</span>
                                    <span className="text-[9px] text-[#64748b]">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                                  </div>
                                ));
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Info Scan Security & Real Durasi */}
                        {(r.security_checked_out_at || r.security_checked_in_at) && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px] pt-2.5 border-t border-[#f1f5f9] mt-2 bg-[#f8fafc]/50 p-3 rounded-xl border border-slate-100">
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jam Keluar (Waktu Scan)</div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1">
                                <Icon name="login" className="text-amber-600 text-sm" />
                                {formatScanTime(r.security_checked_out_at)}
                              </div>
                              {r.security_checkout_by && (
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Oleh: {r.security_checkout_by}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Jam Masuk (Waktu Scan)</div>
                              <div className="font-semibold text-slate-700 flex items-center gap-1">
                                <Icon name="logout" className="text-emerald-600 text-sm" />
                                {formatScanTime(r.security_checked_in_at)}
                              </div>
                              {r.security_checkin_by && (
                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5">Oleh: {r.security_checkin_by}</div>
                              )}
                            </div>
                            <div className="col-span-2">
                              <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-1">Total Durasi Perjalanan (Real)</div>
                              <div className="font-bold text-slate-800 flex items-center gap-1 text-[13px]">
                                <Icon name="schedule" className="text-blue-800 text-sm animate-pulse" />
                                {calculateRealDuration(r.security_checked_out_at, r.security_checked_in_at)}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4 pt-4 border-t border-[#f1f5f9]">
                          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <button className="min-h-[38px] px-3.5 bg-[#0f2a5e] text-white rounded-xl text-[11.5px] sm:text-[12px] font-bold hover:bg-[#1e3a8a] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs">
                              <Icon name="track_changes" className="text-[15px]" /> Track Real-time
                            </button>
                            {r.driverName && r.driverName !== "Not Assigned" && (
                              <button
                                onClick={() => setContactDriverModal({ isOpen: true, request: r })}
                                className="min-h-[38px] px-3.5 border border-[#e2e8f0] text-[#475569] bg-white rounded-xl text-[11.5px] sm:text-[12px] font-bold hover:bg-[#f8fafc] transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs"
                              >
                                <Icon name="chat" className="text-[15px]" /> Contact Driver
                              </button>
                            )}
                            {r.rawStatus === "completed" && (
                              <button
                                onClick={() => setRatingModal({ isOpen: true, request: r, rating: r.rating || 5, notes: r.ratingNotes || "" })}
                                className={`min-h-[38px] px-3.5 rounded-xl text-[11.5px] sm:text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shadow-2xs ${
                                  r.rating ? 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100' : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                              >
                                <span>⭐</span>
                                {r.rating ? `Rating: ${r.rating} ⭐ (Edit)` : "Beri Rating Driver"}
                              </button>
                            )}
                            {!["on_going", "completed", "cancelled"].includes(r.rawStatus) && (
                              <button
                                onClick={() => handleCancelClick(r.id)}
                                disabled={actionLoading}
                                className="min-h-[38px] px-3.5 border border-[#fecdd3] text-[#ba1a1a] bg-[#fff1f2] rounded-xl text-[11.5px] sm:text-[12px] font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-2xs"
                              >
                                <Icon name={r.rawStatus === "rejected" ? "delete" : "cancel"} className="text-[15px]" />
                                {r.rawStatus === "rejected" ? "Delete Request" : "Cancel Request"}
                              </button>
                            )}
                          </div>

                          {(r.qr_code_token && ["driver_assigned", "on_going"].includes(r.rawStatus)) ? (
                            <div 
                              onClick={() => setZoomedQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${r.qr_code_token}`)}`)}
                              className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-sm max-w-xs flex-shrink-0 cursor-zoom-in hover:border-blue-500 transition-all hover:scale-105"
                              title="Klik untuk memperbesar"
                            >
                              <div className="bg-white p-1 rounded-lg border border-slate-100 shadow-3xs">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${r.qr_code_token}`)}`}
                                  alt="Ticket QR Code"
                                  className="w-[70px] h-[70px] object-contain"
                                />
                              </div>
                              <div>
                                <div className="text-[9px] font-extrabold text-[#64748b] uppercase tracking-widest">QR Code Tiket</div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 block mt-0.5">
                                  {r.qr_code_token}
                                </span>
                              </div>
                            </div>
                          ) : r.rawStatus === "completed" ? (
                            (() => {
                              const depTime = r.security_checked_out_at || r.started_at;
                              const retTime = r.security_checked_in_at || r.completed_at;
                              return (
                                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 max-w-sm flex-shrink-0 space-y-2">
                                  <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                                    <Icon name="task_alt" className="text-[14px]" /> Log Perjalanan Selesai
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-[11px] text-[#334155]">
                                    <div>
                                      <span className="block text-[9px] text-[#64748b] font-bold uppercase tracking-wide">Waktu Berangkat</span>
                                      <span className="font-semibold text-slate-800">
                                        {depTime ? new Date(depTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-[9px] text-[#64748b] font-bold uppercase tracking-wide">Waktu Kembali</span>
                                      <span className="font-semibold text-slate-800">
                                        {retTime ? new Date(retTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '-'}
                                      </span>
                                    </div>
                                  </div>
                                  {depTime && retTime && (
                                    <div className="text-[11px] border-t border-emerald-200/50 pt-2 flex items-center justify-between">
                                      <span className="font-bold text-[#64748b]">Total Waktu Riil:</span>
                                      <span className="font-extrabold text-emerald-700">
                                        {(() => {
                                          const start = new Date(depTime);
                                          const end = new Date(retTime);
                                          const diffMs = end.getTime() - start.getTime();
                                          if (diffMs <= 0) return "0 Menit";
                                          const diffMins = Math.floor(diffMs / 1000 / 60);
                                          const hours = Math.floor(diffMins / 60);
                                          const mins = diffMins % 60;
                                          return hours > 0 ? `${hours} Jam ${mins} Menit` : `${mins} Menit`;
                                        })()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : ["submitted", "approved_department", "waiting_driver"].includes(r.rawStatus) ? (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 max-w-xs flex-shrink-0">
                              <Icon name="hourglass_empty" className="text-[18px] text-amber-600" />
                              <div className="text-[11px] font-semibold text-amber-700">Menunggu konfirmasi driver & penugasan untuk mendapatkan QR Code</div>
                            </div>
                          ) : null}
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

      {/* Custom Confirmation Modal */}
      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative animate-fadein">
            <button 
              onClick={() => { setCancelModal({ isOpen: false, requestId: null }); setCancelReason(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>
            
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-red-50 text-[#ba1a1a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="warning" className="text-3xl" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-800">Batalkan Permintaan?</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Tindakan ini bersifat permanen. Mohon berikan alasan pembatalan agar tercatat di sistem.
              </p>
            </div>

            {/* Reason textarea — required */}
            <div className="mb-5">
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">
                Alasan Pembatalan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Contoh: Perjalanan dibatalkan karena rapat ditunda..."
                rows={3}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">{cancelReason.trim().length}/500 karakter (min. 5)</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setCancelModal({ isOpen: false, requestId: null }); setCancelReason(''); }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={actionLoading || cancelReason.trim().length < 5}
                onClick={handleConfirmCancel}
                className="flex-1 py-3 bg-[#ba1a1a] text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="delete_forever" className="text-base" />
                    Ya, Batalkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {zoomedQrUrl && (
        <div 
          className="fixed inset-0 bg-black/85 z-[99999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fadein"
          onClick={() => setZoomedQrUrl(null)}
        >
          <div 
            className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-sm w-full shadow-2xl relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomedQrUrl(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            <div className="text-[13px] font-extrabold text-[#0f2a5e] mb-4 uppercase tracking-widest text-center mt-2">Pindai QR Code Tiket</div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-[#e2e8f0]">
              <img
                src={zoomedQrUrl}
                alt="Zoomed Ticket QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold mt-4 text-center">
              Tunjukkan QR Code ini ke Security untuk dipindai saat berangkat/kembali.
            </div>
          </div>
        </div>
      )}
      {previewFile && (
        <div 
          className="fixed inset-0 bg-black/80 z-[99999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fadein"
          onClick={() => setPreviewFile(null)}
        >
          <div 
            className="bg-white rounded-3xl p-6 border border-slate-100 flex flex-col items-center max-w-2xl w-full shadow-2xl relative max-h-[85vh]" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewFile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            <div className="text-[14px] font-bold text-slate-800 mb-4 truncate max-w-[80%] text-center mt-1">
              Pratinjau Dokumen: {previewFile.name}
            </div>
            
            <div className="bg-slate-50 rounded-2xl border border-slate-200 w-full flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px] max-h-[60vh]">
              {previewFile.dataUrl ? (
                previewFile.type?.startsWith("image/") ? (
                  <img
                    src={previewFile.dataUrl}
                    alt={previewFile.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                ) : (
                  <iframe
                    src={previewFile.dataUrl}
                    title={previewFile.name}
                    className="w-full h-full border-0 min-h-[450px]"
                  />
                )
              ) : (
                <div className="text-center p-8 space-y-4 max-w-md">
                  <Icon name="description" className="text-5xl text-[#00236f] animate-pulse" />
                  <div className="font-bold text-slate-700 text-sm">Dokumen Simulasi Terlampir</div>
                  <div className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Dokumen ini adalah simulasi lampiran surat tugas PT Widatra Bhakti dengan nama file <span className="font-mono text-slate-600">{previewFile.name}</span> ({(previewFile.size / 1024 / 1024).toFixed(2)} MB).
                  </div>
                  <button
                    onClick={() => {
                      alert(`Mengunduh berkas simulasi: ${previewFile.name}`);
                      setPreviewFile(null);
                    }}
                    className="px-5 py-2 bg-[#00236f] text-white font-bold rounded-xl text-xs hover:bg-blue-900 transition-colors shadow-sm cursor-pointer"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
            
            <div className="text-[11px] text-slate-400 font-semibold mt-4 text-center">
              Klik tombol silang atau di luar area untuk menutup pratinjau.
            </div>
          </div>
        </div>
      )}
      {/* Contact Driver Modal (Sesuai Sketsa) */}
      {contactDriverModal.isOpen && contactDriverModal.request && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadein" onClick={() => setContactDriverModal({ isOpen: false, request: null })}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-fadein" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Icon name="chat" className="text-xl" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Kontak Driver</h3>
                  <p className="text-xs text-slate-400 font-medium">Permohonan #{contactDriverModal.request.id}</p>
                </div>
              </div>
              <button
                onClick={() => setContactDriverModal({ isOpen: false, request: null })}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>

            {/* List Kartu Driver */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {(() => {
                const req = contactDriverModal.request;
                let driverCards: Array<{ title: string; name: string; phone: string; email: string }> = [];

                if (Array.isArray(req.itineraries) && req.itineraries.length > 0) {
                  req.itineraries.forEach((it: any, idx: number) => {
                    const name = it.driver_name || req.driverName || `Driver Hari ke-${idx + 1}`;
                    const phone = it.driver_phone || req.driver?.phone || "081234567890";
                    const email = it.driver_email || req.driver?.email || `${name.toLowerCase().replace(/\s+/g, '')}@widatra.com`;
                    driverCards.push({
                      title: `Driver Hari ke-${idx + 1}`,
                      name,
                      phone,
                      email,
                    });
                  });
                } else {
                  const rawName = req.driverName || req.driver?.name || "Driver Utama";
                  const names = rawName.includes(',') ? rawName.split(',').map((s: string) => s.trim()) : [rawName];
                  names.forEach((name: string, idx: number) => {
                    const phone = req.driver?.phone || (idx === 0 ? "081234567890" : "081398765432");
                    const email = req.driver?.email || `${name.toLowerCase().replace(/\s+/g, '')}@widatra.com`;
                    driverCards.push({
                      title: names.length > 1 ? `Driver ${idx + 1}` : "Driver Pengemudi",
                      name,
                      phone,
                      email,
                    });
                  });
                }

                return driverCards.map((card, idx) => {
                  const digits = card.phone.replace(/\D/g, '');
                  let formattedPhone = card.phone;
                  if (digits.startsWith('62')) {
                    formattedPhone = '0' + digits.slice(2);
                  } else if (digits.startsWith('0')) {
                    formattedPhone = digits;
                  } else if (digits.length > 0) {
                    formattedPhone = '0' + digits;
                  }
                  
                  const waNumber = digits.startsWith('62') ? digits : digits.startsWith('0') ? `62${digits.slice(1)}` : `62${digits}`;
                  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(`Halo ${card.name}, saya pemohon dari permohonan kendaraan #${req.id} PT Widatra Bhakti.`)}`;
                  const initials = card.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                  return (
                    <div key={idx} className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-xs hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] text-white flex items-center justify-center text-xs font-black shadow-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">{card.title}</div>
                          <div className="text-sm font-bold text-slate-800">{card.name}</div>
                        </div>
                      </div>

                      {/* Detail Box (No HP & Email) */}
                      <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[11px]">No. HP / WA:</span>
                          <span className="font-bold font-mono text-slate-800">{formattedPhone}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-50 pt-1.5">
                          <span className="text-slate-400 font-bold text-[11px]">Email:</span>
                          <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={card.email}>{card.email}</span>
                        </div>
                      </div>

                      {/* Tombol Terhubung Langsung ke WhatsApp */}
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-10 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98"
                      >
                        <Icon name="chat" className="text-base" />
                        Chat via WhatsApp
                      </a>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setContactDriverModal({ isOpen: false, request: null })}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Rating Driver Modal */}
      {ratingModal.isOpen && ratingModal.request && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[99999] flex items-center justify-center p-4 animate-fadein" onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}>
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-fadein" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⭐</span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">Rating & Evaluasi Driver</h3>
                  <p className="text-xs text-slate-500">Request #{ratingModal.request.id} • {ratingModal.request.driverName}</p>
                </div>
              </div>
              <button
                onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition cursor-pointer"
              >
                <Icon name="close" className="text-base" />
              </button>
            </div>

            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Beri Rating Pelayanan Driver
                </label>
                <div className="flex justify-center items-center gap-2 text-3xl cursor-pointer">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRatingModal(prev => ({ ...prev, rating: star }))}
                      className="hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                    >
                      <span className={star <= ratingModal.rating ? "text-amber-400 drop-shadow-xs" : "text-slate-200"}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                <div className="text-xs font-extrabold text-amber-800">
                  {ratingModal.rating === 5 && "Sangat Memuaskan (5/5)"}
                  {ratingModal.rating === 4 && "Memuaskan (4/5)"}
                  {ratingModal.rating === 3 && "Cukup (3/5)"}
                  {ratingModal.rating === 2 && "Kurang Memuaskan (2/5)"}
                  {ratingModal.rating === 1 && "Buruk (1/5)"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulasan & Catatan/Saran (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={ratingModal.notes}
                  onChange={e => setRatingModal(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Tuliskan masukan atau pujian untuk driver..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRatingModal({ isOpen: false, request: null, rating: 5, notes: "" })}
                className="flex-1 h-10 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleRatingSubmit}
                disabled={ratingSubmitting}
                className="flex-1 h-10 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {ratingSubmitting ? "Menyimpan..." : "Kirim Rating ⭐"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}