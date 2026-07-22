import { useState, useEffect } from "react";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import CalendarView from "@/pages/driver/dasboard/CalendarView";
import type { CalendarEvent } from "@/pages/driver/dasboard/CalendarView";
import { requestService } from "@/services/modules/requestService";
import { driverService } from "@/services/modules/driverService";
import { RequestDetailModal } from "@/components/ui/RequestDetailModal";
import type { FleetRequest } from "@/types";

interface DriverOption {
  id: string;
  name: string;
}

export default function GAHRDCalendarPage({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Detail State
  const [selectedRequest, setSelectedRequest] = useState<FleetRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reqRes, driverRes] = await Promise.all([
          requestService.getAll({ per_page: 1000 }),
          driverService.getAll({ per_page: 1000 }),
        ]);
        setRequests(reqRes.data || []);

        const mappedDrivers = (driverRes.data || []).map((d: any) => ({
          id: String(d.id),
          name: d.name,
        }));
        setDrivers(mappedDrivers);
      } catch (err: any) {
        console.error(err);
        setError("Gagal memuat data kalender penugasan driver.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleViewDetail = async (id: string) => {
    try {
      const res = await requestService.getById(id);
      if (res.data) {
        setSelectedRequest(res.data);
        setIsModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn("Gagal memuat detail request via API, menggunakan fallback data lokal", err);
    }

    const found = requests.find((r) => String(r.id) === String(id));
    if (found) {
      setSelectedRequest(found);
      setIsModalOpen(true);
    } else {
      alert("Gagal memuat detail request.");
    }
  };

  // Map requests to CalendarEvents (Expanding multi-day itineraries for all dates)
  const allEvents: CalendarEvent[] = [];

  requests.forEach((r) => {
    if (r.rawStatus === "rejected" || r.rawStatus === "cancelled") return;

    if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
      r.itineraries.forEach((it: any, idx: number) => {
        const driverId = it.driver_id ? String(it.driver_id) : (r.driverId ? String(r.driverId) : undefined);
        const driverName = it.is_external
          ? `Pihak Ke-3 (${it.external_driver_name || "Sewa"})`
          : (it.driver_name || r.driverName || (it.driver_id ? "Driver Terjadwal" : undefined));

        // Skip if not assigned driver and not external
        if (!driverId && !it.driver_name && !r.driverId && !it.is_external) return;

        let status = "Scheduled";
        if (it.morning_status === "completed" && (it.afternoon_status === "completed" || !it.afternoon_destination)) {
          status = "Completed";
        } else if (it.morning_status === "on_going" || it.afternoon_status === "on_going") {
          status = "On Going";
        } else if (r.rawStatus === "completed" || it.status === "completed") {
          status = "Completed";
        }

        const sessionTexts = [];
        if (it.morning_destination) sessionTexts.push(`Pagi: ${it.morning_time || '08:00'} (${it.morning_destination})`);
        if (it.afternoon_destination) sessionTexts.push(`Sore: ${it.afternoon_time || '16:00'} (${it.afternoon_destination})`);
        const sessionInfo = sessionTexts.length > 0 ? sessionTexts.join(" | ") : undefined;

        allEvents.push({
          id: String(r.id),
          tripId: `#REQ-${r.id} (Hari ${idx + 1})`,
          title: `Trip to ${it.morning_destination || it.afternoon_destination || r.destination}`,
          datetime: `${it.date} (${it.morning_time || it.afternoon_time || '08:00'})`,
          dateStr: it.date,
          route: `${r.destination} - Hari ${idx + 1}`,
          passenger: r.employee || "Staff",
          status: status,
          driverName: driverName || "Driver",
          driverId: driverId,
          sessionDetails: sessionInfo,
        });
      });
    } else {
      if (!r.driverId && !r.is_external) return;

      let dateStr = "";
      if (r.startTime) {
        dateStr = r.startTime.includes("T") ? r.startTime.split("T")[0] : r.startTime.split(" ")[0];
      } else if (r.date) {
        dateStr = r.date;
      }

      let status = "Scheduled";
      if (r.rawStatus === "on_going") {
        status = "On Going";
      } else if (r.rawStatus === "completed") {
        status = "Completed";
      }

      allEvents.push({
        id: String(r.id),
        tripId: `#REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        datetime: r.startTime ? r.startTime.substring(0, 16).replace("T", " ") : `${r.date} ${r.time}`,
        dateStr: dateStr,
        route: r.destination,
        passenger: r.employee || "Staff",
        status: status,
        driverName: r.driverName || (r.is_external ? "Pihak Ke-3 (Sewa)" : "Driver"),
        driverId: r.driverId ? String(r.driverId) : undefined,
      });
    }
  });

  const calendarEvents = allEvents.filter((e) => {
    if (selectedDriverId === "all") return true;
    return String(e.driverId) === selectedDriverId;
  });

  return (
    <Layout
      activeNav="Calendar"
      onNavigate={onNavigate}
      topbarTitle="Kalender Penugasan Driver"
      userRole="GA/HRD"
      searchPlaceholder="Cari jadwal..."
    >
      <div className="flex-1 overflow-y-auto bg-[#f8f9ff]">
        {loading ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-[#64748b] font-medium">Memuat data kalender penugasan...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 flex items-center gap-3 text-red-600 text-[13.5px] font-semibold">
              <Icon name="error" className="text-[20px]" />
              {error}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Filter Panel */}
            <div className="bg-white border-b border-[#e2e8f0] p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Kalender Penugasan Driver</h1>
                <p className="text-[12.5px] text-[#64748b]">Pantau dan filter seluruh jadwal tugas armada pengemudi.</p>
              </div>

              {/* Driver filter dropdown */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="text-[12.5px] font-bold text-[#64748b] whitespace-nowrap">Filter Driver:</span>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="h-10 px-3 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 transition-all font-semibold"
                >
                  <option value="all">Semua Driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Calendar View Component */}
            <CalendarView events={calendarEvents} onViewDetail={handleViewDetail} />
          </div>
        )}
      </div>

      {/* Detail Request Modal */}
      {isModalOpen && selectedRequest && (
        <RequestDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          request={selectedRequest}
        />
      )}
    </Layout>
  );
}
