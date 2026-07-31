import { useState, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";
import { vehicleService } from "@/services/modules/vehicleService";

// ── Gantt ──
const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const COL_W = 130;

const BLOCK_STYLES: Record<string, string> = {
  NORMAL:   "bg-[#1e3a8a] text-white",
  URGENT:   "bg-[#f97316] text-white",
  CRITICAL: "bg-[#ef4444] text-white",
};

function getBlockStyle(priority: string) {
  const p = (priority || "").toUpperCase();
  return BLOCK_STYLES[p] || BLOCK_STYLES.NORMAL;
}

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

function getDayIndex(dateStr: string, startOfWeek: Date, endOfWeek: Date) {
  const d = parseToDate(dateStr);
  if (!d) return -1;
  
  const dateToCompare = new Date(d);
  dateToCompare.setHours(12, 0, 0, 0);
  
  const startCompare = new Date(startOfWeek);
  startCompare.setHours(0, 0, 0, 0);
  
  const endCompare = new Date(endOfWeek);
  endCompare.setHours(23, 59, 59, 999);
  
  if (dateToCompare < startCompare || dateToCompare > endCompare) return -1;
  
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

interface GanttVehicle {
  id: string;
  model: string;
  plate: string;
  type?: string;
  blocks: {
    dayIndex: number;
    label: string;
    purpose: string;
    priority: string;
    status: "completed" | "on_going" | "scheduled";
  }[];
}

export default function Schedule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [vehicleType, setVehicleType] = useState("All");
  const [filterOpen,  setFilterOpen]  = useState(false);
  const [weekOffset,  setWeekOffset]  = useState(0);

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

  // Map nama/model kendaraan ke tipe kategorinya
  const vehicleTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    allVehicles.forEach((v: any) => {
      if (v.name) map.set(v.name.toLowerCase().trim(), (v.type || "Sedan").toLowerCase());
      if (v.model) map.set(v.model.toLowerCase().trim(), (v.type || "Sedan").toLowerCase());
    });
    return map;
  }, [allVehicles]);

  // Filter request valid (abaikan rejected / cancelled)
  const validRequests = allRequests.filter((r: any) => {
    const statusLower = (r.rawStatus || r.status || "").toLowerCase();
    return !["rejected", "cancelled", "draft"].includes(statusLower);
  });

  // Calculate Monday based on weekOffset
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const baseMonday = new Date(now);
  baseMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  baseMonday.setDate(baseMonday.getDate() + weekOffset * 7);

  const monday = baseMonday;
  const weekLabel = `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

  const startOfWeek = new Date(monday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(monday);
  endOfWeek.setDate(monday.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Kelompokkan berdasarkan kendaraan (Mendukung Multi-day / Case Spesial)
  const vehicleMap = new Map<string, GanttVehicle>();

  validRequests.forEach((r: any) => {
    if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
      // Case Spesial Multi-Day
      r.itineraries.forEach((it: any, idx: number) => {
        if (it.status === 'cancelled' || it.status === 'rejected') return;

        const vKey = (it.vehicle_name || it.vehicle_model || r.vehicleModel || "Unassigned").replace(/\s*\(\s*\)/g, '').trim();
        if (!vehicleMap.has(vKey)) {
          vehicleMap.set(vKey, {
            id: vKey,
            model: vKey,
            plate: "",
            blocks: [],
          });
        }

        const dayIdx = getDayIndex(it.date, startOfWeek, endOfWeek);
        if (dayIdx >= 0) {
          const dest = it.morning_destination || it.afternoon_destination || r.destination || r.purpose || "";
          
          let itemStatus: "completed" | "on_going" | "scheduled" = "scheduled";
          if (it.status === 'completed' || (it.morning_status === 'completed' && (!it.afternoon_destination || it.afternoon_status === 'completed'))) {
            itemStatus = "completed";
          } else if (it.status === 'on_going' || it.morning_status === 'on_going' || it.afternoon_status === 'on_going') {
            itemStatus = "on_going";
          }

          vehicleMap.get(vKey)!.blocks.push({
            dayIndex: dayIdx,
            label: `${r.employee || "Staff"} (H${idx + 1})`,
            purpose: dest,
            priority: r.priority || "NORMAL",
            status: itemStatus,
          });
        }
      });
    } else {
      // Regular single-day request
      const vKey = (r.vehicleModel || "Unassigned").replace(/\s*\(\s*\)/g, '').trim();
      if (!vehicleMap.has(vKey)) {
        vehicleMap.set(vKey, {
          id: vKey,
          model: vKey,
          plate: "",
          blocks: [],
        });
      }

      const dayIdx = getDayIndex(r.date, startOfWeek, endOfWeek);
      if (dayIdx >= 0) {
        const rawSt = (r.rawStatus || r.status || "").toLowerCase();
        let itemStatus: "completed" | "on_going" | "scheduled" = "scheduled";
        if (rawSt === 'completed') {
          itemStatus = "completed";
        } else if (rawSt === 'on_going' || rawSt === 'ongoing') {
          itemStatus = "on_going";
        }

        vehicleMap.get(vKey)!.blocks.push({
          dayIndex: dayIdx,
          label: r.employee || "Staff",
          purpose: r.destination || r.purpose || "",
          priority: r.priority || "NORMAL",
          status: itemStatus,
        });
      }
    }
  });

  let ganttVehicles = Array.from(vehicleMap.values());
  if (vehicleType !== "All") {
    const targetType = vehicleType.toLowerCase().trim();
    ganttVehicles = ganttVehicles.filter(v => {
      const modelLower = v.model.toLowerCase().trim();
      const mappedType = vehicleTypeMap.get(modelLower) || (v as any).type?.toLowerCase();
      return (mappedType && mappedType.includes(targetType)) || modelLower.includes(targetType);
    });
  }

  // Stat counts
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  let scheduledToday = 0;

  validRequests.forEach((r: any) => {
    if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
      r.itineraries.forEach((it: any) => {
        if (it.date === todayStr && it.status !== 'cancelled' && it.status !== 'rejected') {
          scheduledToday++;
        }
      });
    } else {
      const d = parseToDate(r.date);
      if (d) {
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (dStr === todayStr) scheduledToday++;
      }
    }
  });

  const upcoming7 = validRequests.length;

  const weekDayLabels = WEEK_DAYS.map((short, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { short, day: String(d.getDate()) };
  });

  return (
    <Layout
      activeNav="Vehicle Schedule"
      onNavigate={onNavigate}
      topbarTitle="Vehicle Schedule"
      searchPlaceholder="Search schedules..."
    >
      <div className="p-6 space-y-5 animate-fadein">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[26px] font-bold text-[#0f172a]">Schedule Management</h2>
            <p className="text-[13.5px] text-[#64748b] mt-1 max-w-md leading-relaxed">
              Kelola dan koordinasi jadwal penggunaan kendaraan berdasarkan request yang telah disetujui.
            </p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                <Icon name="calendar_today" className="text-[#1e3a8a] text-[20px]" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Scheduled Today</div>
            <div className="text-[32px] font-bold text-[#0f172a] leading-tight">
              {loading ? "..." : scheduledToday}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                <Icon name="event_note" className="text-[#1e3a8a] text-[20px]" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Active Missions</div>
            <div className="text-[32px] font-bold text-[#0f172a] leading-tight">
              {loading ? "..." : upcoming7}
            </div>
          </div>
        </div>

        {/* ── Gantt Calendar ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-[#0f172a]">Week of {weekLabel}</span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  className="px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Minggu Sebelumnya"
                >
                  <Icon name="chevron_left" className="text-sm" />
                  Prev
                </button>

                <button
                  onClick={() => setWeekOffset(0)}
                  className={`px-2.5 py-1 border rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    weekOffset === 0 ? "bg-[#1e3a8a] text-white border-[#1e3a8a]" : "bg-[#f8fafc] border-[#e2e8f0] text-[#475569] hover:bg-[#f1f5f9]"
                  }`}
                >
                  Minggu Ini
                </button>

                <button
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  className="px-2 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-xs font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors flex items-center gap-0.5 cursor-pointer"
                  title="Minggu Berikutnya"
                >
                  Next
                  <Icon name="chevron_right" className="text-sm" />
                </button>
              </div>
            </div>

            <div className="flex-1" />

            {/* Vehicle type filter */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-bold text-[#1e3a8a] hover:bg-[#f1f5f9] transition-colors cursor-pointer shadow-2xs"
              >
                <Icon name="filter_alt" className="text-[15px] text-[#1e3a8a]" />
                Kategori: {vehicleType}
                <Icon name="keyboard_arrow_down" className="text-[16px]" />
              </button>
              {filterOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-[#e2e8f0] shadow-xl z-30 py-1 min-w-[160px]">
                  {["All", "Sedan", "MPV", "SUV", "Van", "Blind Van", "Truck", "Pick-up", "Bus", "Electric"].map(t => (
                    <button key={t} onClick={() => { setVehicleType(t); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[12px] font-bold hover:bg-[#f1f5f9] transition-colors ${vehicleType === t ? "text-[#1e3a8a] bg-blue-50/50" : "text-[#475569]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => refetch()} className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors" title="Refresh">
              <Icon name="refresh" className="text-[#64748b] text-[18px]" />
            </button>
          </div>

          {/* Loading / Error */}
          {loading && (
            <div className="px-5 py-4 text-[13px] text-[#475569] flex items-center gap-2">
              <Icon name="hourglass_top" className="text-[18px] text-[#1e3a8a]" />
              Memuat jadwal...
            </div>
          )}
          {error && (
            <div className="px-5 py-4 text-[13px] text-[#b91c1c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="error" className="text-red-600 text-[18px]" />
                Gagal memuat jadwal.
              </div>
              <button onClick={() => refetch()} className="ml-4 px-3 py-1.5 bg-[#1e3a8a] text-white rounded-lg text-[12px]">Coba Lagi</button>
            </div>
          )}

          {/* Gantt table */}
          {!loading && !error && (
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="flex border-b border-[#f1f5f9] bg-[#f8fafc]">
                <div className="w-[200px] flex-shrink-0 px-4 py-2.5 border-r border-[#f1f5f9]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Kendaraan</span>
                </div>
                <div className="flex" style={{ minWidth: 7 * COL_W }}>
                  {weekDayLabels.map((d, i) => (
                    <div key={i} className="flex items-center justify-center border-r border-[#f1f5f9] py-2.5" style={{ width: COL_W }}>
                      <span className="text-[12px] font-bold">{d.short} {d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {ganttVehicles.length === 0 && (
                <div className="px-5 py-10 text-center text-[14px] text-[#94a3b8]">
                  <Icon name="event_busy" className="text-[48px] mb-3 block mx-auto text-[#e2e8f0]" />
                  Tidak ada jadwal aktif minggu ini.
                </div>
              )}

              {ganttVehicles.map(v => (
                <div key={v.id} className="flex border-b border-[#f1f5f9] hover:bg-[#fafbff] transition-colors">
                  {/* Vehicle label */}
                  <div className="w-[200px] flex-shrink-0 flex items-center gap-3 px-4 py-3 border-r border-[#f1f5f9]">
                    <div className="w-8 h-8 rounded-lg bg-[#e8edf8] flex items-center justify-center flex-shrink-0">
                      <Icon name="directions_car" className="text-[#1e3a8a] text-[18px]" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold leading-tight text-[#0f172a] truncate max-w-[130px]">{v.model}</div>
                    </div>
                  </div>

                  {/* Gantt cells */}
                  <div className="relative overflow-hidden flex-shrink-0" style={{ height: 64, width: 7 * COL_W }}>
                    {/* Day column lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {weekDayLabels.map((_, i) => (
                        <div key={i} className="border-r border-[#f1f5f9]" style={{ width: COL_W, flexShrink: 0 }} />
                      ))}
                    </div>

                    {/* Blocks */}
                    {v.blocks.filter(b => b.dayIndex >= 0).map((block, bi) => (
                      <div
                        key={bi}
                        className={`absolute top-1.5 rounded-xl flex flex-col justify-center overflow-hidden shadow-xs transition-all hover:scale-[1.02] hover:z-20 border border-white/20 ${getBlockStyle(block.priority)}`}
                        style={{ left: block.dayIndex * COL_W + 4, width: COL_W - 8, height: 52 }}
                      >
                        <div className="px-2.5 py-1 flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-extrabold truncate leading-tight">{block.label}</span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.2 rounded-full uppercase shrink-0 ${
                              block.status === 'completed' ? 'bg-emerald-500 text-white' :
                              block.status === 'on_going' ? 'bg-amber-400 text-amber-950 font-black animate-pulse' :
                              'bg-white/25 text-white'
                            }`}>
                              {block.status === 'completed' ? '✓ Done' : block.status === 'on_going' ? '⚡ Active' : 'Scheduled'}
                            </span>
                          </div>
                          <span className="text-[9px] font-medium opacity-90 truncate leading-tight mt-0.5">{block.purpose}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="px-5 py-3.5 border-t border-[#f1f5f9] bg-[#fafbfc] flex items-center justify-between flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tingkat Prioritas:</span>
              {[
                { color: "bg-[#1e3a8a]", label: "Normal Priority" },
                { color: "bg-[#f97316]", label: "Urgent Priority" },
                { color: "bg-[#ef4444]", label: "Critical Priority" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                  <span className="font-semibold text-[#64748b]">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Perjalanan:</span>
              {[
                { color: "bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8.5px]", label: "✓ Done (Selesai)" },
                { color: "bg-amber-400 text-amber-950 font-black px-1.5 py-0.5 rounded-full text-[8.5px]", label: "⚡ Active (Berjalan)" },
                { color: "bg-slate-400 text-white font-medium px-1.5 py-0.5 rounded-full text-[8.5px]", label: "Scheduled (Terjadwal)" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className={item.color}>{item.label.split(' ')[0]}</span>
                  <span className="font-semibold text-[#64748b]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
