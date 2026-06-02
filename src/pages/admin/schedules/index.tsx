import { useState, useMemo } from "react";
import { Layout, Icon } from "../../../components/layout/RoleLayout.tsx";
import { useApi } from "../../../hooks/useApi.ts";
import { scheduleService } from "../../../services/modules/scheduleService.ts";

// ── Gantt data ──
const WEEK_DAYS = [
  { short: "Mon", day: "12" },
  { short: "Tue", day: "13" },
  { short: "Wed", day: "14" },
  { short: "Thu", day: "15" },
  { short: "Fri", day: "16" },
  { short: "Sat", day: "17" },
  { short: "Sun", day: "18" },
];

type BlockType = "normal" | "urgent" | "critical" | string;
interface GanttBlock { start: number; span: number; type: BlockType; label: string; sub: string; requestorName?: string; purpose?: string; approved?: boolean; icon?: string; hasMenu?: boolean; conflict?: boolean }
interface Vehicle    { id: string; type: string; model: string; blocks: GanttBlock[] }

const VEHICLES: Vehicle[] = [
  {
    id: "V-8829", type: "Sedan", model: "T. Camry",
    blocks: [
      { start: 0, span: 1, type: "normal",  label: "#REQ-294", sub: "REGIONAL HQ TRANSFER", requestorName: "John D.", purpose: "Transfer to regional HQ", approved: true, hasMenu: true },
      { start: 1, span: 2, type: "normal",  label: "#REQ-301", sub: "CLIENT SITE B...",     requestorName: "Samantha A.", purpose: "Client visit", approved: true, hasMenu: true },
    ],
  },
  {
    id: "V-1104", type: "SUV", model: "F. Explorer",
    blocks: [
      { start: 1, span: 2, type: "normal", label: "#REQ-028", sub: "Training", requestorName: "Training Dept", purpose: "On-site training", approved: true },
    ],
  },
  {
    id: "V-9011", type: "Sedan", model: "T. Camry",
    blocks: [
      { start: 0, span: 1, type: "critical", label: "#REQ-294", sub: "REGIONAL HQ TRANSFER", requestorName: "John D.", purpose: "Emergency transfer", approved: true, hasMenu: true, conflict: true },
      { start: 1, span: 2, type: "urgent",  label: "#REQ-301", sub: "CLIENT SITE B...",     requestorName: "Samantha A.", purpose: "Client visit", approved: true, hasMenu: true },
    ],
  },
  {
    id: "V-2391", type: "Sedan", model: "H. Accord",
    blocks: [
      { start: 3, span: 1, type: "conflict", label: "CONFLICT", sub: "REQ-315" },
    ],
  },
];

const BLOCK_STYLES: Record<string, string> = {
  normal:   "bg-[#1e3a8a] text-white",
  urgent:   "bg-[#f97316] text-white",
  critical: "bg-[#ef4444] text-white",
};

