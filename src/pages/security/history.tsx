import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { apiClient } from "@/services/api/api";

type HistoryTab = "Semua" | "Sedang Jalan" | "Selesai";
type SecurityDatePeriod = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "ALL" | "CUSTOM";

function parseLogDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const s = String(val).trim();
  if (!s) return null;
  
  const parsed = new Date(s.includes(" ") ? s.replace(" ", "T") : s);
  if (!isNaN(parsed.getTime())) return parsed;

  const months: Record<string, number> = {
    januari: 0, jan: 0, februari: 1, feb: 1, maret: 2, mar: 2, april: 3, apr: 3,
    mei: 4, may: 4, juni: 5, jun: 5, juli: 6, jul: 6, agustus: 7, aug: 7,
    september: 8, sep: 8, oktober: 9, okt: 9, oct: 9, november: 10, nov: 10, desember: 11, des: 11, dec: 11
  };
  const parts = s.split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const mStr = parts[1].toLowerCase();
    const month = months[mStr] ?? -1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== -1 && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  return null;
}

function matchesSecurityDate(log: any, period: SecurityDatePeriod, customStart?: string, customEnd?: string): boolean {
  if (period === "ALL") return true;

  const checkoutDate = parseLogDate(log.departure_checked_out_at || log.security_checked_out_at);
  const checkinDate = parseLogDate(log.return_checked_in_at || log.departure_checked_in_at || log.security_checked_in_at);
  const returnCheckoutDate = parseLogDate(log.return_checked_out_at);
  const reqDate = parseLogDate(log.startTime || log.start_time || log.date);

  const isOngoingOut = log.trip_mode === 'split_drop_pickup'
    ? ((!!log.departure_checked_out_at && !log.departure_checked_in_at) || (!!log.return_checked_out_at && !log.return_checked_in_at))
    : (!!log.security_checked_out_at && !log.security_checked_in_at);

  const dates: Date[] = [];
  if (checkoutDate) dates.push(checkoutDate);
  if (checkinDate) dates.push(checkinDate);
  if (returnCheckoutDate) dates.push(returnCheckoutDate);
  if (reqDate) dates.push(reqDate);

  if (dates.length === 0) return true;

  const now = new Date();

  if (period === "TODAY") {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return (
      dates.some((d) => d >= startOfToday && d <= endOfToday) ||
      (isOngoingOut && (checkoutDate ? checkoutDate <= endOfToday : true))
    );
  }

  if (period === "THIS_WEEK") {
    const dayOfWeek = now.getDay();
    const distanceToMonday = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - distanceToMonday, 0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6, 23, 59, 59, 999);
    return (
      dates.some((d) => d >= startOfWeek && d <= endOfWeek) ||
      (isOngoingOut && (checkoutDate ? checkoutDate <= endOfWeek : true))
    );
  }

  if (period === "THIS_MONTH") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return dates.some((d) => d >= startOfMonth && d <= endOfMonth);
  }

  if (period === "CUSTOM") {
    if (!customStart && !customEnd) return true;
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date(8640000000000000);
    return dates.some((d) => d >= start && d <= end);
  }

  return true;
}

