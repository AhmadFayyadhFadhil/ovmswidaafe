import { useState } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useApi } from "@/hooks/useApi";
import { requestService } from "@/services/modules/requestService";

type HistoryTab = "Semua" | "Sedang Jalan" | "Selesai";

export default function SecurityHistoryPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("Semua");
  const [search, setSearch] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

  // Fetch all requests
  const { data: fetchedRequests, loading, error, refetch } = useApi(async () => {
    const res = await requestService.getAll({ per_page: 1000 });
    return { data: res.data || [] };
  }, true, []);

  const requestsList = fetchedRequests || [];

  // Filter requests that have check-out or check-in recorded by security
  const securityLogs = requestsList.filter((r) => {
    const hasCheckout = !!r.security_checked_out_at;
    const hasCheckin = !!r.security_checked_in_at;
    return hasCheckout || hasCheckin;
  });

  // Calculate statistics based on current database records
  const totalScans = securityLogs.length;
  const activeTrips = securityLogs.filter(
    (r) => !!r.security_checked_out_at && !r.security_checked_in_at
  ).length;
  const completedTrips = securityLogs.filter((r) => !!r.security_checked_in_at).length;

  // Filter based on search input and active tab
  const filteredLogs = securityLogs.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.destination.toLowerCase().includes(search.toLowerCase()) ||
      r.employee.toLowerCase().includes(search.toLowerCase()) ||
      (r.driverName && r.driverName.toLowerCase().includes(search.toLowerCase())) ||
      (r.external_driver_name && r.external_driver_name.toLowerCase().includes(search.toLowerCase())) ||
      (r.security_checkout_by && r.security_checkout_by.toLowerCase().includes(search.toLowerCase())) ||
      (r.security_checkin_by && r.security_checkin_by.toLowerCase().includes(search.toLowerCase()));

    const isCheckoutOnly = !!r.security_checked_out_at && !r.security_checked_in_at;
    const isCompleted = !!r.security_checked_in_at;

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

  const formatDateTime = (dtStr: string | null | undefined) => {
    if (!dtStr) return "-";
    try {
      const date = new Date(dtStr);
      if (isNaN(date.getTime())) {
        // Fallback: replace T and slice
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
    <Layout activeNav="Scan History" topbarTitle="Security Portal">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-extrabold text-slate-800 tracking-tight">
              Buku Log Scan Security
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Riwayat keluar masuk armada kendaraan perusahaan beserta catatan petugas jaga.
            </p>
          </div>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-1.5 h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <Icon name="refresh" className="text-base" /> Segarkan
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 text-[#1e3a8a] rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="history" className="text-xl" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Scan</div>
              <div className="text-2xl font-black text-slate-800 leading-tight mt-0.5">{totalScans}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="local_shipping" className="text-xl" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang Jalan</div>
              <div className="text-2xl font-black text-slate-800 leading-tight mt-0.5">{activeTrips}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon name="check_circle" className="text-xl" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</div>
              <div className="text-2xl font-black text-slate-800 leading-tight mt-0.5">{completedTrips}</div>
            </div>
          </div>
        </div>

        {/* Filters and Tabs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Icon name="search" className="text-lg" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari ID Request, pemohon, driver, atau nama petugas..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 font-medium"
              />
            </div>

            {/* Tabs Filter */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(["Semua", "Sedang Jalan", "Selesai"] as HistoryTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === t
                      ? "bg-white text-[#1e3a8a] shadow-sm"
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
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs text-slate-500 font-semibold">Memuat riwayat scan...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-5 rounded-2xl border border-red-100 text-center">
              Gagal memuat riwayat log scan security.
            </div>
          )}

          {!loading && !error && filteredLogs.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm text-slate-400">
              <Icon name="search_off" className="text-4xl mb-3 text-slate-300" />
              <p className="text-xs font-semibold">Tidak ada riwayat scan yang cocok.</p>
            </div>
          )}

          {!loading &&
            !error &&
            filteredLogs.map((log) => {
              const isExpanded = expandedRequestId === log.id;
              const hasCheckin = !!log.security_checked_in_at;
              const isExternal = !!log.is_external;

              return (
                <div
                  key={log.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Summary Bar */}
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 hover:bg-slate-50/50 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* Status Icon Indicator */}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                          hasCheckin ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        }`}
                      >
                        <Icon name={hasCheckin ? "check_circle" : "local_shipping"} className="text-lg" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-extrabold text-[#1e3a8a] bg-blue-50 px-2 py-0.5 rounded-md">
                            REQ #{log.id}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              isExternal
                                ? "bg-amber-50 text-amber-800 border border-amber-100"
                                : "bg-blue-50 text-blue-800 border border-blue-100"
                            }`}
                          >
                            {isExternal ? "Armada Eksternal" : "Armada Internal"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1.5">{log.destination}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Pemohon: <span className="font-semibold text-slate-500">{log.employee} ({log.department})</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & Chevron */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-auto border-t sm:border-t-0 border-slate-50 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span
                          className={`text-xs font-extrabold uppercase ${
                            hasCheckin ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {hasCheckin ? "SELESAI (KEMBALI)" : "SEDANG JALAN (BERANGKAT)"}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Update terakhir: {formatDateTime(log.security_checked_in_at || log.security_checked_out_at)}
                        </div>
                      </div>
                      <div className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                        <Icon name="keyboard_arrow_down" className="text-2xl" />
                      </div>
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-5 space-y-4 animate-fadein">
                      
                      {!isExternal && log.operational_trips && log.operational_trips.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            Rincian Perjalanan Unit Kendaraan ({log.operational_trips.length} Armada)
                          </div>
                          {log.operational_trips.map((trip: any) => (
                            <div key={trip.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                              <div className="flex justify-between items-start border-b border-slate-50 pb-2">
                                <div>
                                  <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <Icon name="directions_car" className="text-sm text-slate-400" />
                                    {trip.vehicle?.name || "Kendaraan"} ({trip.vehicle?.plate_number || ""})
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                                    Driver: {trip.driver?.name || "Driver"}
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  trip.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                  trip.status === 'on_going' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {trip.status === 'completed' ? 'Selesai' : trip.status === 'on_going' ? 'Sedang Jalan' : 'Scheduled'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                {/* Trip Checkout */}
                                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/60">
                                  <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Icon name="arrow_outward" className="text-xs text-amber-600" /> Berangkat
                                  </div>
                                  {trip.security_checked_out_at ? (
                                    <div className="space-y-0.5 mt-1 text-[11px] text-slate-600">
                                      <div>Waktu: <span className="font-semibold">{formatDateTime(trip.security_checked_out_at)}</span></div>
                                      <div>Petugas: <span className="font-semibold">{trip.security_checkout_by}</span></div>
                                      {trip.security_checkout_notes && <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-100">"{trip.security_checkout_notes}"</p>}
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic mt-1 text-[11px]">Belum berangkat</div>
                                  )}
                                </div>

                                {/* Trip Checkin */}
                                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/60">
                                  <div className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Icon name="login" className="text-xs text-emerald-600" /> Kembali
                                  </div>
                                  {trip.security_checked_in_at ? (
                                    <div className="space-y-0.5 mt-1 text-[11px] text-slate-600">
                                      <div>Waktu: <span className="font-semibold">{formatDateTime(trip.security_checked_in_at)}</span></div>
                                      <div>Petugas: <span className="font-semibold">{trip.security_checkin_by}</span></div>
                                      {trip.security_checkin_notes && <p className="italic bg-white p-1.5 rounded-md mt-1 border border-slate-100">"{trip.security_checkin_notes}"</p>}
                                    </div>
                                  ) : (
                                    <div className="text-slate-400 italic mt-1 text-[11px]">Belum kembali</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* Driver & Vehicle Details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-xs">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Kendaraan
                              </div>
                              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Icon name="directions_car" className="text-sm text-slate-400" />
                                {isExternal ? log.external_license_plate || "Tipe Sewa" : log.vehicleModel}
                              </div>
                              {isExternal && log.external_fleet_info && (
                                <div className="text-[10px] text-slate-400 mt-0.5 italic">Info: {log.external_fleet_info}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Driver / Pengemudi
                              </div>
                              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                                <Icon name="person" className="text-sm text-slate-400" />
                                {isExternal ? log.external_driver_name || "Driver Eksternal" : log.driverName}
                              </div>
                            </div>
                          </div>

                          {/* Security Scan Logs */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Checkout Log */}
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1">
                                <Icon name="arrow_outward" className="text-xs text-amber-600" />
                                LOG BERANGKAT
                              </div>
                              <div className="text-xs space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Waktu:</span>
                                  <span className="font-semibold text-slate-700">{formatDateTime(log.security_checked_out_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Petugas Jaga:</span>
                                  <span className="font-semibold text-slate-700">{log.security_checkout_by || "-"}</span>
                                </div>
                                <div className="mt-2 pt-1 border-t border-slate-50">
                                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan Petugas:</span>
                                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                                    "{log.security_checkout_notes || "Tidak ada catatan."}"
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Checkin Log */}
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-2">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1.5 flex items-center gap-1">
                                <Icon name="login" className="text-xs text-emerald-600" />
                                LOG KEMBALI
                              </div>
                              <div className="text-xs space-y-1">
                                {log.security_checked_in_at ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Waktu:</span>
                                      <span className="font-semibold text-slate-700">{formatDateTime(log.security_checked_in_at)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Petugas Jaga:</span>
                                      <span className="font-semibold text-slate-700">{log.security_checkin_by || "-"}</span>
                                    </div>
                                    <div className="mt-2 pt-1 border-t border-slate-50">
                                      <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Catatan Petugas:</span>
                                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                                        "{log.security_checkin_notes || "Tidak ada catatan."}"
                                      </p>
                                    </div>
                                  </>
                                ) : (
                                  <div className="py-6 text-center text-xs text-slate-400 italic">
                                    Belum kembali.
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>
                        </>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
        </div>

      </div>
    </Layout>
  );
}
