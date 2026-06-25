import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";

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

function getDayIndex(dateStr: string) {
  if (!dateStr) return -1;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return -1;
  // 0=Sun,1=Mon,...,6=Sat → map to Mon(0)..Sun(6)
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

interface GanttVehicle {
  id: string;
  model: string;
  plate: string;
  blocks: { dayIndex: number; label: string; purpose: string; priority: string }[];
}

export default function Schedule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [vehicleType, setVehicleType] = useState("All");
  const [filterOpen,  setFilterOpen]  = useState(false);

  // Ambil semua request yang sudah APPROVED/ONGOING dari backend
  const { data: requests, loading, error, refetch } = useApi(() => requestService.getAll({ per_page: 1000 }));

  const allRequests = requests || [];

  // Hanya tampilkan request APPROVED dan ONGOING
  const activeRequests = allRequests.filter(r =>
    r.status === "APPROVED" || r.status === "ONGOING"
  );

  // Kelompokkan berdasarkan kendaraan
  const vehicleMap = new Map<string, GanttVehicle>();
  activeRequests.forEach(r => {
    const vKey = r.vehicleModel || "Unassigned";
    if (!vehicleMap.has(vKey)) {
      vehicleMap.set(vKey, {
        id: vKey,
        model: r.vehicleModel || "Unassigned",
        plate: "",
        blocks: [],
      });
    }
    vehicleMap.get(vKey)!.blocks.push({
      dayIndex: getDayIndex(r.date),
      label: r.id,
      purpose: r.destination || r.employee || "",
      priority: r.priority || "NORMAL",
    });
  });

  const ganttVehicles = Array.from(vehicleMap.values());

  // Stat counts
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const scheduledToday = activeRequests.filter(r => (r.date || "").startsWith(todayStr)).length;
  const upcoming7 = activeRequests.length;

  // Get today's week start (Monday) for header
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekLabel = `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`;

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
            <span className="text-[15px] font-bold text-[#0f172a]">Week of {weekLabel}</span>

            <div className="flex-1" />

            {/* Vehicle type filter */}
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] hover:bg-[#f1f5f9] transition-colors"
              >
                Kendaraan: {vehicleType}
                <Icon name="keyboard_arrow_down" className="text-[16px]" />
              </button>
              {filterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-[#e2e8f0] shadow-xl z-30 py-1 min-w-[140px]">
                  {["All", "Sedan", "SUV", "Van", "Truck"].map(t => (
                    <button key={t} onClick={() => { setVehicleType(t); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[12px] font-semibold hover:bg-[#f1f5f9] transition-colors ${vehicleType === t ? "text-[#1e3a8a]" : "text-[#475569]"}`}>
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
                      <div className="text-[13px] font-bold leading-tight text-[#0f172a] truncate max-w-[120px]">{v.model}</div>
                    </div>
                  </div>

                  {/* Gantt cells */}
                  <div className="relative overflow-hidden flex-shrink-0" style={{ height: 60, width: 7 * COL_W }}>
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
                        className={`absolute top-2 rounded-lg flex items-center overflow-hidden shadow-sm ${getBlockStyle(block.priority)}`}
                        style={{ left: block.dayIndex * COL_W + 4, width: COL_W - 8, height: 44 }}
                      >
                        <div className="flex-1 min-w-0 px-2.5 py-1">
                          <span className="text-[11px] font-bold truncate block">{block.label}</span>
                          <span className="text-[9px] font-semibold tracking-wider opacity-75 uppercase truncate block">{block.purpose}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="px-5 py-3 border-t border-[#f1f5f9] bg-[#fafbfc] flex items-center gap-5 flex-wrap">
            {[
              { color: "bg-[#1e3a8a]", label: "Normal Schedule" },
              { color: "bg-[#f97316]", label: "Urgent Schedule" },
              { color: "bg-[#ef4444]", label: "Critical Schedule" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                <span className="text-[12px] font-semibold text-[#64748b]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