export default function SecurityHistoryPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<HistoryTab>("Semua");
  const [datePeriod, setDatePeriod] = useState<SecurityDatePeriod>("TODAY");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [search, setSearch] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal Check-in (Konfirmasi Kembali)
  const [predefinedGuards, setPredefinedGuards] = useState<string[]>([]);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [selectedLogForCheckin, setSelectedLogForCheckin] = useState<any | null>(null);
  const [selectedTripForCheckin, setSelectedTripForCheckin] = useState<any | null>(null);
  const [guardName, setGuardName] = useState(() => localStorage.getItem("ovms_security_guard_name") || "");
  const [selectedGuardOption, setSelectedGuardOption] = useState<string>("");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [checkinError, setCheckinError] = useState<string | null>(null);

  // Fetch all requests
  const { data: fetchedRequests, loading, error, refetch } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requestsList = fetchedRequests || [];

  // Load guards list
  useEffect(() => {
    const fetchGuards = async () => {
      try {
        const res = await apiClient.get("/security-guards");
        if (res.data && res.data.status === "success") {
          const names = (res.data.data || []).map((g: any) => g.name);
          setPredefinedGuards(names);
          const saved = localStorage.getItem("ovms_security_guard_name") || "";
          if (saved) {
            if (names.includes(saved)) {
              setSelectedGuardOption(saved);
            } else {
              setSelectedGuardOption("custom");
            }
          } else if (names.length > 0) {
            setSelectedGuardOption(names[0]);
            setGuardName(names[0]);
          }
        }
      } catch (e) {
        console.error("Gagal memuat daftar security:", e);
      }
    };
    fetchGuards();
  }, []);

  // Handle redirect from dashboard (autoExpandId & successMsg)
  useEffect(() => {
    if (location.state && (location.state as any).autoExpandId) {
      const targetId = String((location.state as any).autoExpandId);
      setExpandedRequestId(targetId);
      // Ensure target request is not hidden by date filter
      setDatePeriod("ALL");
      if ((location.state as any).successMsg) {
        setToastMsg((location.state as any).successMsg);
      }
      setTimeout(() => {
        const el = document.getElementById(`log-card-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 400);

      // Clean navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, requestsList.length]);

  // Filter requests that have check-out or check-in recorded by security
  const securityLogs = requestsList.filter((r) => {
    const hasCheckout = !!(r.security_checked_out_at || r.departure_checked_out_at || r.return_checked_out_at);
    const hasCheckin = !!(r.security_checked_in_at || r.departure_checked_in_at || r.return_checked_in_at);
    return hasCheckout || hasCheckin;
  });

  // Filter logs by date period (defaults to TODAY)
  const dateFilteredLogs = securityLogs.filter((r) =>
    matchesSecurityDate(r, datePeriod, customStartDate, customEndDate)
  );

  // Calculate statistics based on filtered logs for the selected date period
  const totalScans = dateFilteredLogs.length;
  const activeTrips = dateFilteredLogs.filter((r) => {
    if (r.trip_mode === "split_drop_pickup") {
      return (!!r.departure_checked_out_at && !r.departure_checked_in_at) ||
             (!!r.return_checked_out_at && !r.return_checked_in_at);
    }
    return !!r.security_checked_out_at && !r.security_checked_in_at;
  }).length;

  const completedTrips = dateFilteredLogs.filter((r) => {
    if (r.trip_mode === "split_drop_pickup") {
      return !!r.return_checked_in_at;
    }
    return !!r.security_checked_in_at;
  }).length;

  // Filter based on search input and active tab
  const filteredLogs = dateFilteredLogs.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      (r.driverName && r.driverName.toLowerCase().includes(search.toLowerCase())) ||
      (r.return_driver?.name && r.return_driver.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.external_driver_name && r.external_driver_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.security_checkout_by && r.security_checkout_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.security_checkin_by && r.security_checkin_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.departure_checkout_by && r.departure_checkout_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.departure_checkin_by && r.departure_checkin_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.return_checkout_by && r.return_checkout_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.return_checkin_by && r.return_checkin_by.toLowerCase().includes(search.toLowerCase()));

    const isCheckoutOnly = r.trip_mode === "split_drop_pickup"
      ? ((!!r.departure_checked_out_at && !r.departure_checked_in_at) || (!!r.return_checked_out_at && !r.return_checked_in_at))
      : (!!r.security_checked_out_at && !r.security_checked_in_at);

    const isCompleted = r.trip_mode === "split_drop_pickup"
      ? !!r.return_checked_in_at
      : !!r.security_checked_in_at;

    if (activeTab === "Sedang Jalan") {
      return matchesSearch && isCheckoutOnly;
    }
    if (activeTab === "Selesai") {
      return matchesSearch && isCompleted;
    }
    return matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedRequestId(expandedRequestId === id ? null : id);
  };

  const handleOpenCheckin = (log: any, trip?: any) => {
    setSelectedLogForCheckin(log);
    setSelectedTripForCheckin(trip || null);
    setCheckinNotes("");
    setCheckinError(null);
    setCheckinModalOpen(true);
  };

  const handleSaveCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName.trim()) {
      setCheckinError("Nama petugas security jaga wajib dipilih/diisi!");
      return;
    }

    localStorage.setItem("ovms_security_guard_name", guardName.trim());
    setCheckinSubmitting(true);
    setCheckinError(null);

    try {
      const nowDevice = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const scannedAtStr = `${nowDevice.getFullYear()}-${pad(nowDevice.getMonth() + 1)}-${pad(nowDevice.getDate())} ${pad(nowDevice.getHours())}:${pad(nowDevice.getMinutes())}:${pad(nowDevice.getSeconds())}`;

      const payload: any = {
        qr_code_token: selectedLogForCheckin.qr_code_token || `REQ-${selectedLogForCheckin.id}`,
        security_name: guardName.trim(),
        type: "checkin",
        notes: checkinNotes.trim() || undefined,
        scanned_at: scannedAtStr,
      };

      if (selectedTripForCheckin?.id) {
        payload.trip_id = selectedTripForCheckin.id;
      }

      const res = await apiClient.post("/security/scan", payload);
      if (res.data && res.data.status === "success") {
        setToastMsg(res.data.message || `Konfirmasi kembali REQ #${selectedLogForCheckin.id} berhasil dicatat!`);
        setCheckinModalOpen(false);
        setSelectedLogForCheckin(null);
        setSelectedTripForCheckin(null);
        setCheckinNotes("");
        await refetch();
      } else {
        setCheckinError(res.data?.message || "Gagal mencatat konfirmasi masuk gate.");
      }
    } catch (err: any) {
      console.error("Checkin error:", err);
      setCheckinError(err.response?.data?.message || "Gagal mencatat konfirmasi masuk gate.");
    } finally {
      setCheckinSubmitting(false);
    }
  };

  const formatDateTime = (dtStr: string | null | undefined) => {
    if (!dtStr) return "-";
    try {
      const date = new Date(dtStr);
      if (isNaN(date.getTime())) {
        return dtStr.replace("T", " ").substring(0, 16);
      }
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dtStr;
    }
  };

  return (
    <Layout activeNav="Riwayat" topbarTitle="Portal Keamanan">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-[22px] font-extrabold text-slate-800 tracking-tight">
              Buku Log Scan Security
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Riwayat keluar masuk armada kendaraan perusahaan beserta catatan petugas jaga.
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-8 sm:h-9 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <Icon name="refresh" className="text-sm sm:text-base" /> Segarkan
          </button>
        </div>

        {/* Success Toast / Notification Banner */}
        {toastMsg && (
          <div className="p-3.5 sm:p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-between gap-3 animate-fadein shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="check_circle" className="text-lg flex-shrink-0 text-emerald-600" />
              <span className="truncate">{toastMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Periode Indicator Badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span>Ringkasan Gate:</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
              <Icon name="calendar_today" className="text-xs" />
              {datePeriod === "TODAY" && "Hari Ini"}
              {datePeriod === "THIS_WEEK" && "Minggu Ini"}
              {datePeriod === "THIS_MONTH" && "Bulan Ini"}
              {datePeriod === "ALL" && "Semua Waktu"}
              {datePeriod === "CUSTOM" && (customStartDate || customEndDate ? `${customStartDate || "..."} s/d ${customEndDate || "..."}` : "Rentang Kustom")}
            </span>
          </div>
        </div>

        {/* Stats Cards - Compact 3-Column on Mobile */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-blue-50 text-[#1e3a8a] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="history" className="text-base sm:text-xl" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
              <div className="text-base sm:text-2xl font-black text-slate-800 leading-tight mt-0.5">{totalScans}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-amber-50 text-amber-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="local_shipping" className="text-base sm:text-xl" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Di Luar</div>
              <div className="text-base sm:text-2xl font-black text-slate-800 leading-tight mt-0.5">{activeTrips}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-4 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-11 sm:h-11 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="check_circle" className="text-base sm:text-xl" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</div>
              <div className="text-base sm:text-2xl font-black text-slate-800 leading-tight mt-0.5">{completedTrips}</div>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-xs space-y-3">
          {/* Baris 1: Filter Periode Tanggal (Default: Hari Ini) */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="date_range" className="text-[14px] text-blue-600" />
                Periode Tanggal:
              </span>
              {datePeriod !== "TODAY" && (
                <button
                  type="button"
                  onClick={() => {
                    setDatePeriod("TODAY");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Icon name="restart_alt" className="text-[13px]" />
                  Kembali ke Hari Ini
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] sm:text-xs font-bold scrollbar-none">
              {[
                { key: "TODAY" as SecurityDatePeriod, label: "Hari Ini", icon: "today" },
                { key: "THIS_WEEK" as SecurityDatePeriod, label: "Minggu Ini", icon: "date_range" },
                { key: "THIS_MONTH" as SecurityDatePeriod, label: "Bulan Ini", icon: "calendar_month" },
                { key: "ALL" as SecurityDatePeriod, label: "Semua Waktu", icon: "all_inclusive" },
                { key: "CUSTOM" as SecurityDatePeriod, label: "Kustom", icon: "edit_calendar" },
              ].map((tab) => {
                const isActive = datePeriod === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setDatePeriod(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#1e3a8a] text-white border-[#1e3a8a] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Icon name={tab.icon} className="text-sm" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Range Picker */}
            {datePeriod === "CUSTOM" && (
              <div className="mt-2.5 p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Dari:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">Sampai:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    Reset Tanggal
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Baris 2: Search Input & Tab Status */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Icon name="search" className="text-lg" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID Request, tujuan, driver, atau petugas..."
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Tabs Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["Semua", "Sedang Jalan", "Selesai"] as HistoryTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 sm:flex-initial px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t
                      ? "bg-white text-[#1e3a8a] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs List Section */}
        <div className="space-y-3">
          {loading && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-xs">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat scan...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-4 rounded-2xl border border-red-100 text-center">
              Gagal memuat riwayat log scan security.
            </div>
          )}

          {!loading && !error && filteredLogs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center shadow-xs text-slate-400">
              <Icon name="search_off" className="text-4xl mb-2 text-slate-300" />
              <p className="text-xs font-semibold">
                {datePeriod === "TODAY"
                  ? "Belum ada riwayat aktivitas scan keluar / masuk gate untuk hari ini."
                  : "Tidak ada riwayat scan yang cocok dengan kriteria filter."}
              </p>
              {datePeriod === "TODAY" && securityLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDatePeriod("ALL")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Icon name="all_inclusive" className="text-sm" />
                  Lihat Semua Riwayat ({securityLogs.length})
                </button>
              )}
            </div>
          )}

          {!loading &&
            !error &&
            filteredLogs.map((log) => {
              const isExpanded = expandedRequestId === log.id;
              const isSplit = log.trip_mode === "split_drop_pickup";
              const isExternal = !!log.is_external;

              // Split trip stage flags
              const depOut = log.departure_checked_out_at || (isSplit ? log.security_checked_out_at : null);
              const depIn = log.departure_checked_in_at || (isSplit && log.return_checked_out_at ? null : log.security_checked_in_at);
              const isDepDone = Boolean(depIn);
              const isDepOngoing = Boolean(depOut && !depIn);

              const retOut = log.return_checked_out_at;
              const retIn = log.return_checked_in_at;
              const isRetDone = Boolean(retIn);
              const isRetOngoing = Boolean(retOut && !retIn);

              const hasCheckin = isSplit ? isRetDone : !!log.security_checked_in_at;
              const isOngoing = isSplit ? (isDepOngoing || isRetOngoing) : (!!log.security_checked_out_at && !log.security_checked_in_at);

              // Determine primary driver and vehicle info
              const primaryDriver = isExternal 
                ? log.external_driver_name 
                : log.driverName || log.operational_trips?.[0]?.driver?.name;
              const primaryVehicle = isExternal 
                ? log.external_license_plate 
                : log.vehicleModel || log.operational_trips?.[0]?.vehicle?.name;

              return (
                <div
                  id={`log-card-${log.id}`}
                  key={log.id}
                  className={`bg-white border rounded-2xl shadow-xs overflow-hidden transition-all duration-200 ${
                    isExpanded ? "ring-2 ring-blue-500/40 border-blue-200" : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="p-4 sm:p-5 hover:bg-slate-50/50 transition-colors cursor-pointer select-none space-y-3"
                  >
                    {/* Top Row: REQ ID, Fleet Type, Status Badge & Chevron */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-extrabold text-[#1e3a8a] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          REQ #{log.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSplit
                              ? "bg-purple-50 text-purple-800 border border-purple-200/60"
                              : isExternal
                                ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                                : "bg-slate-100 text-slate-700 border border-slate-200/60"
                          }`}
                        >
                          {isSplit ? (
                            <>
                              <span className="inline sm:hidden">Split Trip</span>
                              <span className="hidden sm:inline">Split Trip (Antar & Jemput)</span>
                            </>
                          ) : isExternal ? "Armada Eksternal" : "Armada Internal"}
                        </span>
                      </div>

                      {/* Status Pill & Chevron Toggle */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        {isSplit ? (
                          isRetDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 whitespace-nowrap">
                              <Icon name="check_circle" className="text-xs text-emerald-600" />
                              <span>Selesai (Semua Sesi)</span>
                            </span>
                          ) : isRetOngoing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Sedang Jemput</span>
                            </span>
                          ) : isDepDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0 whitespace-nowrap">
                              <Icon name="schedule" className="text-xs text-blue-600" />
                              <span>Terjadwal Jemput</span>
                            </span>
                          ) : isDepOngoing ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              <span>Sedang Antar</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 shrink-0 whitespace-nowrap">
                              <Icon name="schedule" className="text-xs text-slate-500" />
                              <span>Terjadwal</span>
                            </span>
                          )
                        ) : hasCheckin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0 whitespace-nowrap">
                            <Icon name="check_circle" className="text-xs text-emerald-600" />
                            <span>Selesai</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Sedang Jalan</span>
                          </span>
                        )}

                        <div className={`w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 transition-transform ${isExpanded ? "rotate-180 bg-blue-50 text-[#1e3a8a]" : ""}`}>
                          <Icon name="keyboard_arrow_down" className="text-lg" />
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: Vehicle Icon, Destination & Requester Details */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          hasCheckin ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Icon name={hasCheckin ? "check_circle" : "local_shipping"} className="text-xl" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-slate-800 truncate leading-snug">
                          {log.destination}
                        </h4>
                        <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">
                          Pemohon: <span className="font-semibold text-slate-700">{log.employee}</span>
                          {log.department ? ` (${log.department})` : ""}
                        </div>

                        {isSplit ? (
                          <div className="mt-2 space-y-1.5">
                            {/* Sesi 1 Box */}
                            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100 text-[11px] space-y-1">
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold text-blue-800 bg-blue-100/70 px-1.5 py-0.5 rounded text-[9px] shrink-0 mt-0.5">
                                  Sesi 1 (Antar)
                                </span>
                                <div className="font-bold text-slate-800 leading-snug">
                                  {log.vehicle?.name ? `${log.vehicle.name} (${log.vehicle.plate_number})` : (log.vehicleModel || "Armada Antar")}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500 pl-0.5">
                                <Icon name="person" className="text-xs text-slate-400 shrink-0" />
                                <span>Driver: <strong className="text-slate-700">{log.driver?.name || log.driverName || "-"}</strong></span>
                              </div>
                            </div>

                            {/* Sesi 2 Box */}
                            <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100 text-[11px] space-y-1">
                              <div className="flex items-start gap-1.5">
                                <span className="font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded text-[9px] shrink-0 mt-0.5">
                                  Sesi 2 (Jemput)
                                </span>
                                <div className="font-bold text-slate-800 leading-snug">
                                  {log.return_vehicle?.name ? `${log.return_vehicle.name} (${log.return_vehicle.plate_number})` : (log.vehicleModel || "Armada Jemput")}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-[10.5px] text-slate-500 pl-0.5">
                                <Icon name="person" className="text-xs text-slate-400 shrink-0" />
                                <span>Driver: <strong className="text-slate-700">{log.return_driver?.name || log.driverName || "-"}</strong></span>
                                {log.return_departure_time && (
                                  <span className="text-slate-400 text-[10px] ml-1">
                                    • {formatDateTime(log.return_departure_time)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          (primaryDriver || primaryVehicle) && (
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                              <Icon name="directions_car" className="text-xs text-slate-400 flex-shrink-0" />
                              <span className="truncate">{primaryVehicle || "Armada"}</span>
                              <span className="text-slate-300">•</span>
                              <Icon name="person" className="text-xs text-slate-400 flex-shrink-0" />
                              <span className="truncate">{primaryDriver || "Driver"}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Timestamp and (when collapsed) Quick Return Button */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100/80 text-[10.5px] text-slate-400">
                      <div>
                        <span>Update: </span>
                        <span className="font-medium text-slate-600">
                          {formatDateTime(
                            isSplit
                              ? (retIn || retOut || depIn || depOut)
                              : (log.security_checked_in_at || log.security_checked_out_at)
                          )}
                        </span>
                      </div>

                      {/* Quick Return Action Button only when Collapsed to avoid duplicate */}
                      {isOngoing && !isExpanded && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCheckin(log);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all cursor-pointer"
                          title="Konfirmasi unit armada telah kembali masuk gate pabrik"
                        >
                          <Icon name="login" className="text-sm" />
                          <span>{isSplit ? (isRetOngoing ? "Kembali Jemput" : "Kembali Antar") : "Konfirmasi Kembali"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 p-4 sm:p-5 space-y-4 animate-fadein">
                      
                      {isSplit ? (
                        <div className="space-y-3">
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                              <Icon name="sync" className="text-sm text-blue-700 shrink-0" />
                              <span className="inline sm:hidden">Rincian Sesi (Split Trip)</span>
                              <span className="hidden sm:inline">Rincian Sesi Perjalanan (Split Trip: Antar & Jemput)</span>
                            </span>
                            {log.total_km ? (
                              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full font-mono shrink-0">
                                Total: {Number(log.total_km).toLocaleString('id-ID')} km
                              </span>
                            ) : null}
                          </div>

                          {/* Card Sesi 1: Antar */}
                          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-blue-200/70 shadow-xs space-y-3">
                            <div className="border-b border-blue-50 pb-2.5 space-y-1.5">
                              {/* Row 1: Session Title + Status Badge */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                  <Icon name="directions_car" className="text-base text-blue-900 shrink-0" />
                                  <span>Sesi 1: Antar (Keberangkatan)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                                  isDepDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  isDepOngoing ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                                  "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {isDepDone ? "Selesai (Kembali)" : isDepOngoing ? "Sedang Mengantar" : "Terjadwal"}
                                </span>
                              </div>

                              {/* Row 2: Vehicle details */}
                              <div className="text-[11.5px] text-slate-700 font-semibold flex items-center gap-1.5 pl-5">
                                <span>{log.vehicle?.name ? `${log.vehicle.name} (${log.vehicle.plate_number})` : (log.vehicleModel || "Armada")}</span>
                              </div>

                              {/* Row 3: Driver details */}
                              <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 pl-5">
                                <Icon name="person" className="text-xs text-slate-400 shrink-0" />
                                <span>Driver: <strong className="text-slate-800">{log.driver?.name || log.driverName || "-"}</strong></span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              {/* Sesi 1 Berangkat */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                                  <Icon name="arrow_outward" className="text-xs" /> Log Berangkat Antar
                                </div>
                                {depOut ? (
                                  <div className="space-y-0.5 text-[11px] text-slate-600">
                                    <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(depOut)}</span></div>
                                    <div>Petugas: <span className="font-semibold text-slate-700">{log.departure_checkout_by || log.security_checkout_by || "-"}</span></div>
                                    {log.departure_checkout_notes && (
                                      <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{log.departure_checkout_notes}"</p>
                                    )}
                                    {log.departure_start_km && (
                                      <div className="pt-1 text-[10.5px] text-slate-700 font-medium">
                                        KM Keluar: <span className="font-bold font-mono text-amber-900">{Number(log.departure_start_km).toLocaleString('id-ID')} km</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Belum tercatat berangkat</div>
                                )}
                              </div>

                              {/* Sesi 1 Kembali */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                                  <Icon name="login" className="text-xs" /> Log Kembali ke Pabrik
                                </div>
                                {depIn ? (
                                  <div className="space-y-0.5 text-[11px] text-slate-600">
                                    <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(depIn)}</span></div>
                                    <div>Petugas: <span className="font-semibold text-slate-700">{log.departure_checkin_by || log.security_checkin_by || "-"}</span></div>
                                    {log.departure_checkin_notes && (
                                      <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{log.departure_checkin_notes}"</p>
                                    )}
                                    {log.departure_end_km && (
                                      <div className="pt-1 text-[10.5px] text-slate-700 font-medium">
                                        KM Masuk: <span className="font-bold font-mono text-emerald-900">{Number(log.departure_end_km).toLocaleString('id-ID')} km</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Belum kembali ke pabrik</div>
                                )}
                              </div>
                            </div>

                            {/* Sesi 1 Odometer summary */}
                            {log.departure_total_km !== null && log.departure_total_km !== undefined && (
                              <div className="bg-blue-50/70 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                                  <Icon name="speed" className="text-sm text-blue-600 shrink-0" />
                                  <span>Odometer Sesi Antar</span>
                                </span>
                                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                                  <span className="font-mono text-slate-700 text-[11px]">
                                    {Number(log.departure_start_km ?? 0).toLocaleString('id-ID')} km ➔ {Number(log.departure_end_km ?? 0).toLocaleString('id-ID')} km
                                  </span>
                                  <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono shrink-0">
                                    {Number(log.departure_total_km).toLocaleString('id-ID')} km
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Quick return button for Sesi 1 if ongoing */}
                            {isDepOngoing && (
                              <div className="pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckin(log)}
                                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <Icon name="login" className="text-base" />
                                  <span>
                                    <span className="inline sm:hidden">Konfirmasi Masuk Gate (Sesi Antar)</span>
                                    <span className="hidden sm:inline">Konfirmasi Masuk Gate - Sesi Antar (Kembali ke Pabrik)</span>
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Card Sesi 2: Jemput */}
                          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-amber-200/70 shadow-xs space-y-3">
                            <div className="border-b border-amber-50 pb-2.5 space-y-1.5">
                              {/* Row 1: Session Title + Status Badge */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                  <Icon name="sync" className="text-base text-amber-700 shrink-0" />
                                  <span>Sesi 2: Jemput (Penjemputan)</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${
                                  isRetDone ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                  isRetOngoing ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse" :
                                  isDepDone ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                  "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {isRetDone ? "Selesai Sempurna" : isRetOngoing ? "Sedang Menjemput" : isDepDone ? "Siap Berangkat" : "Menunggu Sesi Antar"}
                                </span>
                              </div>

                              {/* Row 2: Vehicle details */}
                              <div className="text-[11.5px] text-slate-700 font-semibold flex items-center gap-1.5 pl-5">
                                <span>{log.return_vehicle?.name ? `${log.return_vehicle.name} (${log.return_vehicle.plate_number})` : (log.vehicleModel || "Armada")}</span>
                              </div>

                              {/* Row 3: Driver details */}
                              <div className="text-[11px] text-slate-500 font-medium flex items-center flex-wrap gap-x-2 gap-y-0.5 pl-5">
                                <div className="flex items-center gap-1">
                                  <Icon name="person" className="text-xs text-slate-400 shrink-0" />
                                  <span>Driver: <strong className="text-slate-800">{log.return_driver?.name || log.driverName || "-"}</strong></span>
                                </div>
                                {log.return_departure_time && (
                                  <span className="text-slate-400 text-[10.5px]">
                                    (Jadwal: {formatDateTime(log.return_departure_time)})
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                              {/* Sesi 2 Berangkat */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                                  <Icon name="arrow_outward" className="text-xs" /> Log Berangkat Jemput
                                </div>
                                {retOut ? (
                                  <div className="space-y-0.5 text-[11px] text-slate-600">
                                    <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(retOut)}</span></div>
                                    <div>Petugas: <span className="font-semibold text-slate-700">{log.return_checkout_by || "-"}</span></div>
                                    {log.return_checkout_notes && (
                                      <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{log.return_checkout_notes}"</p>
                                    )}
                                    {log.return_start_km && (
                                      <div className="pt-1 text-[10.5px] text-slate-700 font-medium">
                                        KM Keluar: <span className="font-bold font-mono text-amber-900">{Number(log.return_start_km).toLocaleString('id-ID')} km</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Belum berangkat jemput</div>
                                )}
                              </div>

                              {/* Sesi 2 Kembali */}
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                                  <Icon name="login" className="text-xs" /> Log Selesai Masuk Gate
                                </div>
                                {retIn ? (
                                  <div className="space-y-0.5 text-[11px] text-slate-600">
                                    <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(retIn)}</span></div>
                                    <div>Petugas: <span className="font-semibold text-slate-700">{log.return_checkin_by || "-"}</span></div>
                                    {log.return_checkin_notes && (
                                      <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{log.return_checkin_notes}"</p>
                                    )}
                                    {log.return_end_km && (
                                      <div className="pt-1 text-[10.5px] text-slate-700 font-medium">
                                        KM Masuk: <span className="font-bold font-mono text-emerald-900">{Number(log.return_end_km).toLocaleString('id-ID')} km</span>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-slate-400 italic text-[11px]">Belum kembali (di perjalanan)</div>
                                )}
                              </div>
                            </div>

                            {/* Sesi 2 Odometer summary */}
                            {log.return_total_km !== null && log.return_total_km !== undefined && (
                              <div className="bg-amber-50/70 p-2.5 sm:px-3 sm:py-2 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                                  <Icon name="speed" className="text-sm text-amber-600 shrink-0" />
                                  <span>Odometer Sesi Jemput</span>
                                </span>
                                <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-semibold">
                                  <span className="font-mono text-slate-700 text-[11px]">
                                    {Number(log.return_start_km ?? 0).toLocaleString('id-ID')} km ➔ {Number(log.return_end_km ?? 0).toLocaleString('id-ID')} km
                                  </span>
                                  <span className="text-[10px] font-extrabold bg-amber-600 text-white px-2 py-0.5 rounded-full font-mono shrink-0">
                                    {Number(log.return_total_km).toLocaleString('id-ID')} km
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Quick return button for Sesi 2 if ongoing */}
                            {isRetOngoing && (
                              <div className="pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => handleOpenCheckin(log)}
                                  className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                  <Icon name="login" className="text-base" />
                                  <span>
                                    <span className="inline sm:hidden">Konfirmasi Masuk Gate (Sesi Jemput)</span>
                                    <span className="hidden sm:inline">Konfirmasi Masuk Gate - Sesi Jemput (Selesai Rangkaian)</span>
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : !isExternal && log.operational_trips && log.operational_trips.length > 0 ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Icon name="directions_car" className="text-sm text-slate-400" />
                              Rincian Unit Kendaraan ({log.operational_trips.length} Armada)
                            </span>
                          </div>

                          {log.operational_trips.map((trip: any) => {
                            const isTripCompleted = trip.status === "completed" || !!trip.security_checked_in_at;
                            const isTripOngoing = trip.status === "on_going" || (!!trip.security_checked_out_at && !trip.security_checked_in_at);

                            return (
                              <div key={trip.id} className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs space-y-3">
                                {/* Unit Title & Status */}
                                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
                                  <div>
                                    <div className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                                      <Icon name="directions_car" className="text-base text-blue-900" />
                                      <span>{trip.vehicle?.name || "Kendaraan"}</span>
                                      <span className="text-slate-400 font-normal">({trip.vehicle?.plate_number || "-"})</span>
                                    </div>
                                    <div className="text-[11.5px] text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                                      <Icon name="person" className="text-xs text-slate-400" />
                                      <span>Driver: <strong className="text-slate-800">{trip.driver?.name || "-"}</strong></span>
                                    </div>
                                  </div>

                                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                                    isTripCompleted ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                    isTripOngoing ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                    "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}>
                                    {isTripCompleted ? "Selesai" : isTripOngoing ? "Sedang Jalan" : "Terjadwal"}
                                  </span>
                                </div>

                                {/* Timestamps Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                  {/* Trip Checkout */}
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                                      <Icon name="arrow_outward" className="text-xs" /> Log Berangkat
                                    </div>
                                    {trip.security_checked_out_at ? (
                                      <div className="space-y-0.5 text-[11px] text-slate-600">
                                        <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(trip.security_checked_out_at)}</span></div>
                                        <div>Petugas: <span className="font-semibold text-slate-700">{trip.security_checkout_by || "-"}</span></div>
                                        {trip.security_checkout_notes && (
                                          <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{trip.security_checkout_notes}"</p>
                                        )}
                                        {trip.additional_passengers && (
                                          <div className="bg-amber-50/80 p-1.5 rounded-md mt-1 border border-amber-200/60 text-amber-900 text-[11px] font-semibold flex items-center gap-1">
                                            <Icon name="person_add" className="text-xs text-amber-700" />
                                            <span>+ {trip.additional_passengers}</span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 italic text-[11px]">Belum tercatat berangkat</div>
                                    )}
                                  </div>

                                  {/* Trip Checkin */}
                                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                    <div className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                                      <Icon name="login" className="text-xs" /> Log Kembali
                                    </div>
                                    {trip.security_checked_in_at ? (
                                      <div className="space-y-0.5 text-[11px] text-slate-600">
                                        <div>Waktu: <span className="font-bold text-slate-800">{formatDateTime(trip.security_checked_in_at)}</span></div>
                                        <div>Petugas: <span className="font-semibold text-slate-700">{trip.security_checkin_by || "-"}</span></div>
                                        {trip.security_checkin_notes && (
                                          <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-200/60 text-slate-600">"{trip.security_checkin_notes}"</p>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-slate-400 italic text-[11px]">Belum kembali (masih di luar)</div>
                                    )}
                                  </div>
                                </div>

                                {/* Return Action Button for this unit */}
                                {trip.security_checked_out_at && !trip.security_checked_in_at && (
                                  <div className="pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenCheckin(log, trip)}
                                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                    >
                                      <Icon name="login" className="text-base" />
                                      <span>Konfirmasi Masuk Gate (Kembali)</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Driver & Vehicle Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs text-xs">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Kendaraan
                              </div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Icon name="directions_car" className="text-sm text-slate-400" />
                                {isExternal ? log.external_license_plate || "Tipe Sewa" : log.vehicleModel}
                              </div>
                              {isExternal && log.external_fleet_info && (
                                <div className="text-[10.5px] text-slate-400 mt-0.5 italic">Info: {log.external_fleet_info}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Driver / Pengemudi
                              </div>
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Icon name="person" className="text-sm text-slate-400" />
                                {isExternal ? log.external_driver_name || "Driver Eksternal" : log.driverName}
                              </div>
                            </div>
                          </div>

                          {/* Security Scan Logs */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Checkout Log */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs space-y-2">
                              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
                                <Icon name="arrow_outward" className="text-xs" />
                                LOG BERANGKAT
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Waktu:</span>
                                  <span className="font-bold text-slate-800">{formatDateTime(log.security_checked_out_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Petugas Jaga:</span>
                                  <span className="font-semibold text-slate-700">{log.security_checkout_by || "-"}</span>
                                </div>
                                {log.security_checkout_notes && (
                                  <div className="mt-2 pt-1 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan:</span>
                                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                                      "{log.security_checkout_notes}"
                                    </p>
                                  </div>
                                )}
                                {log.additional_passengers && (
                                  <div className="mt-2 pt-1 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mb-0.5">
                                      <Icon name="person_add" className="text-xs" /> Penumpang Tambahan (Hari-H):
                                    </span>
                                    <p className="text-xs font-semibold text-slate-700 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                                      {log.additional_passengers}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Checkin Log */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-xs space-y-2">
                              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1">
                                <Icon name="login" className="text-xs" />
                                LOG KEMBALI
                              </div>
                              <div className="text-xs space-y-1">
                                {log.security_checked_in_at ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Waktu:</span>
                                      <span className="font-bold text-slate-800">{formatDateTime(log.security_checked_in_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Petugas Jaga:</span>
                                      <span className="font-semibold text-slate-700">{log.security_checkin_by || "-"}</span>
                                    </div>
                                    {log.security_checkin_notes && (
                                      <div className="mt-2 pt-1 border-t border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan:</span>
                                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic border border-slate-100">
                                          "{log.security_checkin_notes}"
                                        </p>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="py-2 text-center text-slate-400 italic text-[11px]">
                                    Armada belum kembali (masih di luar).
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Single Return Action Button */}
                          {!hasCheckin && log.security_checked_out_at && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => handleOpenCheckin(log)}
                                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                              >
                                <Icon name="login" className="text-base" />
                                <span>Konfirmasi Masuk Gate (Kembali)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
        </div>

      </div>

      {/* Modal Konfirmasi Kembali (Masuk Gate) */}
      {checkinModalOpen && selectedLogForCheckin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadein">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-scalein">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Icon name="login" className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                    Konfirmasi Masuk Gate (Kembali)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    REQ #{selectedLogForCheckin.id} • {selectedLogForCheckin.destination}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            {selectedTripForCheckin ? (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unit Khusus:</div>
                <div className="font-bold text-slate-700">
                  {selectedTripForCheckin.vehicle?.name || "Kendaraan"} ({selectedTripForCheckin.vehicle?.plate_number || "-"})
                </div>
                <div className="text-slate-500">
                  Driver: <span className="font-semibold">{selectedTripForCheckin.driver?.name || "-"}</span>
                </div>
              </div>
            ) : selectedLogForCheckin.trip_mode === "split_drop_pickup" ? (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1.5">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  {selectedLogForCheckin.return_checked_out_at && !selectedLogForCheckin.return_checked_in_at
                    ? "Sesi 2: Jemput (Penjemputan)"
                    : "Sesi 1: Antar (Keberangkatan)"}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver:</span>
                  <span className="font-bold text-slate-700">
                    {selectedLogForCheckin.return_driver?.name || selectedLogForCheckin.driverName || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kendaraan:</span>
                  <span className="font-bold text-slate-700">
                    {selectedLogForCheckin.return_vehicle?.name 
                      ? `${selectedLogForCheckin.return_vehicle.name} (${selectedLogForCheckin.return_vehicle.plate_number})` 
                      : (selectedLogForCheckin.vehicleModel || "-")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Driver:</span>
                  <span className="font-bold text-slate-700">
                    {selectedLogForCheckin.driverName || selectedLogForCheckin.external_driver_name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kendaraan:</span>
                  <span className="font-bold text-slate-700">
                    {selectedLogForCheckin.vehicleModel || selectedLogForCheckin.external_license_plate || "-"}
                  </span>
                </div>
              </div>
            )}

            {checkinError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <Icon name="error" className="text-base flex-shrink-0" />
                <span>{checkinError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCheckin} className="space-y-4">
              {/* Petugas Security */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Petugas Security Jaga <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Icon name="assignment_ind" className="text-lg" />
                    </span>
                    <select
                      required
                      value={selectedGuardOption}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedGuardOption(val);
                        if (val !== "custom") {
                          setGuardName(val);
                        } else {
                          setGuardName("");
                        }
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-xs sm:text-sm"
                    >
                      <option value="" disabled>-- Pilih Nama Petugas --</option>
                      {predefinedGuards.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value="custom">Ketik Manual (Nama Lainnya)</option>
                    </select>
                  </div>

                  {selectedGuardOption === "custom" && (
                    <div className="relative animate-fadein">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Icon name="person" className="text-lg" />
                      </span>
                      <input
                        type="text"
                        required
                        value={guardName}
                        onChange={(e) => setGuardName(e.target.value)}
                        placeholder="Ketik Nama Petugas (Contoh: Budi)"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold text-xs sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Catatan Masuk */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                  Catatan Petugas (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  placeholder="Kondisi armada, barang bawaan, atau catatan lainnya..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2 text-xs sm:text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setCheckinModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={checkinSubmitting || !guardName.trim()}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                >
                  {checkinSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Icon name="done_all" className="text-base" />
                      <span>Konfirmasi Masuk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
