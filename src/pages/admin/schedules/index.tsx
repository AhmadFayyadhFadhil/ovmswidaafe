import { useState, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { vehicleService } from "@/services/modules/vehicleService";

export type TripStatus = "scheduled" | "on_going" | "completed";
export type ViewMode = "month" | "week" | "gantt";
export type StatusFilter = "ALL" | "scheduled" | "on_going" | "completed";

export interface ScheduleEvent {
  id: string;
  requestId: string | number;
  applicantName: string;
  departmentName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  destination: string;
  purpose: string;
  dateStr: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: TripStatus;
  priority: string;
  rawRequest: any;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const WEEK_DAYS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Ming"];

function parseToDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  if (dateStr.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateToYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTripStatusStyle(status: TripStatus) {
  switch (status) {
    case "completed":
      return {
        bg: "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700",
        badge: "bg-emerald-700 text-white font-bold",
        label: "✓ Completed",
        icon: "check_circle",
      };
    case "on_going":
      return {
        bg: "bg-amber-400 text-amber-950 hover:bg-amber-500 font-extrabold border-amber-500 animate-pulse",
        badge: "bg-amber-950 text-amber-300 font-black",
        label: "⚡ On Going",
        icon: "bolt",
      };
    case "scheduled":
    default:
      return {
        bg: "bg-[#1e3a8a] text-white hover:bg-blue-900 border-blue-900",
        badge: "bg-blue-950 text-blue-100 font-bold",
        label: "🗓️ Scheduled",
        icon: "event",
      };
  }
}

export default function Schedule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [vehicleType, setVehicleType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Ambil semua request & kendaraan dari backend
  const { data: scheduleData, loading, error, refetch } = useApi(async () => {
    const [reqsRes, vehiclesRes] = await Promise.all([
      requestService.getAll({ per_page: 1000 }),
      vehicleService.getAll({ per_page: 1000 }),
    ]);
    return {
      data: {
        requests: reqsRes.data || [],
        vehicles: vehiclesRes.data || [],
      }
    };
  }, true, []);

  const allRequests = scheduleData?.requests || [];
  const allVehicles = scheduleData?.vehicles || [];

  // Map nama/model kendaraan ke tipe kategorinya & nopol
  const vehicleInfoMap = useMemo(() => {
    const map = new Map<string, { type: string; plate: string }>();
    allVehicles.forEach((v: any) => {
      const info = {
        type: v.type || "Sedan",
        plate: v.license_plate || v.plate_number || v.plate || "",
      };
      if (v.name) map.set(v.name.toLowerCase().trim(), info);
      if (v.model) map.set(v.model.toLowerCase().trim(), info);
    });
    return map;
  }, [allVehicles]);

  // Transform backend requests menjadi ScheduleEvent list
  const scheduleEvents = useMemo(() => {
    const events: ScheduleEvent[] = [];

    allRequests.forEach((r: any) => {
      const rawSt = (r.rawStatus || r.status || "").toLowerCase();
      if (["rejected", "cancelled", "draft"].includes(rawSt)) return;

      const vModel = (r.vehicleModel || r.vehicle_model || r.vehicle_name || "Unassigned").replace(/\s*\(\s*\)/g, "").trim();
      const vInfo = vehicleInfoMap.get(vModel.toLowerCase()) || { type: "Sedan", plate: "" };

      let itemStatus: TripStatus = "scheduled";
      if (rawSt === "completed") {
        itemStatus = "completed";
      } else if (rawSt === "on_going" || rawSt === "ongoing") {
        itemStatus = "on_going";
      }

      if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
        // Multi-day trip itineraries
        r.itineraries.forEach((it: any, idx: number) => {
          if (it.status === "cancelled" || it.status === "rejected") return;

          let itStatus: TripStatus = itemStatus;
          if (it.status === "completed" || (it.morning_status === "completed" && (!it.afternoon_destination || it.afternoon_status === "completed"))) {
            itStatus = "completed";
          } else if (it.status === "on_going" || it.morning_status === "on_going" || it.afternoon_status === "on_going") {
            itStatus = "on_going";
          }

          const itDate = parseToDate(it.date);
          const dateStr = itDate ? formatDateToYYYYMMDD(itDate) : (r.date || "");
          const itDest = it.morning_destination || it.afternoon_destination || r.destination || r.purpose || "";

          events.push({
            id: `req-${r.id}-it-${idx}`,
            requestId: r.id,
            applicantName: r.employee || r.user_name || "Staff",
            departmentName: r.department || r.department_name || "-",
            vehicleModel: it.vehicle_name || vModel,
            vehiclePlate: vInfo.plate,
            vehicleType: vInfo.type,
            driverName: r.driver_name || r.driverName || "Assigning...",
            driverPhone: r.driver_phone || r.driverPhone || "",
            destination: itDest,
            purpose: r.purpose || itDest,
            dateStr: dateStr,
            startTime: r.start_time || "08:00",
            endTime: r.end_time || "17:00",
            status: itStatus,
            priority: r.priority || "NORMAL",
            rawRequest: r,
          });
        });
      } else {
        // Single-day trip request
        const d = parseToDate(r.date || r.start_time);
        const dateStr = d ? formatDateToYYYYMMDD(d) : "";

        events.push({
          id: `req-${r.id}`,
          requestId: r.id,
          applicantName: r.employee || r.user_name || "Staff",
          departmentName: r.department || r.department_name || "-",
          vehicleModel: vModel,
          vehiclePlate: vInfo.plate,
          vehicleType: vInfo.type,
          driverName: r.driver_name || r.driverName || "Assigning...",
          driverPhone: r.driver_phone || r.driverPhone || "",
          destination: r.destination || r.purpose || "",
          purpose: r.purpose || r.destination || "",
          dateStr: dateStr,
          startTime: r.start_time || "08:00",
          endTime: r.end_time || "17:00",
          status: itemStatus,
          priority: r.priority || "NORMAL",
          rawRequest: r,
        });
      }
    });

    return events;
  }, [allRequests, vehicleInfoMap]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return scheduleEvents.filter((ev) => {
      // Filter Status
      if (statusFilter !== "ALL" && ev.status !== statusFilter) return false;

      // Filter Vehicle Type
      if (vehicleType !== "All") {
        const targetType = vehicleType.toLowerCase().trim();
        const evType = ev.vehicleType.toLowerCase().trim();
        const evModel = ev.vehicleModel.toLowerCase().trim();
        if (!evType.includes(targetType) && !evModel.includes(targetType)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          ev.applicantName.toLowerCase().includes(q) ||
          ev.vehicleModel.toLowerCase().includes(q) ||
          ev.destination.toLowerCase().includes(q) ||
          ev.driverName.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [scheduleEvents, statusFilter, vehicleType, searchQuery]);

  // Statistik Ringkas
  const todayStr = formatDateToYYYYMMDD(new Date());
  const scheduledCount = scheduleEvents.filter((e) => e.status === "scheduled").length;
  const onGoingCount = scheduleEvents.filter((e) => e.status === "on_going").length;
  const completedCount = scheduleEvents.filter((e) => e.status === "completed").length;
  const scheduledTodayCount = scheduleEvents.filter((e) => e.dateStr === todayStr).length;

  // Month Grid Calculation (7 Columns: Senin - Minggu)
  const monthCalendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // JS getDay(): 0 = Sun, 1 = Mon ... 6 = Sat
    // Convert to 0 = Mon, 6 = Sun
    let startDayIdx = firstDayOfMonth.getDay() - 1;
    if (startDayIdx < 0) startDayIdx = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    const gridCells: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayIdx - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      gridCells.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      gridCells.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 cells grid
    const remaining = (7 - (gridCells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      gridCells.push({
        date: d,
        dateStr: formatDateToYYYYMMDD(d),
        isCurrentMonth: false,
      });
    }

    return gridCells;
  }, [currentDate]);

  // Events Grouped by DateStr
  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    filteredEvents.forEach((ev) => {
      if (!ev.dateStr) return;
      if (!map.has(ev.dateStr)) map.set(ev.dateStr, []);
      map.get(ev.dateStr)!.push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Navigasi Bulan
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Layout
      activeNav="Vehicle Schedule"
      onNavigate={onNavigate}
      topbarTitle="Vehicle Schedule"
      searchPlaceholder="Search schedule, driver, or vehicle..."
    >
      <div className="p-4 sm:p-6 space-y-5 animate-fadein">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[24px] sm:text-[26px] font-bold text-[#0f172a]">Vehicle Schedule Calendar</h2>
            <p className="text-[13px] text-[#64748b] mt-0.5 max-w-lg leading-relaxed">
              Pantau jadwal penggunaan armada berdasarkan status keberangkatan (*Scheduled*, *On Going*, *Completed*).
            </p>
          </div>

          {/* Mode View Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "month" ? "bg-[#1e3a8a] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="calendar_month" className="text-base" />
              Kalender Bulanan
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "gantt" ? "bg-[#1e3a8a] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon name="view_timeline" className="text-base" />
              Timeline Matriks
            </button>
          </div>
        </div>

        {/* ── Stat Cards Status Perjalanan ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Jadwal Hari Ini</span>
              <Icon name="today" className="text-blue-900 text-lg" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{loading ? "..." : scheduledTodayCount}</div>
            <span className="text-[11px] text-slate-400 font-medium">Trip hari ini</span>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">🗓️ Scheduled</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-950">{loading ? "..." : scheduledCount}</div>
            <span className="text-[11px] text-blue-800 font-medium">Terjadwal mendatang</span>
          </div>

          <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">⚡ On Going</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-950">{loading ? "..." : onGoingCount}</div>
            <span className="text-[11px] text-amber-800 font-medium">Sedang di jalan</span>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">✓ Completed</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">{loading ? "..." : completedCount}</div>
            <span className="text-[11px] text-emerald-800 font-medium">Tugas selesai</span>
          </div>
        </div>

        {/* ── Main Schedule Container ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            {/* Calendar Month Controls */}
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-800">
                {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex items-center gap-1 ml-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer"
                  title="Bulan Sebelumnya"
                >
                  <Icon name="chevron_left" className="text-lg" />
                </button>

                <button
                  type="button"
                  onClick={handleToday}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Bulan Ini
                </button>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-700 transition-colors cursor-pointer"
                  title="Bulan Berikutnya"
                >
                  <Icon name="chevron_right" className="text-lg" />
                </button>
              </div>
            </div>

            {/* Filter Pills Status Perjalanan */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-2xl shadow-2xs overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("scheduled")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === "scheduled" ? "bg-[#1e3a8a] text-white" : "text-blue-900 hover:bg-blue-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Scheduled
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("on_going")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === "on_going" ? "bg-amber-500 text-amber-950 font-extrabold" : "text-amber-900 hover:bg-amber-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                On Going
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("completed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  statusFilter === "completed" ? "bg-emerald-600 text-white" : "text-emerald-900 hover:bg-emerald-50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Completed
              </button>
            </div>

            {/* Additional Search & Category Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Cari driver / pemohon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full sm:w-44"
              />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Icon name="filter_list" className="text-base text-slate-500" />
                  {vehicleType}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1 min-w-[150px] animate-fadein">
                    {["All", "Sedan", "MPV", "SUV", "Van", "Truck", "Bus"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setVehicleType(t);
                          setFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${
                          vehicleType === t ? "bg-blue-50 text-[#1e3a8a]" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors cursor-pointer"
                title="Refresh Jadwal"
              >
                <Icon name="refresh" className="text-lg" />
              </button>
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-[#1e3a8a] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Memuat Jadwal Perjalanan...</p>
            </div>
          )}

          {error && (
            <div className="p-8 text-center text-rose-600 space-y-2">
              <Icon name="error" className="text-3xl mx-auto" />
              <p className="text-xs font-bold">Gagal memuat jadwal dari server.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="px-4 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded-xl"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* ── MODE 1: MONTH CALENDAR GRID VIEW ── */}
          {!loading && !error && viewMode === "month" && (
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Header 7 Hari */}
                <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-50 text-center font-extrabold text-xs text-slate-600 py-2.5">
                  {WEEK_DAYS_SHORT.map((day) => (
                    <div key={day}>{day}</div>
                  ))}
                </div>

                {/* Grid Cells Tanggal */}
                <div className="grid grid-cols-7 auto-rows-fr bg-slate-200/50 gap-[1px]">
                  {monthCalendarGrid.map((cell, idx) => {
                    const isToday = cell.dateStr === todayStr;
                    const cellEvents = eventsByDate.get(cell.dateStr) || [];

                    return (
                      <div
                        key={idx}
                        className={`bg-white min-h-[120px] p-2 flex flex-col justify-between transition-colors ${
                          !cell.isCurrentMonth ? "bg-slate-50/60 opacity-50" : ""
                        } ${isToday ? "ring-2 ring-blue-600 ring-inset bg-blue-50/20" : ""}`}
                      >
                        {/* Cell Date Top Bar */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                              isToday
                                ? "bg-[#1e3a8a] text-white"
                                : cell.isCurrentMonth
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {cell.date.getDate()}
                          </span>

                          {cellEvents.length > 0 && (
                            <span className="text-[10px] font-extrabold text-slate-400">
                              {cellEvents.length} Trip
                            </span>
                          )}
                        </div>

                        {/* List Event Chips */}
                        <div className="space-y-1 overflow-y-auto max-h-[140px] pr-0.5">
                          {cellEvents.map((ev) => {
                            const st = getTripStatusStyle(ev.status);
                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => setSelectedEvent(ev)}
                                className={`w-full text-left p-1.5 rounded-xl border text-[10.5px] leading-tight transition-all cursor-pointer shadow-2xs hover:scale-[1.02] ${st.bg}`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="font-extrabold truncate max-w-[90px]">{ev.applicantName}</span>
                                  <span className={`text-[8px] px-1 py-0.2 rounded ${st.badge}`}>
                                    {ev.status === "completed" ? "✓" : ev.status === "on_going" ? "⚡" : "🗓️"}
                                  </span>
                                </div>
                                <div className="text-[9.5px] opacity-90 truncate font-semibold">
                                  {ev.vehicleModel}
                                </div>
                                <div className="text-[8.5px] opacity-75 truncate">
                                  📍 {ev.destination || "Trip Operational"}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── MODE 2: TIMELINE GANTT MATRIX VIEW ── */}
          {!loading && !error && viewMode === "gantt" && (
            <div className="p-6 text-slate-600 text-xs space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 flex items-center justify-between">
                <span>Mode Timeline Gantt aktif. Anda juga dapat memilih Mode Kalender Bulanan di kanan atas.</span>
              </div>
              {/* Event list fallback timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredEvents.map((ev) => {
                  const st = getTripStatusStyle(ev.status);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-blue-400 transition-all cursor-pointer flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${st.bg}`}>
                            {st.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{ev.dateStr}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{ev.applicantName} ({ev.departmentName})</h4>
                        <p className="text-xs text-slate-500 font-semibold">🚗 {ev.vehicleModel} {ev.vehiclePlate && `(${ev.vehiclePlate})`}</p>
                        <p className="text-xs text-slate-500">📍 {ev.destination}</p>
                      </div>
                      <Icon name="chevron_right" className="text-slate-400 text-xl" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend Bottom Bar */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase text-slate-400">Legenda Status Perjalanan:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1e3a8a]" />
                <span className="font-bold text-slate-700">Scheduled (Terjadwal)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold text-slate-700">On Going (Sedang Berjalan)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span className="font-bold text-slate-700">Completed (Selesai)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EVENT DETAIL LIGHTBOX MODAL ── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadein"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-slate-100 animate-scalein"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center font-bold">
                  <Icon name="event_available" className="text-lg" />
                </div>
                <div>
                  <h3 className="text-[16px] font-extrabold text-slate-800">Detail Jadwal Perjalanan</h3>
                  <p className="text-xs text-slate-400">Request #{selectedEvent.requestId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            {/* Status & Date Bar */}
            <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Tanggal: {selectedEvent.dateStr}</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${getTripStatusStyle(selectedEvent.status).bg}`}>
                {getTripStatusStyle(selectedEvent.status).label}
              </span>
            </div>

            {/* Info Items */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 block text-xs font-semibold">Pemohon & Departemen</span>
                <span className="font-extrabold text-slate-900">{selectedEvent.applicantName}</span>
                <span className="text-slate-500 ml-1">({selectedEvent.departmentName})</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs font-semibold">Unit Kendaraan</span>
                  <span className="font-bold text-blue-900">{selectedEvent.vehicleModel}</span>
                  {selectedEvent.vehiclePlate && (
                    <span className="block font-mono text-slate-600 text-xs">{selectedEvent.vehiclePlate}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-xs font-semibold">Driver Penanggung Jawab</span>
                  <span className="font-bold text-slate-800">{selectedEvent.driverName}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-xs font-semibold">Tujuan & Keperluan</span>
                <p className="font-medium text-slate-800 leading-relaxed mt-0.5">
                  📍 {selectedEvent.destination || selectedEvent.purpose}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              {selectedEvent.driverPhone && (
                <a
                  href={`https://wa.me/${selectedEvent.driverPhone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-[#25D366] text-white font-bold text-xs rounded-xl hover:bg-[#20bd5a] transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Icon name="chat" className="text-sm" />
                  Hubungi Driver
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
