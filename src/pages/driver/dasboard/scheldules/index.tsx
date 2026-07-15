import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

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
    <div className="p-4 sm:p-8">
      {/* Search Input Bar */}
      <div className="relative mb-6 max-w-md">
        <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, passenger, or route..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-[#e2e8f0] rounded-xl text-[13px] text-[#475569] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
        />
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden shadow-sm">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-b border-[#f1f5f9]">
          {/* Status Select */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 pl-3 pr-8 bg-white border border-[#e2e8f0] rounded-xl text-[13px] font-semibold text-[#334155] outline-none appearance-none cursor-pointer"
            >
              <option>All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
              <option value="Approved">Approved</option>
              <option value="Siap Dimulai">Ready</option>
              <option value="Sedang Berjalan">Ongoing</option>
            </select>
            <Icon name="expand_more" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] text-[18px] pointer-events-none" />
          </div>
        </div>

        {/* Table wrapper for horizontal scroll */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafbfc]">
                {["Trip ID", "Date & Time", "Passenger", "Vehicle Type", "Route", "Status", "Aksi"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-[11px] font-bold text-[#64748b] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((trip, idx) => {
                const isCompleted = trip.status === "Completed" || trip.status.toLowerCase().includes("complete") || trip.status.toLowerCase().includes("approve");
                const badgeClass = isCompleted 
                  ? "bg-[#dcfce7] text-[#15803d] border-[#bbf7d0]" 
                  : trip.status === "Rejected" || trip.status.toLowerCase().includes("reject")
                  ? "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]"
                  : "bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe]";

                return (
                  <tr
                    key={trip.id}
                    className={`border-b border-[#f8fafc] hover:bg-[#f8faff] transition-colors ${idx === filtered.length - 1 ? "border-0" : ""}`}
                  >
                    {/* Trip ID */}
                    <td className="px-6 py-5">
                      <span className="text-[13px] font-bold text-[#1e3a8a]">{trip.tripId}</span>
                    </td>
                    {/* Date */}
                    <td className="px-6 py-5">
                      <span className="text-[13px] text-[#475569]">{trip.datetime}</span>
                    </td>
                    {/* Passenger */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={trip.passengerAvatar}
                          alt={trip.passenger}
                          className="w-8 h-8 rounded-full object-cover border border-[#e2e8f0] flex-shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trip.passenger)}&background=1e3a8a&color=fff`; }}
                        />
                        <span className="text-[13px] font-bold text-[#0f172a]">{trip.passenger}</span>
                      </div>
                    </td>
                    {/* Vehicle type */}
                    <td className="px-6 py-5">
                      <span className="text-[13px] text-[#475569]">{trip.vehicleType}</span>
                    </td>
                    {/* Route */}
                    <td className="px-6 py-5">
                      <span className="text-[13px] text-[#475569] max-w-[180px] block truncate" title={trip.route}>
                        {trip.route}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-6 py-5">
                      <span className={`text-[11px] font-bold border px-2.5 py-1 rounded-full uppercase tracking-wide ${badgeClass}`}>
                        {trip.status}
                      </span>
                    </td>
                    {/* Aksi */}
                    <td className="px-6 py-5">
                      <button
                        onClick={() => onViewDetail(trip.id)}
                        className="text-[12px] font-bold text-[#1e3a8a] hover:text-[#1e40af] hover:underline transition-colors cursor-pointer"
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

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 flex flex-col items-center">
            <Icon name="history" className="text-[40px] text-[#cbd5e1] mb-2" />
            <p className="font-bold text-[#0f172a]">No trips found</p>
            <p className="text-[13px] text-[#64748b] mt-1">Try adjusting your search or filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
