import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

function getInitials(name: string) {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  return parts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export interface TripHistory {
  id: string;
  tripId: string;
  datetime: string;
  passenger: string;
  passengerAvatar: string;
  vehicleType: string;
  route: string;
  status: string;
}

interface TripSchedulePageProps {
  trips: TripHistory[];
  onViewDetail: (id: string) => void;
}

export default function TripSchedulePage({ trips, onViewDetail }: TripSchedulePageProps) {
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("All Statuses");

  const filtered = trips.filter((t) => {
    const q = search.toLowerCase();
    const matchQ =
      t.tripId.toLowerCase().includes(q) ||
      t.passenger.toLowerCase().includes(q) ||
      t.route.toLowerCase().includes(q) ||
      t.vehicleType.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "All Statuses" ||
      t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchQ && matchStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fadein max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">Riwayat Penugasan Driver</h2>
          <p className="text-xs sm:text-[13px] text-[#64748b] mt-0.5">Arsip seluruh perjalanan dinas Anda yang telah selesai, dibatalkan, atau ditolak.</p>
        </div>
        <div className="text-xs font-bold text-[#1e3a8a] bg-[#eff4ff] border border-[#dbeafe] px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          Total: {filtered.length} Perjalanan
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Icon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan ID, nama penumpang, kendaraan, atau rute..."
            className="w-full h-11 pl-10 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 shadow-2xs transition-all"
          />
        </div>

        {/* Status Select */}
        <div className="relative min-w-[170px] self-start sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-11 pl-3.5 pr-9 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-bold text-[#475569] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1e3a8a]/20 shadow-2xs transition-all"
          >
            <option value="All Statuses">Semua Status</option>
            <option value="Completed">Completed (Selesai)</option>
            <option value="Cancelled">Cancelled (Batal)</option>
            <option value="Rejected">Rejected (Ditolak)</option>
          </select>
          <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[20px] pointer-events-none" />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-4 w-[110px]">Trip ID</th>
                <th className="px-4 py-4 w-[160px]">Tanggal & Waktu</th>
                <th className="px-4 py-4 min-w-[180px]">Penumpang</th>
                <th className="px-4 py-4 min-w-[240px]">Armada Kendaraan</th>
                <th className="px-4 py-4 w-[130px] text-center">Status</th>
                <th className="px-5 py-4 w-[120px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filtered.map((trip) => {
                const isCompleted = trip.status === "Completed" || trip.status.toLowerCase().includes("complete") || trip.status.toLowerCase().includes("approve");
                const isCancelled = trip.status === "Cancelled" || trip.status.toLowerCase().includes("cancel");
                
                const badgeClass = isCompleted 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : isCancelled
                  ? "bg-slate-100 text-slate-600 border-slate-200"
                  : "bg-red-50 text-red-700 border-red-200";

                return (
                  <tr
                    key={trip.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Trip ID */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-[12px] font-bold text-[#1e3a8a] bg-[#eff4ff] border border-[#dbeafe] px-2.5 py-1 rounded-lg">
                        {trip.tripId}
                      </span>
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-slate-700 font-medium">{trip.datetime}</span>
                    </td>

                    {/* Passenger */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#eff4ff] text-[#1e3a8a] border border-[#dbeafe] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {getInitials(trip.passenger)}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate" title={trip.passenger}>
                            {trip.passenger}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Vehicle Type */}
                    <td className="px-4 py-4">
                      <div className="text-slate-700 font-medium max-w-[320px] truncate" title={trip.vehicleType}>
                        {trip.vehicleType || "Not Assigned"}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className={`text-[10.5px] font-extrabold border px-3 py-1 rounded-full uppercase tracking-wide inline-block ${badgeClass}`}>
                        {trip.status}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => onViewDetail(trip.id)}
                        className="text-[12px] font-bold text-[#1e3a8a] hover:text-[#1d4ed8] bg-slate-100 hover:bg-[#eff4ff] hover:border-[#bfdbfe] border border-transparent px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-block"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="block md:hidden divide-y divide-slate-100">
          {filtered.map((trip) => {
            const isCompleted = trip.status === "Completed" || trip.status.toLowerCase().includes("complete") || trip.status.toLowerCase().includes("approve");
            const isCancelled = trip.status === "Cancelled" || trip.status.toLowerCase().includes("cancel");
            const badgeClass = isCompleted 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
              : isCancelled
              ? "bg-slate-100 text-slate-600 border-slate-200"
              : "bg-red-50 text-red-700 border-red-200";

            return (
              <div key={trip.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1e3a8a] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                    {trip.tripId}
                  </span>
                  <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#eef2ff] text-[#1e3a8a] border border-[#dbeafe] flex items-center justify-center font-bold text-[11px] shrink-0">
                    {getInitials(trip.passenger)}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-[#0f172a]">{trip.passenger}</div>
                    <div className="text-[11.5px] text-[#64748b] mt-0.5">{trip.datetime}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs text-slate-700">
                  <span className="font-medium truncate block">{trip.vehicleType || "Not Assigned"}</span>
                </div>

                <button
                  onClick={() => onViewDetail(trip.id)}
                  className="w-full py-2.5 rounded-xl bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-bold hover:bg-[#dbeafe] transition active:scale-95 cursor-pointer text-center block"
                >
                  View Detail
                </button>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center p-4">
            <p className="font-bold text-[#0f172a] text-sm">Tidak ada riwayat perjalanan ditemukan</p>
            <p className="text-[12px] text-[#64748b] mt-1 max-w-xs">Coba ubah kata kunci pencarian atau ganti filter status di atas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
