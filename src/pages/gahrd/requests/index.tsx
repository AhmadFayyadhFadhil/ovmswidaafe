import { useState, useEffect } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { requestService } from "@/services/modules/requestService";
import { driverService } from "@/services/modules/driverService";
import { assignmentService } from "@/services/modules/assignmentService";
import { useAuthContext } from "@/auth/authContext";

export type Priority = "URGENT" | "NORMAL" | "CRITICAL";

export interface Driver {
  id: string;
  name: string;
  email?: string;
  status: "AVAILABLE" | "ON TRIP" | "OFF DUTY";
  avatar?: string;
}

type TabFilter = "All" | "Normal" | "Urgent" | "Critical";

function PriBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
    HIGH:     "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    LOW:      "bg-[#f0fdf4] text-[#16a34a] border border-[#dcfce7]",
  };
  const display = p.toUpperCase();
  const badgeClass = map[display] || "bg-gray-100 text-gray-700 border border-gray-200";
  return (
    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${badgeClass}`}>{display}</span>
  );
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]";
    case "ONGOING":
      return "bg-[#dbeafe] text-[#1d4ed8] border border-[#bfdbfe]";
    case "PENDING":
      return "bg-[#fef3c7] text-[#d97706] border border-[#fde68a]";
    case "COMPLETED":
      return "bg-[#e2e8f0] text-[#475569] border border-[#cbd5e1]";
    case "REJECTED":
      return "bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]";
    default:
      return "bg-[#f1f5f9] text-[#64748b] border border-[#cbd5e1]";
  }
}

export default function GAHRDRequestsPage() {
  const { user } = useAuthContext();
  const [tab, setTab] = useState<TabFilter>("All");
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment Modal States
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");
  const [assignError, setAssignError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const reqRes = await requestService.getAll({ per_page: 1000 });
      setRequests(reqRes.data || []);

      const driverRes = await driverService.getAll({ per_page: 1000 });
      const mappedDrivers = (driverRes.data || []).map((d: any) => ({
        id: String(d.id),
        name: d.name,
        email: d.email,
        status: d.status === "AVAILABLE" ? "AVAILABLE" : (d.status === "ON DUTY" ? "ON TRIP" : "OFF DUTY"),
      } as Driver));
      setDrivers(mappedDrivers);
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAssignModal = (req: any) => {
    setSelectedRequest(req);
    setSelectedDriverId("");
    setAssignNotes("");
    setAssignError("");
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || !selectedRequest) return;

    setActionLoading(true);
    setAssignError("");
    try {
      await assignmentService.create({
        request_id: selectedRequest.id,
        driver_id: selectedDriverId,
        notes: assignNotes || undefined,
      });
      setIsAssignModalOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      setAssignError(err.response?.data?.message || "Gagal menugaskan driver.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAssignment = async (requestId: string) => {
    if (!window.confirm("Apakah Anda yakin ingin membatalkan penugasan driver untuk request ini?")) return;
    setActionLoading(true);
    try {
      const res = await assignmentService.getAll({ per_page: 1000 });
      const assignment = (res.data || []).find(
        (a: any) => String(a.request?.id) === String(requestId) && a.status === 'pending_driver'
      );
      if (assignment) {
        await assignmentService.cancel(assignment.id);
        await fetchData();
      } else {
        alert("Assignment tidak ditemukan.");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal membatalkan penugasan.");
    } finally {
      setActionLoading(false);
    }
  };

  const readyDrivers = drivers.filter((d) => d.status === "AVAILABLE");

  // Filter requests
  const filtered = requests.filter((r) => {
    const priorityUpper = (r.priority || "NORMAL").toUpperCase();
    const matchTab =
      tab === "All" ||
      (tab === "Normal"   && priorityUpper === "NORMAL") ||
      (tab === "Urgent"   && (priorityUpper === "URGENT" || priorityUpper === "HIGH")) ||
      (tab === "Critical" && (priorityUpper === "CRITICAL" || priorityUpper === "URGENT"));

    const q = search.toLowerCase();
    const matchQ =
      (r.employee || "").toLowerCase().includes(q) ||
      (r.destination || "").toLowerCase().includes(q) ||
      (r.id || "").toLowerCase().includes(q) ||
      (r.purpose || "").toLowerCase().includes(q);

    return matchTab && matchQ;
  });

  // Calculate statistics
  // Pending assignment: requests in APPROVED state (driver not assigned yet)
  const pendingAssignCount = requests.filter(
    (r) => r.rawStatus === "approved_hrd_ga" || r.rawStatus === "approved_hrd" || r.rawStatus === "approved_department"
  ).length;

  const activeTripCount = requests.filter((r) => r.rawStatus === "on_going").length;

  const criticalCount = requests.filter(
    (r) => (r.priority || "").toUpperCase() === "CRITICAL" || (r.priority || "").toUpperCase() === "URGENT"
  ).length;

  const urgentCount = requests.filter(
    (r) => (r.priority || "").toUpperCase() === "URGENT" || (r.priority || "").toUpperCase() === "HIGH"
  ).length;

  const isApprover = user?.role === "approver";

  return (
    <Layout
      activeNav={isApprover ? "Driver Assignment" : "Requests"}
      topbarTitle={isApprover ? "Driver Assignment" : "GAHRD Driver Assignment"}
      userName={user?.name || "GAHRD User"}
      userRole={isApprover ? "Manager Approver" : "GA/HRD"}
      searchPlaceholder="Cari request..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff] p-4 sm:p-8">

        <div className="text-[18px] font-bold text-[#0f172a] mb-1">Driver Assignment Center</div>
        <div className="text-[13px] text-[#64748b] mb-6 max-w-2xl">
          Tugaskan driver yang tersedia ke permintaan perjalanan operasional yang sudah disetujui, dan kelola koordinasi transportasi di seluruh organisasi.
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Pending */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
              <Icon name="pending_actions" className="text-[22px] text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Menunggu Driver</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{pendingAssignCount}</div>
            </div>
          </div>
          {/* Available drivers */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] flex items-center justify-center flex-shrink-0">
              <Icon name="commute" className="text-[22px] text-[#16a34a]" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Driver Tersedia</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{readyDrivers.length}</div>
            </div>
          </div>
          {/* Active trips */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#1e3a8a] flex items-center justify-center flex-shrink-0">
              <Icon name="route" className="text-[22px] text-white" />
            </div>
            <div>
              <div className="text-[12px] text-[#64748b] font-medium">Trip Aktif</div>
              <div className="text-[22px] font-bold text-[#0f172a]">{activeTripCount}</div>
            </div>
          </div>
          {/* Critical */}
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-[#fecaca] flex items-center justify-center flex-shrink-0">
              <Icon name="error" className="text-[22px] text-[#dc2626]" />
            </div>
            <div>
              <div className="text-[12px] text-[#dc2626] font-semibold">Tingkat Kritis</div>
              <div className="text-[22px] font-bold text-[#dc2626]">{criticalCount}</div>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          <div>
            {/* Tab filter */}
            <div className="overflow-x-auto max-w-full mb-5">
              <div className="flex gap-1 bg-white border border-[#e2e8f0] rounded-xl p-1 w-fit shadow-sm">
                {(["All", "Normal", "Urgent", "Critical"] as TabFilter[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-5 h-9 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      tab === t ? "bg-[#1e3a8a] text-white shadow-sm" : "text-[#64748b] hover:text-[#334155]"
                    }`}
                  >
                    {t}
                    {t === "Urgent" && urgentCount > 0 && (
                      <span className={`w-2 h-2 rounded-full ${tab === "Urgent" ? "bg-white" : "bg-[#f97316]"}`} />
                    )}
                    {t === "Critical" && criticalCount > 0 && (
                      <span className={`w-2 h-2 rounded-full ${tab === "Critical" ? "bg-white" : "bg-[#dc2626]"}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Request list */}
            {loading ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
                <p className="text-[13px] text-[#64748b] font-medium">Memuat data permintaan...</p>
              </div>
            ) : error ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
                <Icon name="error" className="text-[20px]" />
                {error}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-2xl py-16 flex flex-col items-center">
                <Icon name="inbox" className="text-[40px] text-[#cbd5e1] mb-2" />
                <p className="font-bold text-[#0f172a]">Tidak ada data request ditemukan</p>
                <p className="text-[13px] text-[#64748b] mt-1">Ganti filter atau lakukan pencarian lain.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filtered.map((req) => {
                  const showAssign =
                    req.rawStatus === "approved_hrd_ga" ||
                    req.rawStatus === "approved_hrd" ||
                    req.rawStatus === "approved_department";
                  const showCancel = req.rawStatus === "waiting_driver";

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden hover:border-[#c7d7f7] hover:shadow-sm transition-all"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#f8fafc] bg-[#fafbfc]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a] font-bold text-[14px]">
                            {req.employee ? req.employee.charAt(0).toUpperCase() : "E"}
                          </div>
                          <div>
                            <div className="text-[13.5px] font-bold text-[#0f172a] tracking-wide">{req.employee}</div>
                            <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider">
                              REQUEST #{req.id} • {req.department}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriBadge p={req.priority} />
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Tujuan Perjalanan</div>
                          <div className="flex items-center gap-1 text-[13.5px] font-semibold text-[#0f172a]">
                            <Icon name="location_on" className="text-[16px] text-blue-500" />
                            {req.destination}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Jadwal Keberangkatan</div>
                          <div className="text-[13px] font-semibold text-[#334155]">{req.date || "-"}</div>
                          <div className="text-[11px] text-[#94a3b8]">{req.time || "09:00"}</div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">Keperluan & Penumpang</div>
                          <div className="text-[12.5px] text-[#475569] italic">"{req.purpose}"</div>
                          <div className="text-[11px] font-medium text-[#64748b] mt-1">
                            {req.passengerCount} Penumpang
                          </div>
                        </div>
                      </div>

                      {/* Info on Assigned Driver/Vehicle */}
                      {(req.driverName !== "Not Assigned" || req.vehicleModel !== "Not Assigned") && (
                        <div className="px-6 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center gap-6 text-[12px]">
                          {req.driverName !== "Not Assigned" && (
                            <span className="text-[#475569]">
                              <strong>Driver:</strong> {req.driverName}
                            </span>
                          )}
                          {req.vehicleModel !== "Not Assigned" && (
                            <span className="text-[#475569]">
                              <strong>Kendaraan:</strong> {req.vehicleModel}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="px-6 pb-5 pt-3 border-t border-[#f8fafc] flex items-center justify-end gap-2">
                        {showAssign && (
                          <button
                            onClick={() => handleOpenAssignModal(req)}
                            disabled={actionLoading}
                            className="px-5 h-9 bg-green-600 text-white text-[12.5px] font-bold rounded-xl hover:bg-green-700 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Icon name="person_add" className="text-[16px]" />
                            Tugaskan Driver
                          </button>
                        )}

                        {showCancel && (
                          <button
                            onClick={() => handleCancelAssignment(req.id)}
                            disabled={actionLoading}
                            className="px-5 h-9 bg-white border border-red-200 text-red-600 text-[12.5px] font-bold rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Icon name="cancel" className="text-[16px]" />
                            Batalkan Penugasan
                          </button>
                        )}

                        <button
                          onClick={() => alert(`Detail Keperluan: "${req.purpose}"\nCatatan: "${req.notes || '-'}"`)}
                          className="w-9 h-9 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center hover:bg-[#f1f5f9] transition-colors cursor-pointer"
                        >
                          <Icon name="info" className="text-[18px] text-[#64748b]" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drivers availability sidebar */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 h-fit shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
              <div className="text-[14px] font-bold text-[#0f172a]">Status Pengemudi</div>
              <span className="text-[11px] font-bold text-white bg-[#1e3a8a] px-2.5 py-0.5 rounded-full">
                {readyDrivers.length} Siap
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {drivers.slice(0, 5).map((d) => (
                <div key={d.id} className="border border-[#e2e8f0] rounded-xl p-3 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-[#1e3a8a] font-bold text-[13px]">
                      {d.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white rounded-full ${
                        d.status === "AVAILABLE" ? "bg-green-500" : (d.status === "ON TRIP" ? "bg-amber-500" : "bg-gray-400")
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold text-[#0f172a] truncate">{d.name}</div>
                    <span className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                      d.status === "AVAILABLE" ? "bg-[#dcfce7] text-[#16a34a]" : (d.status === "ON TRIP" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-700")
                    }`}>
                      {d.status === "AVAILABLE" ? "Tersedia" : (d.status === "ON TRIP" ? "Dalam Perjalanan" : "Off")}
                    </span>
                  </div>
                </div>
              ))}
              {drivers.length === 0 && (
                <p className="text-[12px] text-[#94a3b8] text-center py-4">Tidak ada driver terdaftar.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[15px] font-bold text-[#0f172a]">Tugaskan Driver ke Request #{selectedRequest?.id}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer">
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-[12px] font-semibold flex items-center gap-2">
                  <Icon name="error" className="text-[16px]" />
                  {assignError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Pilih Pengemudi Tersedia</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Pilih Driver --</option>
                  {readyDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.email || "No Email"})
                    </option>
                  ))}
                </select>
                {readyDrivers.length === 0 && (
                  <p className="text-[11px] text-red-500 mt-1.5">Tidak ada pengemudi yang tersedia saat ini.</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] mb-1.5">Catatan Penugasan (Opsional)</label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="Contoh: Tolong bawa dokumen penting di bagasi..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[12.5px] font-bold text-[#475569] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedDriverId}
                  className="h-10 px-6 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-xl text-[12.5px] font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Menugaskan..." : "Tugaskan Pengemudi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}