// ── Gantt Row ──
function GanttRow({ vehicle }: { vehicle: Vehicle }) {
  const isConflict = false;
  const COL_W = 130; // px per day column

  return (
    <div className="flex border-b border-[#f1f5f9] hover:bg-[#fafbff] transition-colors group">
      {/* Vehicle label */}
      <div className="w-[200px] flex-shrink-0 flex items-center gap-3 px-4 py-3 border-r border-[#f1f5f9]">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isConflict ? "bg-red-100" : "bg-[#e8edf8]"}`}>
          <Icon name="directions_car" className={`text-[18px] ${isConflict ? "text-[#dc2626]" : "text-[#1e3a8a]"}`} />
        </div>
        <div>
          <div className={`text-[13px] font-bold leading-tight ${isConflict ? "text-[#dc2626]" : "text-[#0f172a]"}`}>
            {vehicle.id} ({vehicle.type})
          </div>
          <div className="text-[11px] text-[#94a3b8]">{vehicle.model}</div>
        </div>
      </div>

      {/* Gantt cells */}
      <div className="flex-1 relative overflow-hidden" style={{ height: 60 }}>
        {/* Day column lines */}
        <div className="absolute inset-0 flex pointer-events-none">
          {WEEK_DAYS.map((_, i) => (
            <div key={i} className="border-r border-[#f1f5f9]" style={{ width: COL_W, flexShrink: 0 }} />
          ))}
        </div>

        {/* Blocks (only approved requests, exclude service/conflict) */}
        {vehicle.blocks.filter(b => (b.type === "normal" || b.type === "urgent" || b.type === "critical") && b.approved === true).map((block, bi) => (
          <div
            key={bi}
            className={`absolute top-2 rounded-lg flex items-center overflow-hidden shadow-sm ${BLOCK_STYLES[block.type]}`}
            style={{
              left: block.start * COL_W + 4,
              width: block.span * COL_W - 8,
              height: 44,
            }}
          >
            <div className="flex-1 min-w-0 px-2.5 py-1">
              <div className="flex items-center gap-1">
                {block.icon && <Icon name={block.icon} className="text-[13px] text-white/80" />}
                <span className="text-[11px] font-bold truncate">{block.requestorName || block.label}</span>
              </div>
              {(block.purpose || block.sub) && (
                <span className="text-[9px] font-semibold tracking-wider opacity-75 uppercase truncate block">{block.purpose || block.sub}</span>
              )}
            </div>
            {block.hasMenu && (
              <button className="px-1.5 opacity-70 hover:opacity-100 flex-shrink-0">
                <Icon name="more_vert" className="text-[16px] text-white" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Schedule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month">("Day");
  const [filterOpen, setFilterOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState("All");

  // fetch schedule items from backend (preferred integration) and merge into vehicle schedule
  const { data: scheduleItems, loading: reqLoading, error: reqError, refetch: refetchRequests } = useApi(async () => {
    const res = await scheduleService.getAll();
    return { data: res.data };
  }, true, []);

  const mergedVehicles = useMemo(() => {
    // start from a deep-ish copy of VEHICLES to avoid mutating the constant
    const base = VEHICLES.map(v => ({ ...v, blocks: [...v.blocks] }));

    if (!scheduleItems) return base;

    // scheduleItems expected shape: ScheduleItem { id, vehicleId?, vehicleLabel?, type, title, driverName, startTime, endTime, dateLabel }
    scheduleItems.forEach((it: any) => {
      // dateLabel may be like "Mon 12" or "12"; try to find by day number first, then by weekday
      const dateLabel = String(it.dateLabel || "").trim();
      let start = 0;
      if (dateLabel) {
        const parts = dateLabel.split(" ");
        const maybeDay = parts[parts.length - 1];
        const idxByDay = WEEK_DAYS.findIndex(w => w.day === maybeDay);
        if (idxByDay >= 0) start = idxByDay;
        else {
          const idxByShort = WEEK_DAYS.findIndex(w => w.short.toLowerCase() === (parts[0] || "").toLowerCase());
          if (idxByShort >= 0) start = idxByShort;
        }
      }

      const span = 1;
      const type = (it.type && it.type.toLowerCase().includes("regular")) ? "normal" : "normal";
      const block = {
        start,
        span,
        type,
        label: it.id || it.title || `SCH-${Math.floor(Math.random()*1000)}`,
        sub: it.driverName || it.vehicleLabel || "",
        requestorName: it.title || it.driverName,
        purpose: it.title || it.driverName,
        approved: true,
        hasMenu: false,
      } as GanttBlock;

      // attach by vehicleId first, then vehicleLabel, else UNASSIGNED
      let attached = false;
      if (it.vehicleId) {
        const idx = base.findIndex(v => v.id === it.vehicleId);
        if (idx >= 0) { base[idx].blocks.push(block); attached = true; }
      }
      if (!attached && it.vehicleLabel) {
        const idx = base.findIndex(v => v.model && String(it.vehicleLabel).toLowerCase().includes(v.model.toLowerCase()));
        if (idx >= 0) { base[idx].blocks.push(block); attached = true; }
      }
      if (!attached) {
        let un = base.find(v => v.id === "UNASSIGNED");
        if (!un) { un = { id: "UNASSIGNED", type: "Unassigned", model: "Unassigned", blocks: [] }; base.push(un); }
        un.blocks.push(block);
      }
    });

    return base;
  }, [scheduleItems]);

  const filteredVehicles = vehicleType === "All"
    ? mergedVehicles
    : mergedVehicles.filter(v => v.type.toLowerCase() === vehicleType.toLowerCase());

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
              Manage and coordinate vehicle deployments, service schedules, and operational assignments across the entire fleet.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[13px] font-bold shadow-sm transition-colors">
              <Icon name="add" className="text-[18px]" />
              New Schedule
            </button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-3">
          {/* Scheduled Today */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                <Icon name="calendar_today" className="text-[#1e3a8a] text-[20px]" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Scheduled Today</div>
            <div className="text-[32px] font-bold text-[#0f172a] leading-tight">24</div>
          </div>

          {/* Upcoming 7 Days */}
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-[#e8edf8] rounded-xl flex items-center justify-center">
                <Icon name="event_note" className="text-[#1e3a8a] text-[20px]" />
              </div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8] mb-1">Upcoming (7 Days)</div>
            <div className="text-[32px] font-bold text-[#0f172a] leading-tight">142</div>
          </div>
        </div>

        {/* ── Gantt Calendar ── */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] flex items-center gap-3 flex-wrap">
            {/* View mode */}
            <div className="flex bg-[#f1f5f9] rounded-xl p-1">
              {(["Day", "Week", "Month"] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${
                    viewMode === m ? "bg-white shadow-sm text-[#1e3a8a]" : "text-[#94a3b8] hover:text-[#475569]"
                  }`}>{m}</button>
              ))}
            </div>

            {/* Nav */}
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
                <Icon name="chevron_left" className="text-[#475569] text-[18px]" />
              </button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[12px] font-bold text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Today
              </button>
              <button className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
                <Icon name="chevron_right" className="text-[#475569] text-[18px]" />
              </button>
            </div>
            <span className="text-[15px] font-bold text-[#0f172a]">October 12 – 18, 2023</span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Vehicle type filter */}
            <div className="relative">
              <button onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-[12px] font-semibold text-[#475569] hover:bg-[#f1f5f9] transition-colors">
                Vehicle Type: {vehicleType}
                <Icon name="keyboard_arrow_down" className="text-[16px]" />
              </button>
              {filterOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl border border-[#e2e8f0] shadow-xl z-30 py-1 min-w-[140px]">
                  {["All", "Sedan", "SUV", "Van"].map(t => (
                    <button key={t} onClick={() => { setVehicleType(t); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-[12px] font-semibold hover:bg-[#f1f5f9] transition-colors ${vehicleType === t ? "text-[#1e3a8a]" : "text-[#475569]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button className="w-8 h-8 rounded-lg border border-[#e2e8f0] flex items-center justify-center hover:bg-[#f1f5f9] transition-colors">
              <Icon name="tune" className="text-[#64748b] text-[18px]" />
            </button>
          </div>

          {/* Gantt table */}
          {reqLoading && (
            <div className="px-5 py-3 text-[13px] text-[#475569] flex items-center gap-2">
              <Icon name="hourglass_top" className="text-[18px] text-[#1e3a8a]" />
              Loading approved requests...
            </div>
          )}
          {reqError && (
            <div className="px-5 py-3 text-[13px] text-[#b91c1c] flex items-center justify-between">
              <div className="flex items-center gap-2"><Icon name="error" className="text-red-600 text-[18px]" />Failed loading requests. Please try again.</div>
              <button onClick={() => refetchRequests()} className="ml-4 px-3 py-1.5 bg-[#1e3a8a] text-white rounded-lg">Retry</button>
            </div>
          )}

          <div className="overflow-x-auto">
            {/* Header */}
            <div className="flex border-b border-[#f1f5f9] bg-[#f8fafc]">
              <div className="w-[200px] flex-shrink-0 px-4 py-2.5 border-r border-[#f1f5f9]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8]">Vehicle Entity</span>
              </div>
              <div className="flex" style={{ minWidth: 7 * 130 }}>
                {WEEK_DAYS.map((d, i) => (
                  <div key={i} className="flex items-center justify-center border-r border-[#f1f5f9] py-2.5" style={{ width: 130 }}>
                    <span className="text-[12px] font-bold">
                      {d.short} {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rows */}
            {filteredVehicles.map(v => (
              <GanttRow key={v.id} vehicle={v} />
            ))}
          </div>

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
