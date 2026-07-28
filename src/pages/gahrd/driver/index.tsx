import { useState, useEffect, useMemo } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useAuthContext } from "@/auth/authContext";
import { driverService } from "@/services/modules/driverService";
import { requestService } from "@/services/modules/requestService";

export type DriverStatus = "AVAILABLE" | "ON TRIP" | "OFF DUTY";
export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  avatar?: string;
  driverId: string;
  trips?: number;
  rating?: number;
  email?: string;
  phone?: string;
  location?: string;
  licenseType?: string;
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

const isDriverForReq = (r: any, driverId: string, driverName: string) => {
  if (!r || !driverId) return false;
  const reqDriverId = String(r.driver_id || r.driver?.id || r.operationalTrip?.driver_id || r.operationalTrip?.driver?.id || r.assignment?.driver_id || "");
  const reqDriverName = String(r.driver_name || r.driver?.name || "").toLowerCase();
  const targetName = String(driverName || "").toLowerCase();
  return (reqDriverId !== "" && reqDriverId === String(driverId)) || (reqDriverName !== "" && targetName !== "" && reqDriverName.includes(targetName));
};

function DriverCard({ 
  driver, 
  onToggleDuty,
  onViewReviews,
}: { 
  driver: Driver; 
  onToggleDuty: (id: string, name: string, status: DriverStatus) => void;
  onViewReviews: (driver: Driver) => void;
}) {
  const cfg = STATUS_CONFIG[driver.status];
  const isAvailable = driver.status === "AVAILABLE";
  const isOffDuty = driver.status === "OFF DUTY";
  const canToggle = isAvailable || isOffDuty;
  
  return (
    <div className={`bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden ${cfg.border} hover:shadow-md hover:border-slate-300 transition-all duration-200`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            {driver.avatar ? (
              <img
                src={driver.avatar}
                alt={driver.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#e2e8f0] shadow-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(driver.name)}&background=1e3a8a&color=fff`;
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#f8fafc] border-2 border-[#e2e8f0] flex items-center justify-center shadow-xs">
                <Icon name="person" className="text-[28px] text-[#94a3b8]" />
              </div>
            )}
            <span className={`absolute bottom-0.5 right-0.5 w-3.5 h-3.5 ${cfg.dot} border-2 border-white rounded-full`} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-bold text-[#0f172a]">{driver.name}</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
            </div>
            
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider flex-wrap">
              <span>ID: {driver.driverId}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <span>⭐</span> {driver.rating ? Number(driver.rating).toFixed(1) : "5.0"}
              </span>
              <span>•</span>
              <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded-md">{driver.trips || 0} Trips</span>
              {driver.licenseType && (
                <>
                  <span>•</span>
                  <span className={driver.licenseType === "SIM A Aktif" ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                    {driver.licenseType}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5 text-[12px] text-[#64748b] pt-1">
              {driver.phone && (
                <span className="flex items-center gap-1">
                  <Icon name="phone" className="text-[14px] text-slate-400" />
                  {driver.phone}
                </span>
              )}
              {driver.email && (
                <span className="flex items-center gap-1">
                  <Icon name="mail" className="text-[14px] text-slate-400" />
                  {driver.email}
                </span>
              )}
              {driver.location && (
                <span className="flex items-center gap-1">
                  <Icon name="location_on" className="text-[14px] text-slate-400" />
                  {driver.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
          <button
            onClick={() => onViewReviews(driver)}
            className="w-full sm:w-auto h-9 px-4 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[12px] font-bold rounded-xl active:scale-95 transition-all flex items-center justify-center shadow-xs cursor-pointer"
          >
            Detail Ulasan
          </button>
          {canToggle && (
            <button
              onClick={() => onToggleDuty(driver.id, driver.name, driver.status)}
              className={`w-full sm:w-auto h-9 px-5 text-[12px] font-bold rounded-xl transition-all cursor-pointer shadow-xs ${
                isAvailable 
                  ? "bg-rose-600 text-white hover:bg-rose-700 active:scale-95" 
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
              }`}
            >
              {isAvailable ? "Set Off Duty" : "Set Available"}
            </button>
          )}
          {driver.phone && (
            <a 
              href={`https://wa.me/${driver.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto h-9 px-4 bg-[#25D366] text-white text-[12px] font-bold rounded-xl hover:bg-[#20bd5a] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Icon name="chat" className="text-[14px]" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DriverPage({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { user } = useAuthContext();
  const [activeSection, setActiveSection] = useState<"status" | "performance">("status");
  const [tab, setTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [driversList, setDriversList] = useState<Driver[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    driverId: string | null;
    driverName: string;
    currentStatus: DriverStatus | null;
  }>({
    isOpen: false,
    driverId: null,
    driverName: "",
    currentStatus: null,
  });

  const [reviewsModal, setReviewsModal] = useState<{
    isOpen: boolean;
    driver: Driver | null;
    reviews: any[];
    loading: boolean;
  }>({
    isOpen: false,
    driver: null,
    reviews: [],
    loading: false,
  });

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [driversRes, reqsRes] = await Promise.all([
          driverService.getAll({ per_page: 1000 }),
          requestService.getAll({ per_page: 1000 }).catch(() => ({ data: [] })),
        ]);
        
        const reqs = reqsRes.data || [];
        setAllRequests(reqs);

        const mapped = (driversRes.data || []).map((d: any) => {
          const driverRatedReqs = reqs.filter((r: any) => 
            isDriverForReq(r, d.id, d.name) && (r.rating && Number(r.rating) > 0)
          );

          const driverCompletedReqs = reqs.filter((r: any) => 
            isDriverForReq(r, d.id, d.name) && 
            (r.rawStatus === "completed" || r.status === "completed" || r.status === "COMPLETED")
          );

          const ratingSum = driverRatedReqs.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
          const computedRating = driverRatedReqs.length > 0 ? Number((ratingSum / driverRatedReqs.length).toFixed(1)) : Number(d.rating || 5.0);

          const computedTrips = d.trips_count || driverCompletedReqs.length || driverRatedReqs.length || 0;

          return {
            id: d.id,
            name: d.name,
            status: d.status === "AVAILABLE" ? "AVAILABLE" : (d.status === "ON TRIP" || d.status === "ON DUTY" || d.status === "ASSIGNED" ? "ON TRIP" : "OFF DUTY"),
            avatar: d.avatarUrl || d.avatar,
            driverId: `DRV-${String(d.id).padStart(3, "0")}`,
            trips: computedTrips,
            rating: computedRating,
            email: d.email || "",
            phone: d.phone || "",
            location: d.location || "Pandaan Head Office",
            licenseType: d.sim_a_photo ? "SIM A Aktif" : "No SIM A",
          } as Driver;
        });
        setDriversList(mapped);
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data pengemudi dari database.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleOpenReviews = (driver: Driver) => {
    setReviewsModal({ isOpen: true, driver, reviews: [], loading: true });
    const driverReviews = allRequests.filter((r: any) => 
      isDriverForReq(r, driver.id, driver.name) &&
      (r.rating && Number(r.rating) > 0)
    );
    setReviewsModal({ isOpen: true, driver, reviews: driverReviews, loading: false });
  };

  const handleToggleClick = (driverId: string, driverName: string, currentStatus: DriverStatus) => {
    setValidationError(null);
    setConfirmModal({
      isOpen: true,
      driverId,
      driverName,
      currentStatus,
    });
  };

  const handleConfirmToggle = async () => {
    if (!confirmModal.driverId || !confirmModal.currentStatus) return;
    const { driverId, currentStatus } = confirmModal;
    const nextStatus = currentStatus === "AVAILABLE" ? "unavailable" : "available";
    setActionLoading(true);

    try {
      if (nextStatus === "unavailable") {
        await driverService.setUnavailable(driverId);
      } else {
        await driverService.setAvailable(driverId);
      }

      setDriversList(prev => prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            status: nextStatus === "available" ? "AVAILABLE" : "OFF DUTY"
          };
        }
        return d;
      }));

      setConfirmModal({ isOpen: false, driverId: null, driverName: "", currentStatus: null });
    } catch (err: any) {
      console.error(err);
      const apiMsg = err.response?.data?.message || err.message;
      setValidationError(apiMsg || "Gagal memperbarui status pengemudi di server.");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return driversList.filter((d) => {
      const matchesTab =
        tab === "All"
          ? true
          : tab === "Available"
          ? d.status === "AVAILABLE"
          : tab === "On Trip"
          ? d.status === "ON TRIP"
          : d.status === "OFF DUTY";

      const matchesSearch =
        search === "" ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.driverId.toLowerCase().includes(search.toLowerCase()) ||
        (d.email && d.email.toLowerCase().includes(search.toLowerCase())) ||
        (d.phone && d.phone.includes(search));

      return matchesTab && matchesSearch;
    });
  }, [driversList, tab, search]);

  // Overall Fleet Statistics & Top Rated Driver
  const total = driversList.length;
  const available = driversList.filter((d) => d.status === "AVAILABLE").length;
  const onTrip = driversList.filter((d) => d.status === "ON TRIP").length;
  const offDuty = driversList.filter((d) => d.status === "OFF DUTY").length;

  const topDriver = useMemo(() => {
    if (driversList.length === 0) return null;
    return [...driversList].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  }, [driversList]);

  const fleetAvgRating = useMemo(() => {
    const ratedReqs = allRequests.filter(r => r.rating && Number(r.rating) > 0);
    if (ratedReqs.length === 0) {
      if (driversList.length === 0) return "5.0";
      const sum = driversList.reduce((acc, d) => acc + (d.rating || 5.0), 0);
      return (sum / driversList.length).toFixed(1);
    }
    const sum = ratedReqs.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
    return (sum / ratedReqs.length).toFixed(1);
  }, [allRequests, driversList]);

  const totalReviewsCount = useMemo(() => {
    return allRequests.filter(r => r.rating && Number(r.rating) > 0).length;
  }, [allRequests]);

  const totalCompletedTrips = useMemo(() => {
    const completedReqs = allRequests.filter((r: any) => 
      r.rawStatus === "completed" || r.status === "completed" || r.status === "COMPLETED"
    );
    const sumFromDrivers = driversList.reduce((acc, d) => acc + (d.trips || 0), 0);
    return Math.max(completedReqs.length, sumFromDrivers);
  }, [allRequests, driversList]);

  const isApprover = user?.role?.toLowerCase() === "approver";

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
        <div className="text-[13px] text-[#64748b] mb-6 max-w-2xl">
          Monitor driver readiness, operational schedules, ratings, and transportation workload across activities.
        </div>

        {/* Section Navigation Switcher */}
        <div className="flex items-center gap-2 mb-7 border-b border-[#e2e8f0] pb-3">
          <button
            onClick={() => setActiveSection("status")}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              activeSection === "status"
                ? "bg-[#1e3a8a] text-white shadow-sm"
                : "bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-slate-50"
            }`}
          >
            Status & Ketersediaan
          </button>
          <button
            onClick={() => setActiveSection("performance")}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
              activeSection === "performance"
                ? "bg-[#1e3a8a] text-white shadow-sm"
                : "bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-slate-50"
            }`}
          >
            Performa & Rating Driver
          </button>
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
        ) : activeSection === "status" ? (
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
                filtered.map((d) => (
                  <DriverCard 
                    key={d.id} 
                    driver={d} 
                    onToggleDuty={handleToggleClick} 
                    onViewReviews={handleOpenReviews} 
                  />
                ))
              )}
            </div>
          </>
        ) : (
          /* SECTION: Performance & Rating Module */
          <div className="space-y-6">
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Driver Terbaik (Top Rated)</div>
                {topDriver ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={topDriver.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(topDriver.name)}&background=1e3a8a&color=fff`}
                      alt={topDriver.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-amber-300"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800">{topDriver.name}</div>
                      <div className="text-xs font-black text-amber-600">⭐ {Number(topDriver.rating).toFixed(1)} / 5.0</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">Belum ada data driver</div>
                )}
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Rating Rata-rata Armada</div>
                <div className="text-2xl font-black text-slate-800 mb-1">⭐ {fleetAvgRating} <span className="text-xs text-slate-400 font-semibold">/ 5.0</span></div>
                <div className="text-xs text-slate-500 font-medium">Kualitas pelayanan driver</div>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Total Ulasan Masuk</div>
                <div className="text-2xl font-black text-slate-800 mb-1">{totalReviewsCount} <span className="text-xs text-slate-400 font-semibold">Ulasan</span></div>
                <div className="text-xs text-slate-500 font-medium">Ulasan bintang dari penumpang</div>
              </div>

              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-2xs">
                <div className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Total Trip Selesai</div>
                <div className="text-2xl font-black text-slate-800 mb-1">{totalCompletedTrips} <span className="text-xs text-slate-400 font-semibold">Trips</span></div>
                <div className="text-xs text-slate-500 font-medium">Akumulasi perjalanan dinas</div>
              </div>
            </div>

            {/* Performance Leaderboard Table */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-2xs">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Leaderboard Performa Driver</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Rekapitulasi rating rata-rata dan kepuasan pelayanan pengemudi</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Driver</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Total Trips</th>
                      <th className="py-3.5 px-5">Rating Rata-rata</th>
                      <th className="py-3.5 px-5">Tingkat Kepuasan</th>
                      <th className="py-3.5 px-5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driversList.map((d) => {
                      const ratingVal = d.rating || 5.0;
                      const satisfactionLabel = ratingVal >= 4.5 ? "Sangat Baik" : ratingVal >= 4.0 ? "Baik" : "Cukup";
                      const satisfactionColor = ratingVal >= 4.5 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ratingVal >= 4.0 ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200";

                      return (
                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <img
                                src={d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name)}&background=1e3a8a&color=fff`}
                                alt={d.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <div className="font-bold text-slate-800">{d.name}</div>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase">{d.driverId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[d.status].badge}`}>
                              {STATUS_CONFIG[d.status].label}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 font-bold text-slate-700">{d.trips || 0} Perjalanan</td>
                          <td className="py-3.5 px-5 font-extrabold text-amber-600">
                            ⭐ {Number(ratingVal).toFixed(1)} / 5.0
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`text-[10.5px] font-extrabold px-2.5 py-1 rounded-md border ${satisfactionColor}`}>
                              {satisfactionLabel}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <button
                              onClick={() => handleOpenReviews(d)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Detail Ulasan
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Ulasan Driver (100% Anonim) */}
      {reviewsModal.isOpen && reviewsModal.driver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative max-h-[85vh] flex flex-col">
            <button 
              onClick={() => setReviewsModal({ isOpen: false, driver: null, reviews: [], loading: false })}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100 flex-shrink-0">
              <img
                src={reviewsModal.driver.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewsModal.driver.name)}&background=1e3a8a&color=fff`}
                alt={reviewsModal.driver.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-800">{reviewsModal.driver.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                  <span>ID: {reviewsModal.driver.driverId}</span>
                  <span>•</span>
                  <span className="text-amber-600 font-extrabold">⭐ {Number(reviewsModal.driver.rating).toFixed(1)} / 5.0</span>
                  <span>•</span>
                  <span>{reviewsModal.reviews.length} Ulasan</span>
                </div>
              </div>
            </div>

            {/* Modal Content: Reviews List */}
            <div className="flex-1 overflow-y-auto py-5 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Riwayat Ulasan Pelayanan (Anonim)</div>
              {reviewsModal.loading ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium">Memuat ulasan...</div>
              ) : reviewsModal.reviews.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-semibold border border-dashed rounded-2xl border-slate-200">
                  Belum ada catatan ulasan dari perjalanan dinas untuk pengemudi ini.
                </div>
              ) : (
                reviewsModal.reviews.map((r: any, idx: number) => (
                  <div key={r.id || idx} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                        ⭐ <span className="text-slate-800 font-black">{r.rating} / 5.0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100">
                          Anonim (Penumpang)
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {r.rated_at ? new Date(r.rated_at).toLocaleDateString('id-ID') : r.date || 'Tugas Perjalanan'}
                        </span>
                      </div>
                    </div>
                    {r.destination && (
                      <div className="text-[11px] font-semibold text-slate-500">
                        Tujuan: {r.destination}
                      </div>
                    )}
                    {r.rating_notes || r.ratingNotes ? (
                      <p className="text-xs text-slate-700 font-medium italic bg-white p-3 rounded-xl border border-slate-200/70">
                        "{r.rating_notes || r.ratingNotes}"
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">"Tidak ada catatan ulasan tambahan."</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setReviewsModal({ isOpen: false, driver: null, reviews: [], loading: false })}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm animate-fadein p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => {
                setConfirmModal({ isOpen: false, driverId: null, driverName: "", currentStatus: null });
                setValidationError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-xl" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-50 text-[#1e3a8a] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="help_outline" className="text-3xl" />
              </div>
              <h3 className="text-[18px] font-extrabold text-slate-800">Ubah Status Tugas Driver</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Apakah Anda yakin ingin mengubah status tugas driver <strong>{confirmModal.driverName}</strong> menjadi{" "}
                <span className={confirmModal.currentStatus === "AVAILABLE" ? "text-rose-600 font-bold" : "text-emerald-600 font-bold"}>
                  {confirmModal.currentStatus === "AVAILABLE" ? "OFF DUTY (Tidak Tersedia)" : "AVAILABLE (Tersedia)"}
                </span>?
              </p>
            </div>

            {validationError && (
              <div className="mb-5 p-4 bg-rose-50/80 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-800 text-[12.5px] leading-relaxed text-left animate-slidein">
                <Icon name="error" className="text-[18px] text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block mb-0.5 text-rose-900">Gagal Mengubah Status</span>
                  {validationError}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({ isOpen: false, driverId: null, driverName: "", currentStatus: null });
                  setValidationError(null);
                }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-sm"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmToggle}
                className={`flex-1 py-3 text-white font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-sm ${
                  confirmModal.currentStatus === "AVAILABLE" ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Icon name="check" className="text-base" />
                    Ya, Ubah Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}