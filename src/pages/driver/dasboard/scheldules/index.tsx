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
      t.route.toLowerCase().includes(q);

    const matchStatus =
      statusFilter === "All Statuses" ||
      t.status.toLowerCase() === statusFilter.toLowerCase();

    return matchQ && matchStatus;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-[24px] font-extrabold text-[#0f172a] tracking-tight">Riwayat Penugasan Driver</h2>
        <p className="text-[13px] text-[#64748b] mt-0.5">Arsip riwayat perjalanan operasional Anda yang telah diselesaikan, dibatalkan, atau ditolak.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full max-w-md">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan ID, nama penumpang, atau rute..."
            className="w-full h-10 pl-9 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all"
          />
        </div>

        {/* Status Select */}
        <div className="relative min-w-[160px] self-start sm:self-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-10 pl-3 pr-9 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#475569] outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all"
          >
            <option value="All Statuses">Semua Status</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rejected">Rejected</option>
          </select>
          <Icon name="expand_more" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px] pointer-events-none" />
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        {/* Desktop View (Hidden on mobile, visible on medium screens and up) */}
        <div className="hidden md:block">
          <div className="overflow-x-auto max-w-full">
            <table className="w-full min-w-[970px] table-fixed">
              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[170px]" />
                <col className="w-[280px]" />
                <col className="w-[200px]" />
                <col className="w-[120px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#fafbfc]">
                  {["Trip ID", "Date & Time", "Passenger", "Vehicle Type", "Status", "Aksi"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            <tbody>
              {filtered.map((trip, idx) => {
                const isCompleted = trip.status === "Completed" || trip.status.toLowerCase().includes("complete") || trip.status.toLowerCase().includes("approve");
                const isCancelled = trip.status === "Cancelled" || trip.status.toLowerCase().includes("cancel");
                const badgeClass = isCompleted 
                  ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]" 
                  : isCancelled
                  ? "bg-slate-50 text-slate-600 border-slate-200"
                  : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";

                return (
                  <tr
                    key={trip.id}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8faff] transition-colors ${idx === filtered.length - 1 ? "border-0" : ""}`}
                  >
                    {/* Trip ID */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[13.5px] font-bold text-[#1e3a8a] whitespace-nowrap">{trip.tripId}</span>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[13px] text-[#475569] whitespace-nowrap">{trip.datetime}</span>
                    </td>
                    {/* Passenger */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#eef2ff] text-[#1e3a8a] border border-[#dbeafe] flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-2xs">
                          {getInitials(trip.passenger)}
                        </div>
                        <span className="text-[13.5px] font-bold text-[#0f172a] whitespace-nowrap">{trip.passenger}</span>
                      </div>
                    </td>
                    {/* Vehicle type */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-[13px] text-[#475569] whitespace-nowrap">{trip.vehicleType}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`text-[10.5px] font-bold border px-2.5 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${badgeClass}`}>
                        {trip.status}
                      </span>
                    </td>
                    {/* Aksi */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewDetail(trip.id)}
                        className="text-[12.5px] font-bold text-[#1e3a8a] hover:text-[#1e40af] hover:underline transition-colors cursor-pointer whitespace-nowrap"
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
        </div>

        {/* Mobile View (Visible on mobile, hidden on desktop) */}
        <div className="block md:hidden divide-y divide-[#f1f5f9]">
          {filtered.map((trip) => {
            const isCompleted = trip.status === "Completed" || trip.status.toLowerCase().includes("complete") || trip.status.toLowerCase().includes("approve");
            const isCancelled = trip.status === "Cancelled" || trip.status.toLowerCase().includes("cancel");
            const badgeClass = isCompleted 
              ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]" 
              : isCancelled
              ? "bg-slate-50 text-slate-600 border-slate-200"
              : "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]";

            return (
              <div key={trip.id} className="p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#1e3a8a]">{trip.tripId}</span>
                  <span className={`text-[10.5px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wide ${badgeClass}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#eef2ff] text-[#1e3a8a] border border-[#dbeafe] flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-2xs">
                    {getInitials(trip.passenger)}
                  </div>
                  <div>
                    <div className="text-[13.5px] font-bold text-[#0f172a]">{trip.passenger}</div>
                    <div className="text-[11.5px] text-[#64748b] mt-0.5">{trip.datetime}</div>
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-[#94a3b8] block text-[9.5px] uppercase font-bold tracking-wider">Vehicle Type</span>
                  <span className="text-[12.5px] text-[#475569] font-semibold">{trip.vehicleType}</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => onViewDetail(trip.id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#eef2ff] text-[#1e3a8a] text-[12px] font-bold hover:bg-[#dbeafe] transition active:scale-95 cursor-pointer"
                  >
                    View Detail
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center">
            <Icon name="history" className="text-[40px] text-[#cbd5e1] mb-2" />
            <p className="font-bold text-[#0f172a]">Tidak ada riwayat ditemukan</p>
            <p className="text-[13px] text-[#64748b] mt-1">Coba ganti filter atau pencarian Anda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
