import { useState, useEffect } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useAuthContext } from "@/auth/authContext";
import { driverService } from "@/services/modules/driverService";
import { apiClient } from "@/services/api/api";

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

function DriverCard({ 
  driver, 
  onToggleDuty 
}: { 
  driver: Driver; 
  onToggleDuty: (id: string, name: string, status: DriverStatus) => void 
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
            
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider">
              <span>ID: {driver.driverId}</span>
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

        <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
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
  const [tab, setTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [driversList, setDriversList] = useState<Driver[]>([]);
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

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchDrivers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await driverService.getAll({ per_page: 1000 });
        const mapped = (res.data || []).map((d: any) => ({
          id: d.id,
          name: d.name,
          status: d.status === "AVAILABLE" ? "AVAILABLE" : (d.status === "ON TRIP" || d.status === "ON DUTY" || d.status === "ASSIGNED" ? "ON TRIP" : "OFF DUTY"),
          avatar: d.avatarUrl || d.avatar,
          driverId: `DRV-${String(d.id).padStart(3, "0")}`,
          trips: d.trips_count || 0,
          rating: d.rating || 5.0,
          email: d.email || "",
          phone: d.phone || "",
          location: d.location || "Pandaan Head Office",
          licenseType: d.sim_a_photo ? "SIM A Aktif" : "No SIM A",
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
    setValidationError(null);
    try {
      await apiClient.post(`/users/${driverId}/driver-duty`, {
        availability_status: nextStatus
      });
      
      // Update local list
      setDriversList(prev => prev.map(d => {
        if (d.id === driverId) {
          return {
            ...d,
            status: nextStatus === "unavailable" ? "OFF DUTY" : "AVAILABLE"
          };
        }
        return d;
      }));
      setConfirmModal({ isOpen: false, driverId: null, driverName: "", currentStatus: null });
    } catch (err: any) {
      console.error(err);
      setValidationError(err.response?.data?.message || "Gagal mengubah status tugas driver.");
    } finally {
      setActionLoading(false);
    }
  };

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
                filtered.map((d) => <DriverCard key={d.id} driver={d} onToggleDuty={handleToggleClick} />)
              )}
            </div>
          </>
        )}
      </div>

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