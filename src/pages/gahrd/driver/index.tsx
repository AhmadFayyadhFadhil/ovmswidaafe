import { useState, useEffect } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useAuthContext } from "@/auth/authContext";
import { driverService } from "@/services/modules/driverService";

export type DriverStatus = "AVAILABLE" | "ON TRIP" | "OFF DUTY";
export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  avatar?: string;
  driverId: string;
  trips?: number;
  rating?: number;
}

export const DRIVERS: Driver[] = [
  { id: "1", name: "John Doe", status: "AVAILABLE", driverId: "DRV-001", trips: 15, rating: 4.8 },
  { id: "2", name: "Jane Smith", status: "ON TRIP", driverId: "DRV-002", trips: 22, rating: 4.9 },
];

type TabFilter = "All" | "Available" | "On Trip" | "Off Duty";

const STATUS_CONFIG: Record<DriverStatus, { label: string; badge: string; dot: string; border: string }> = {
  AVAILABLE: {
    label: "AVAILABLE",
    badge: "bg-[#dcfce7] text-[#15803d] border border-[#bbf7d0]",
    dot: "bg-green-500",
    border: "border-l-[3px] border-l-green-500",
  },
  "ON TRIP": {
    label: "ON TRIP",
    badge: "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]",
    dot: "bg-blue-500",
    border: "border-l-[3px] border-l-blue-500",
  },
  "OFF DUTY": {
    label: "OFF DUTY",
    badge: "bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]",
    dot: "bg-slate-300",
    border: "border-l-[3px] border-l-slate-300",
  },
};

function DriverCard({ driver }: { driver: Driver }) {
  const cfg = STATUS_CONFIG[driver.status];
  const canAssign = driver.status === "AVAILABLE";
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden ${cfg.border} hover:shadow-sm transition-all`}>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#e2e8f0]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=1e3a8a&color=fff`;
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#f1f5f9] border-2 border-[#e2e8f0] flex items-center justify-center">
                <Icon name="person" className="text-[28px] text-[#94a3b8]" />
              </div>
            )}
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 ${cfg.dot} border-2 border-white rounded-full`} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#0f172a]">{driver.name}</div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            <div className="text-[12px] text-[#64748b] mt-0.5">ID: {driver.driverId}</div>
            {driver.trips !== undefined && (
              <div className="text-[11px] text-[#94a3b8] mt-0.5">
                {driver.trips} trips · ⭐ {driver.rating}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            disabled={!canAssign}
            className={`h-9 px-5 text-[12px] font-bold rounded-xl transition-all ${canAssign ? "bg-[#1e3a8a] text-white hover:bg-[#1e40af] active:scale-95" : "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"}`}
          >
            Assign Driver
          </button>
          <button className="h-9 px-5 bg-white border border-[#e2e8f0] text-[#334155] text-[12px] font-bold rounded-xl hover:bg-[#f8fafc] active:scale-95 transition-all">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DriverPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await driverService.getAll({ per_page: 1000 });
        const mapped = (res.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          status: d.status === "AVAILABLE" ? "AVAILABLE" : (d.status === "ON DUTY" ? "ON TRIP" : "OFF DUTY"),
          avatar: d.avatarUrl,
          driverId: `DRV-${String(d.id).padStart(3, "0")}`,
          trips: 0,
          rating: 5.0,
        } as Driver));
        setDriversList(mapped);
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data pengemudi dari database.");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const filtered = driversList.filter((d) => {
    const matchTab =
      tab === "All" ||
      (tab === "Available" && d.status === "AVAILABLE") ||
      (tab === "On Trip" && d.status === "ON TRIP") ||
      (tab === "Off Duty" && d.status === "OFF DUTY");
    const q = search.toLowerCase();
    const matchQ = d.name.toLowerCase().includes(q) || d.driverId.toLowerCase().includes(q);
    return matchTab && matchQ;
  });

  const total = driversList.length;
  const available = driversList.filter((d) => d.status === "AVAILABLE").length;
  const onTrip = driversList.filter((d) => d.status === "ON TRIP").length;
  const offDuty = driversList.filter((d) => d.status === "OFF DUTY").length;

  const isApprover = user?.role === "approver";

  return (
    <Layout
      activeNav="Driver Availability"
      onNavigate={onNavigate}
      topbarTitle="Driver Availability"
      userRole={isApprover ? "Manager Approver" : "GA/HRD"}
      searchPlaceholder="Search drivers..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">

        <div className="text-[18px] font-bold text-[#0f172a] mb-1">Driver Availability Center</div>
        <div className="text-[13px] text-[#64748b] mb-7 max-w-2xl">
          Monitor driver readiness, operational schedules, and transportation workload across activities.
        </div>

        {loading ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-[#64748b] font-medium">Memuat data pengemudi...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
            <Icon name="error" className="text-[20px]" />
            {error}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Total Drivers</div>
                  <Icon name="group" className="text-[20px] text-[#64748b]" />
                </div>
                <div className="text-[36px] font-extrabold text-[#0f172a] leading-none">{total}</div>
              </div>
              <div className="bg-white border-l-[3px] border-l-green-500 border border-[#e2e8f0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Available</div>
                  <Icon name="check_circle" className="text-[20px] text-green-500" />
                </div>
                <div className="text-[36px] font-extrabold text-[#0f172a] leading-none">{available}</div>
              </div>
              <div className="bg-white border-l-[3px] border-l-blue-500 border border-[#e2e8f0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">On Trip</div>
                  <Icon name="route" className="text-[20px] text-blue-500" />
                </div>
                <div className="text-[36px] font-extrabold text-[#0f172a] leading-none">{onTrip}</div>
              </div>
              <div className="bg-white border-l-[3px] border-l-red-400 border border-[#e2e8f0] rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-widest">Off Duty</div>
                  <Icon name="do_not_disturb_on" className="text-[20px] text-red-400" />
                </div>
                <div className="text-[36px] font-extrabold text-[#0f172a] leading-none">{offDuty}</div>
                <div className="text-[11px] text-[#94a3b8] mt-1">Medical leave / Maintenance</div>
              </div>
            </div>

            {/* Tab filter */}
            <div className="overflow-x-auto max-w-full mb-6">
              <div className="flex gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 w-fit">
                {(["All", "Available", "On Trip", "Off Duty"] as TabFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 h-9 rounded-lg text-[13px] font-semibold transition-all ${tab === t ? "bg-[#1e3a8a] text-white shadow-sm" : "text-[#64748b] hover:text-[#334155]"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Driver list */}
            <div className="flex flex-col gap-3 max-w-3xl">
              {filtered.length === 0 ? (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
                  <Icon name="person_off" className="text-[40px] text-[#cbd5e1] mb-2" />
                  <p className="font-bold text-[#0f172a]">No drivers found</p>
                  <p className="text-[13px] text-[#64748b] mt-1">Try changing the filter or search term.</p>
                </div>
              ) : (
                filtered.map((d) => <DriverCard key={d.id} driver={d} />)
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}