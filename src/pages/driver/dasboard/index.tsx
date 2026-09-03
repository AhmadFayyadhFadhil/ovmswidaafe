import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout, Icon } from "@/components/layout/RoleLayout";
import { useAuthContext } from "@/auth/authContext";
import { assignmentService } from "@/services/modules/assignmentService";
import { requestService } from "@/services/modules/requestService";
import { vehicleService } from "@/services/modules/vehicleService";
import { apiClient } from "@/services/api/api";
import { RequestDetailModal } from "@/components/ui/RequestDetailModal";

import MyAssignmentsPage from "./Assignments";
import type { Assignment } from "./Assignments";
import TripSchedulePage from "./scheldules";
import type { TripHistory } from "./scheldules";
import VehiclePage from "./vahicle";
import type { Vehicle } from "./vahicle";
import CalendarView from "./CalendarView";
import type { CalendarEvent } from "./CalendarView";

function getMonthNameIndo(monthStr: string): string {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const idx = parseInt(monthStr, 10) - 1;
  return months[idx] || monthStr;
}

function PriBadge({ p }: { p: string }) {
  const map: Record<string, string> = {
    URGENT:   "bg-[#fff7ed] text-[#c2410c] border border-[#fed7aa]",
    NORMAL:   "bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]",
    CRITICAL: "bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]",
  };
  const hasDot = p !== "NORMAL";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${map[p] ?? map.NORMAL}`}>
      {hasDot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {p}
    </span>
  );
}

function RequestCard({
  req, onApprove, onReject, onViewDetail,
}: { req: Assignment; onApprove: (id: string) => void; onReject: (id: string) => void; onViewDetail: (reqId: string) => void }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#c7d7f7] hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={req.avatar} alt={req.requesterName}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#e2e8f0]"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.requesterName)}&background=1e3a8a&color=fff`; }}
          />
          <div>
            <div className="text-[14px] font-bold text-[#0f172a]">
              {req.requesterName}
            </div>
            <div className="text-[11px] text-[#94a3b8]">{req.department}</div>
          </div>
        </div>
        <PriBadge p={req.priority} />
      </div>

      {/* Destination */}
      <div className="bg-[#f8faff] border border-[#e5eeff] rounded-xl px-3 py-2.5 flex items-center gap-2">
        <div className="w-7 h-7 bg-[#eff4ff] rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon name="location_on" className="text-[16px] text-[#1e3a8a]" />
        </div>
        <div>
          <div className="text-[10px] text-[#94a3b8] font-semibold uppercase tracking-wider">Destination</div>
          <div className="text-[13px] font-bold text-[#0f172a]">{req.destination}</div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-[12px]">
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Date</div>
          <div className="font-semibold text-[#334155]">{req.date}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Time</div>
          <div className="font-semibold text-[#334155]">{req.time}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Vehicle Type</div>
          <div className="font-semibold text-[#334155]">{req.vehicleType}</div>
        </div>
        <div>
          <div className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-0.5">Purpose</div>
          <div className="font-semibold text-[#334155]">{req.purpose}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-[11.5px] font-bold rounded-lg">
          <Icon name="check_circle" className="text-[14px]" />
          Terjadwal
        </span>
        <button
          onClick={() => onViewDetail(req.reqId.replace('#REQ-', ''))}
          className="h-9 px-4 bg-[#2563eb] text-white text-[12px] font-bold rounded-xl hover:bg-[#1d4ed8] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Icon name="visibility" className="text-[15px]" />
          Lihat Detail
        </button>
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user, updateUser } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeNav, setActiveNav] = useState(() => {
    if (tabParam === "vehicle") return "My Vehicle";
    if (tabParam === "schedule") return "History";
    if (tabParam === "calendar") return "Calendar";
    if (tabParam === "assignments" || tabParam === "tasks") return "My Tasks";
    return "Dashboard";
  });

  useEffect(() => {
    if (tabParam === "vehicle") {
      setActiveNav("My Vehicle");
    } else if (tabParam === "schedule") {
      setActiveNav("History");
    } else if (tabParam === "calendar") {
      setActiveNav("Calendar");
    } else if (tabParam === "assignments" || tabParam === "tasks") {
      setActiveNav("My Tasks");
    } else {
      setActiveNav("Dashboard");
    }
  }, [tabParam]);

  const [rawAssignments, setRawAssignments] = useState<any[]>([]);
  const [rawRequests, setRawRequests] = useState<any[]>([]);
  const [rawVehicles, setRawVehicles] = useState<any[]>([]);
  const [driverProfile, setDriverProfile] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedAssignmentForAccept, setSelectedAssignmentForAccept] = useState<Assignment | null>(null);
  
  const [selectedRequestForDetail, setSelectedRequestForDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [zoomedQrUrl, setZoomedQrUrl] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const handleViewDetail = async (reqId: string) => {
    setDetailLoading(true);
    try {
      const res = await requestService.getById(reqId);
      if (res.data) {
        setSelectedRequestForDetail(res.data);
        setDetailLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn("Gagal memuat detail via API, menggunakan fallback data lokal", err);
    }

    const found = rawRequests.find((r) => String(r.id) === String(reqId));
    if (found) {
      setSelectedRequestForDetail(found);
    } else {
      alert("Gagal memuat detail permintaan.");
    }
    setDetailLoading(false);
  };
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "start" | "complete" | "reject";
    targetId: string;
    rejectReason?: string;
  }>({
    isOpen: false,
    type: "start",
    targetId: "",
  });

  const fetchData = async (clearCacheFirst = true) => {
    if (clearCacheFirst) {
      requestService.clearCache();
      assignmentService.clearCache();
    }
    setLoading(true);
    setError(null);
    try {
      const [assignRes, requestRes, vehicleRes, profileRes] = await Promise.all([
        assignmentService.getAll(),
        requestService.getAll(),
        vehicleService.getAll(),
        import.meta.env.VITE_ENABLE_MOCK !== "true" ? apiClient.get("/profile").catch(() => null) : Promise.resolve(null),
      ]);

      setRawAssignments(assignRes.data || []);
      setRawRequests(requestRes.data || []);
      setRawVehicles(vehicleRes.data || []);

      if (profileRes?.data?.status === "success" && profileRes.data.data) {
        const pData = profileRes.data.data;
        setDriverProfile(pData);
        updateUser({
          availability_status: pData.availability_status,
          sim_number: pData.sim_number,
          sim_type: pData.sim_type,
          sim_expiry_date: pData.sim_expiry_date,
          sim_status: pData.sim_status,
          sim_expiry_days_left: pData.sim_expiry_days_left,
        });
      }
    } catch (err: any) {
      console.error(err);
      setError("Gagal memuat data dari server. Silakan coba kembali.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);





  const handleReject = (assignmentId: string) => {
    setConfirmModal({
      isOpen: true,
      type: "reject",
      targetId: assignmentId,
      rejectReason: "",
    });
  };

  const handleApproveClick = async (id: string) => {
    setActionLoading(true);
    try {
      await assignmentService.respond(id, {
        response: "accepted",
      });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyetujui tugas.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicleId: string) => {
    if (!selectedAssignmentForAccept) return;
    setActionLoading(true);
    try {
      await assignmentService.respond(selectedAssignmentForAccept.id, {
        response: "accepted",
        vehicle_id: vehicleId,
      });
      setSelectedAssignmentForAccept(null);
      setSearchParams({});
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyetujui tugas.");
    } finally {
      setActionLoading(false);
    }
  };

  // Mappers
  const mapAssignment = (a: any): Assignment => {
    const req = a.request || {};
    const name = req.requested_by?.name || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    const priority = (req.priority || "NORMAL").toUpperCase() as "URGENT" | "NORMAL" | "CRITICAL";
    
    let dateStr = "Today";
    let timeStr = "09:00";
    if (req.start_time) {
      const parts = req.start_time.includes('T') ? req.start_time.split('T') : req.start_time.split(" ");
      if (parts[0]) {
        const dateSubparts = parts[0].split('-');
        dateStr = dateSubparts.length === 3 ? `${dateSubparts[2]}-${dateSubparts[1]}-${dateSubparts[0]}` : parts[0];
      }
      if (parts[1]) timeStr = parts[1].substring(0, 5);
    }
    
    return {
      id: a.id,
      avatar,
      requesterName: name,
      department: req.department_name || req.department_id || "IT Department",
      priority,
      reqId: `#REQ-${req.id || a.request_id}`,
      destination: req.destination_city && req.destination_place ? `${req.destination_city} - ${req.destination_place}` : req.destination_city || "",
      date: dateStr,
      time: timeStr,
      vehicleType: req.vehicle_model || "Unassigned",
      purpose: req.purpose || "Operational Trip",
    };
  };

  const mapTripHistory = (r: any): TripHistory => {
    const name = r.employee || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    
    let dateStr = "Today";
    if (r.date) {
      dateStr = `${r.date} ${r.time || '09:00'}`;
    }
    
    return {
      id: r.id,
      tripId: `#REQ-${r.id}`,
      datetime: dateStr,
      passenger: name,
      passengerAvatar: avatar,
      vehicleType: r.vehicleModel || "Unassigned",
      route: `${r.destination_city || ""} - ${r.destination_place || ""}`,
      status: r.rawStatus === "completed" ? "Completed" : r.rawStatus === "rejected" ? "Rejected" : r.rawStatus === "cancelled" ? "Cancelled" : r.status,
    };
  };

  const mapVehicle = (v: any): Vehicle => {
    const statusMap: Record<string, string> = {
      AVAILABLE: "Available",
      "IN TRANSIT": "On Trip",
      "IN USE": "In Use",
      MAINTENANCE: "In Use",
    };
    const status = (statusMap[v.status?.toUpperCase()] || v.status || "Available") as any;
    
    return {
      id: v.id,
      name: v.model || "Operational Car",
      plate: v.plate || "Unknown Plate",
      transmission: v.transmission || "Automatic",
      seats: v.capacity || 4,
      fuel: v.fuel_level || 100,
      image: v.photoUrl || (v.imageType === 'truck' ? "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=160&fit=crop" : v.imageType === 'tesla' ? "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=160&fit=crop" : "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=160&fit=crop"),
      status,
      location: v.location || "Pool A",
    };
  };

  // Filtered lists
  const pendingAssignments = rawAssignments
    .filter((a) => a.status === "pending_driver")
    .map(mapAssignment);

  const activeTrips = rawRequests.filter(
    (r) => {
      const isMatchedStatus = 
        r.rawStatus === "driver_assigned" || 
        r.rawStatus === "on_going" ||
        r.rawStatus === "waiting_driver" ||
        r.rawStatus === "assigned_by_ga";
      if (!isMatchedStatus) return false;
      
      const asg = rawAssignments.find(
        (a) => String(a.request?.id) === String(r.id) && String(a.driver?.id) === String(user?.id)
      );
      return asg && asg.status === "accepted";
    }
  );
  
  const historyTrips = rawRequests
    .filter((r) => r.rawStatus === "completed" || r.rawStatus === "rejected" || r.rawStatus === "cancelled")
    .map(mapTripHistory);

  const mappedVehicles = rawVehicles.map(mapVehicle);

  const calendarEvents: CalendarEvent[] = [];

  rawRequests.forEach(r => {
    if (r.rawStatus === "rejected" || r.rawStatus === "cancelled") return;

    if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
      r.itineraries.forEach((it: any, idx: number) => {
        const isMyDay = String(it.driver_id) === String(user?.id) || String(r.driverId) === String(user?.id);
        if (!isMyDay) return;

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

        calendarEvents.push({
          id: String(r.id),
          tripId: `#REQ-${r.id} (Hari ${idx + 1})`,
          title: `Trip to ${it.morning_destination || it.afternoon_destination || r.destination}`,
          datetime: `${it.date} (${it.morning_time || it.afternoon_time || '08:00'})`,
          dateStr: it.date,
          route: `${r.destination} - Hari ${idx + 1}`,
          passenger: r.employee || "Staff",
          status: status,
          driverName: user?.name || "Saya",
          sessionDetails: sessionInfo,
        });
      });
    } else {
      const isMyTrip = String(r.driverId) === String(user?.id);
      if (!isMyTrip) return;

      let dateStr = "";
      if (r.startTime) {
        dateStr = r.startTime.includes('T') ? r.startTime.split('T')[0] : r.startTime.split(" ")[0];
      } else if (r.date) {
        dateStr = r.date;
      }

      let status = "Scheduled";
      if (r.rawStatus === "on_going") {
        status = "On Going";
      } else if (r.rawStatus === "completed") {
        status = "Completed";
      }

      calendarEvents.push({
        id: String(r.id),
        tripId: `#REQ-${r.id}`,
        title: `Trip to ${r.destination}`,
        datetime: r.startTime ? r.startTime.substring(0, 16).replace('T', ' ') : `${r.date} ${r.time}`,
        dateStr: dateStr,
        route: r.destination,
        passenger: r.employee || "Staff",
        status: status,
        driverName: user?.name || "Saya",
      });
    }
  });

  const activeAssignments = activeTrips.map(r => {
    const asg = rawAssignments.find(
      (a) => String(a.request?.id) === String(r.id) && String(a.driver?.id) === String(user?.id)
    );
    const name = r.employee || "Staff";
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a8a&color=fff`;
    
    let dateVal = r.date || "";
    let timeVal = r.time || "";
    let destinationVal = r.destination || "";
    let vehicleVal = r.vehicleModel || "Unassigned";
    let tripStatusVal = r.rawStatus;

    if (Array.isArray(r.itineraries) && r.itineraries.length > 0) {
      let myIt = r.itineraries.find((it: any) => String(it.driver_id) === String(user?.id) && it.status !== 'completed');
      if (!myIt) {
        myIt = r.itineraries.find((it: any) => String(it.driver_id) === String(user?.id));
      }

      if (myIt) {
        if (myIt.date) {
          const dateParts = myIt.date.split('-');
          dateVal = dateParts.length === 3 ? `${parseInt(dateParts[2], 10)} ${getMonthNameIndo(dateParts[1])} ${dateParts[0]}` : myIt.date;
        }
        
        const timeParts = [];
        const destParts = [];
        if (myIt.morning_destination) {
          timeParts.push(myIt.morning_time || "08:00");
          destParts.push(myIt.morning_destination);
        }
        if (myIt.afternoon_destination) {
          timeParts.push(myIt.afternoon_time || "16:00");
          destParts.push(myIt.afternoon_destination);
        }
        timeVal = timeParts.join(" & ");
        destinationVal = destParts.join(" & ") || r.destination || "";

        vehicleVal = myIt.vehicle_name || myIt.vehicle_model || r.vehicleModel || "Unassigned";

        if (myIt.status === 'completed' || (myIt.morning_status === 'completed' && (myIt.afternoon_status === 'completed' || !myIt.afternoon_destination))) {
          tripStatusVal = 'completed';
        } else if (myIt.status === 'on_going' || myIt.morning_status === 'on_going' || myIt.afternoon_status === 'on_going') {
          tripStatusVal = 'on_going';
        } else {
          tripStatusVal = 'driver_assigned';
        }
      }
    }

    return {
      id: asg?.id || String(r.id),
      avatar,
      requesterName: name,
      department: r.department_name || r.department || "IT Department",
      priority: (r.priority === "URGENT" || r.priority === "HIGH" ? "URGENT" : "NORMAL") as "URGENT" | "NORMAL" | "CRITICAL",
      reqId: `#REQ-${r.id}`,
      destination: destinationVal,
      date: dateVal,
      time: timeVal,
      vehicleType: vehicleVal,
      purpose: r.purpose || "Operational Trip",
      tripStatus: tripStatusVal,
      requestId: String(r.id),
    };
  });

  // Current active trip hero (on_going priority, then driver_assigned, then assigned_by_ga, then waiting_driver)
  const currentTrip = 
    activeTrips.find(t => t.rawStatus === "on_going") || 
    activeTrips.find(t => t.rawStatus === "driver_assigned") ||
    activeTrips.find(t => t.rawStatus === "assigned_by_ga") ||
    activeTrips.find(t => t.rawStatus === "waiting_driver");

  const totalCompletedCount = rawRequests.filter(r => r.rawStatus === "completed").length;
  const upcomingCount = activeTrips.length;

  // Calculate Driver Average Rating & Rating Reviews List
  const ratedTrips = rawRequests.filter(r => r.rating && r.rating > 0);
  const totalRatingSum = ratedTrips.reduce((acc: number, r: any) => acc + Number(r.rating || 0), 0);
  const driverAvgRating = ratedTrips.length > 0 ? (totalRatingSum / ratedTrips.length).toFixed(1) : "5.0";
  const ratedCount = ratedTrips.length;

  const renderActiveTabContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin" />
          <p className="text-[13px] text-[#64748b] font-semibold">Memuat data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[13px] flex items-center gap-2">
          <Icon name="error" className="text-[18px]" />
          {error}
        </div>
      );
    }

    switch (activeNav) {
      case "Dashboard": {
         const getHeroStatusConfig = (status: string) => {
          switch (status) {
            case "on_going":
              return { label: "Berjalan", color: "bg-green-400 animate-pulse" };
            case "completed":
              return { label: "Selesai", color: "bg-emerald-500" };
            case "driver_assigned":
            case "pending":
              return { label: "Terjadwal (Siap Jalan)", color: "bg-[#7c3aed]" };
            case "assigned_by_ga":
              return { label: "Menunggu Review GA", color: "bg-purple-400 animate-pulse" };
            case "waiting_driver":
              return { label: "Menunggu Konfirmasi Driver", color: "bg-amber-400 animate-pulse" };
            default:
              return { label: "Terjadwal", color: "bg-gray-400" };
          }
        };

        const activeItineraryForDriver = (() => {
          if (!currentTrip || !Array.isArray(currentTrip.itineraries) || currentTrip.itineraries.length === 0) return null;
          return currentTrip.itineraries.find((it: any) => String(it.driver_id) === String(user?.id) && it.status !== 'completed')
            || currentTrip.itineraries.find((it: any) => String(it.driver_id) === String(user?.id));
        })();

        const driverTripStatus = (() => {
          if (!currentTrip) return null;
          if (activeItineraryForDriver) {
            if (activeItineraryForDriver.status === 'completed' || (activeItineraryForDriver.morning_status === 'completed' && (activeItineraryForDriver.afternoon_status === 'completed' || !activeItineraryForDriver.afternoon_destination))) {
              return 'completed';
            } else if (activeItineraryForDriver.status === 'on_going' || activeItineraryForDriver.morning_status === 'on_going' || activeItineraryForDriver.afternoon_status === 'on_going') {
              return 'on_going';
            } else {
              return 'driver_assigned';
            }
          }
          if (currentTrip.is_external) {
            return currentTrip.rawStatus;
          }
          const myTripDetails = currentTrip.operational_trips?.find(
            (ot: any) => String(ot.driver?.id) === String(user?.id)
          );
          if (myTripDetails) {
            return myTripDetails.status;
          }
          return currentTrip.rawStatus;
        })();

        const heroStatus = currentTrip ? getHeroStatusConfig(driverTripStatus || currentTrip.rawStatus) : null;

        const displayDestination = (() => {
          if (activeItineraryForDriver) {
            const dests = [];
            if (activeItineraryForDriver.morning_destination) dests.push(activeItineraryForDriver.morning_destination);
            if (activeItineraryForDriver.afternoon_destination) dests.push(activeItineraryForDriver.afternoon_destination);
            return dests.join(" & ") || currentTrip.destination;
          }
          return currentTrip?.destination || "";
        })();

        const displayTime = (() => {
          if (activeItineraryForDriver) {
            const times = [];
            if (activeItineraryForDriver.morning_destination) times.push(activeItineraryForDriver.morning_time || "08:00");
            if (activeItineraryForDriver.afternoon_destination) times.push(activeItineraryForDriver.afternoon_time || "16:00");
            return times.join(" & ") || currentTrip.time || "09:00";
          }
          return currentTrip?.time || "09:00";
        })();

        return (
          <div data-guide="driver-dashboard-overview" className="p-4 sm:p-8 space-y-6">
            {/* SIM Status Alert Banner (H-30 Warning / Expired Alert) */}
            {(() => {
              const profile = driverProfile || user;
              const simStatus = profile?.sim_status || (profile?.sim_expiry_date ? "valid" : "not_set");
              const daysLeft = profile?.sim_expiry_days_left;
              const expiryDate = profile?.sim_expiry_date;
              const simNo = profile?.sim_number;
              const simType = profile?.sim_type || "SIM A";

              if (simStatus === "expired") {
                return (
                  <div className="p-4 bg-red-50 border-2 border-red-400 rounded-2xl flex items-start gap-3 shadow-sm animate-fadein">
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center flex-shrink-0">
                      <Icon name="error" className="text-[24px]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-extrabold text-red-900">
                          PERINGATAN: MASA BERLAKU SIM TELAH HABIS!
                        </h4>
                        <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full">
                          EXPIRED
                        </span>
                      </div>
                      <p className="text-[12px] text-red-800 mt-1 font-medium leading-relaxed">
                        Dokumen <strong>{simType}</strong> {simNo ? `(${simNo})` : ""} Anda telah kedaluwarsa pada <strong>{expiryDate || "tanggal yang ditentukan"}</strong>. Mohon segera lakukan perpanjangan SIM dan hubungi admin atau GA/HRD untuk memperbarui data lisensi Anda.
                      </p>
                    </div>
                  </div>
                );
              }

              if (simStatus === "expiring_soon") {
                return (
                  <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-start gap-3 shadow-sm animate-fadein">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Icon name="warning" className="text-[24px]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-extrabold text-amber-900">
                          PERINGATAN MASA BERLAKU SIM (H-30)
                        </h4>
                        <span className="text-[10px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                          {daysLeft !== null && daysLeft !== undefined ? `${daysLeft} Hari Tersisa` : "Segera Habis"}
                        </span>
                      </div>
                      <p className="text-[12px] text-amber-800 mt-1 font-medium leading-relaxed">
                        Masa berlaku <strong>{simType}</strong> {simNo ? `(No: ${simNo})` : ""} Anda akan segera berakhir pada <strong>{expiryDate}</strong> ({daysLeft !== null && daysLeft !== undefined ? `${daysLeft} hari lagi` : "kurang dari 30 hari"}). Harap segera persiapkan proses perpanjangan SIM.
                      </p>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Hero current assignment */}
            {currentTrip ? (
              <div data-guide="driver-task-card" className="relative bg-[#0f1f3d] rounded-2xl p-6 sm:p-7 overflow-hidden text-white shadow-lg">
                <div className="absolute right-0 top-0 w-64 h-64 bg-[#1e3a8a]/30 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
                <div className="absolute right-20 bottom-0 w-40 h-40 bg-[#1e3a8a]/20 rounded-full translate-y-1/2 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 bg-[#1a2d4f] border border-[#2a4a7f] text-white text-[11px] font-bold px-3 py-1.5 rounded-full">
                      <span className={`w-2 h-2 rounded-full ${heroStatus?.color}`} />
                      {heroStatus?.label}
                    </div>

                    <div>
                      <h2 className="text-[28px] font-extrabold leading-tight">{currentTrip.employee || "Staff"}</h2>
                      <div className="text-[11px] font-bold text-[#8ca3c4] uppercase tracking-widest mt-0.5">
                        {currentTrip.department || "Internal Staff"}
                      </div>
                    </div>

                    <div className="bg-[#1a2d4f]/60 border border-[#2a4a7f] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="location_on" className="text-[14px]" />
                          Destination
                        </div>
                        <div className="text-[14px] font-bold truncate max-w-[150px]" title={displayDestination}>
                          {displayDestination}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="schedule" className="text-[14px]" />
                          Departure
                        </div>
                        <div className="text-[14px] font-bold">{displayTime}</div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#8ca3c4] uppercase tracking-wider mb-1">
                          <Icon name="group" className="text-[14px]" />
                          Passengers
                        </div>
                        <div className="text-[14px] font-bold">{currentTrip.passengerCount || 1} Person</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end justify-between h-full gap-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#8ca3c4] font-bold">
                        Ref: #REQ-{currentTrip.id}
                      </span>
                      <button
                        onClick={() => handleViewDetail(String(currentTrip.id))}
                        className="text-[11px] font-bold text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg cursor-pointer transition-all hover:underline"
                      >
                        View Detail
                      </button>
                    </div>

                    {["driver_assigned", "pending", "on_going"].includes(driverTripStatus || "") && currentTrip.qr_code_token && (
                      <div 
                        onClick={() => setZoomedQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${currentTrip.qr_code_token}`)}`)}
                        className="bg-white p-2.5 rounded-xl border border-slate-700 shadow-sm flex flex-col items-center cursor-zoom-in hover:border-blue-500 transition-all hover:scale-105"
                        title="Klik untuk memperbesar"
                      >
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`${window.location.origin}/security/dashboard?token=${currentTrip.qr_code_token}`)}`}
                          alt="Security Scan QR"
                          className="w-[80px] h-[80px] object-contain"
                        />
                        <span className="text-[8px] font-mono font-bold text-slate-500 mt-1">
                          {currentTrip.qr_code_token}
                        </span>
                      </div>
                    )}

                    {(driverTripStatus === "driver_assigned" || driverTripStatus === "pending") && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="info" className="text-[15px] text-blue-400" />
                        <span className="font-semibold text-blue-300">Tunjukkan QR Code di samping ke Security saat berangkat</span>
                      </div>
                    )}

                    {driverTripStatus === "on_going" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="info" className="text-[15px] text-green-400 animate-pulse" />
                        <span className="font-semibold text-green-300">Tunjukkan QR Code di samping ke Security saat kembali</span>
                      </div>
                    )}

                    {driverTripStatus === "completed" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-emerald-950/60 border border-emerald-500/50 px-3.5 py-2 rounded-xl max-w-xs">
                        <Icon name="check_circle" className="text-[15px] text-emerald-400 animate-bounce" />
                        <span className="font-semibold text-emerald-300">Perjalanan Anda telah selesai</span>
                      </div>
                    )}

                    {currentTrip.rawStatus === "waiting_driver" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl">
                        <Icon name="hourglass_empty" className="text-[15px] text-amber-400 animate-spin" />
                        <span className="font-semibold text-amber-300">Menunggu konfirmasi tugas driver</span>
                      </div>
                    )}

                    {currentTrip.rawStatus === "assigned_by_ga" && (
                      <div className="flex items-center gap-2 text-[#e2e8f0] text-[12px] bg-[#1a2d4f]/60 border border-[#2a4a7f] px-3.5 py-2 rounded-xl">
                        <Icon name="hourglass_empty" className="text-[15px] text-blue-400 animate-pulse" />
                        <span className="font-semibold text-blue-300">Menunggu persetujuan akhir Head HRD & GA</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#0f1f3d] rounded-2xl p-6 sm:p-7 text-white text-center shadow-lg relative overflow-hidden">
                <Icon name="commute" className="text-[48px] text-white/30 mb-2" />
                <h3 className="text-[16px] font-bold">Tidak ada Perjalanan Aktif</h3>
                <p className="text-[12.5px] text-white/60 mt-1 max-w-sm mx-auto">
                  Belum ada penugasan yang perlu dimulai. Terima tugas baru dari daftar di bawah untuk memulai trip.
                </p>
              </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "Rating Rata-rata Saya", value: `${driverAvgRating} ⭐`, icon: "star", bg: "bg-amber-50", color: "text-amber-600" },
                { label: "Trip Selesai (Total)", value: String(totalCompletedCount).padStart(2, "0"), icon: "task_alt", bg: "bg-[#f0fdf4]", color: "text-[#16a34a]" },
                { label: "Jadwal Mendatang", value: String(upcomingCount).padStart(2, "0"), icon: "calendar_month", bg: "bg-[#eff6ff]", color: "text-[#2563eb]" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[12px] text-[#64748b] font-medium mb-1">{s.label}</div>
                    <div className="text-2xl font-bold text-[#0f172a]">{s.value}</div>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <Icon name={s.icon} className={`text-[20px] ${s.color}`} />
                  </div>
                </div>
              ))}
            </div>

            {/* 1. Daftar Tugas Baru (PRIORITAS UTAMA DRIVER) */}
            <div data-guide="driver-assignment" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[17px] font-bold text-[#0f172a]">Daftar Tugas Baru</div>
                  <div className="text-[13px] text-[#64748b]">Terima atau tolak penugasan kendaraan operasional</div>
                </div>
                {pendingAssignments.length > 0 && (
                  <button
                    onClick={() => setActiveNav("My Assignments")}
                    className="text-[13px] font-semibold text-[#1e3a8a] hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Lihat Semua
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </button>
                )}
              </div>

              {pendingAssignments.length === 0 ? (
                <div className="bg-white border border-[#e2e8f0] rounded-2xl py-10 flex flex-col items-center shadow-2xs">
                  <Icon name="check_circle" className="text-[36px] text-green-500 mb-2" />
                  <p className="font-bold text-[#0f172a] text-[14px]">Semua tugas baru telah diproses</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pendingAssignments.slice(0, 2).map((req) => (
                    <RequestCard
                      key={req.id} req={req}
                      onApprove={handleApproveClick}
                      onReject={handleReject}
                      onViewDetail={handleViewDetail}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 2. Rating & Anonymous Reviews Section (Dibatasi 2 ulasan awal + Tombol Lihat Semua) */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a]">Performa & Ulasan Pelayanan</h3>
                    <p className="text-xs text-slate-500">Evaluasi dari perjalanan dinas (Identitas pemohon dirahasiakan)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <span className="text-amber-500 font-black text-sm">{"★".repeat(Math.min(5, Math.max(1, Math.round(Number(driverAvgRating)))))}</span>
                  <span className="text-xs font-black text-amber-900">{driverAvgRating} / 5.0 ({ratedCount} Ulasan)</span>
                </div>
              </div>

              {ratedTrips.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-semibold border border-dashed rounded-xl border-slate-200">
                  Belum ada ulasan yang masuk dari perjalanan dinas.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${showAllReviews ? 'max-h-96 overflow-y-auto pr-1 scrollbar-none' : ''}`}>
                    {(showAllReviews ? ratedTrips : ratedTrips.slice(0, 2)).map((r: any, idx: number) => (
                      <div key={r.id || idx} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-amber-500 font-extrabold text-sm">
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                            <span className="text-xs text-slate-700 font-bold ml-1">({r.rating}/5)</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">
                            {r.rated_at ? new Date(r.rated_at).toLocaleDateString('id-ID') : r.date || 'Tugas Perjalanan'}
                          </span>
                        </div>
                        {r.rating_notes || r.ratingNotes ? (
                          <p className="text-xs text-slate-700 font-medium italic bg-white p-2.5 rounded-lg border border-slate-200/60">
                            "{r.rating_notes || r.ratingNotes}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">"Tidak ada catatan ulasan tambahan."</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider pt-1 border-t border-slate-200/40">
                          <span className="truncate max-w-[180px]">Tujuan: {r.destination}</span>
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-extrabold shrink-0">Anonim (Penumpang)</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {ratedTrips.length > 2 && (
                    <button
                      type="button"
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#1e3a8a] flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-98"
                    >
                      <span>{showAllReviews ? "Sembunyikan Ulasan" : `Lihat Semua Ulasan (${ratedTrips.length})`}</span>
                      <Icon name={showAllReviews ? "expand_less" : "expand_more"} className="text-base" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }

      case "My Tasks":
      case "My Assignments":
      case "Pending Requests":
        return (
          <MyAssignmentsPage
            pendingAssignments={pendingAssignments}
            activeAssignments={activeAssignments}
            onApprove={handleApproveClick}
            onReject={handleReject}
            onViewDetail={handleViewDetail}
            onStartTrip={(reqId) => {
              setConfirmModal({
                isOpen: true,
                type: "start",
                targetId: reqId,
              });
            }}
            onCompleteTrip={(reqId) => {
              setConfirmModal({
                isOpen: true,
                type: "complete",
                targetId: reqId,
              });
            }}
          />
        );

      case "My Vehicle":
        return (
          <VehiclePage
            vehicles={mappedVehicles}
            onSelectVehicle={handleSelectVehicle}
            selectedAssignmentId={selectedAssignmentForAccept?.id}
            selectedAssignmentRef={selectedAssignmentForAccept?.reqId}
          />
        );

      case "History":
      case "My Schedule":
      case "Schedule":
        return <TripSchedulePage trips={historyTrips} onViewDetail={handleViewDetail} />;

      case "Calendar":
        return <CalendarView events={calendarEvents} onViewDetail={handleViewDetail} />;

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (activeNav) {
      case "My Vehicle":
        return "Select Vehicle";
      case "History":
      case "My Schedule":
      case "Schedule":
        return "History";
      case "My Tasks":
      case "My Assignments":
      case "Pending Requests":
        return "My Tasks";
      case "Calendar":
        return "Calendar";
      default:
        return "Driver Portal";
    }
  };

  return (
    <Layout
      activeNav={activeNav}
      onNavigate={(nav) => {
        if (nav === "Dashboard") setSearchParams({});
        else if (nav === "My Vehicle") setSearchParams({ tab: "vehicle" });
        else if (nav === "History" || nav === "My Schedule") setSearchParams({ tab: "schedule" });
        else if (nav === "Calendar") setSearchParams({ tab: "calendar" });
        else if (nav === "My Tasks" || nav === "My Assignments" || nav === "Pending Requests") setSearchParams({ tab: "assignments" });
        else setActiveNav(nav);
      }}
      topbarTitle={getTitle()}
      userName={user?.name || "Driver"}
      userRole="Driver"
    >
      <div className="min-h-full bg-[#f8f9ff]">
        {renderActiveTabContent()}
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadein">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-[#e2e8f0] shadow-2xl flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f1f5f9] flex justify-between items-center bg-[#f8fafc] flex-shrink-0">
              <h3 className="text-[15px] font-bold text-[#0f172a]">
                {confirmModal.type === "start" && "Mulai Perjalanan"}
                {confirmModal.type === "complete" && "Selesaikan Perjalanan"}
                {confirmModal.type === "reject" && "Tolak Penugasan"}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: "start", targetId: "" })}
                className="text-[#94a3b8] hover:text-[#64748b] cursor-pointer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-[#475569]">
                {confirmModal.type === "start" && "Apakah Anda yakin ingin memulai perjalanan operasional ini?"}
                {confirmModal.type === "complete" && "Apakah Anda yakin telah menyelesaikan perjalanan operasional ini?"}
                {confirmModal.type === "reject" && "Silakan masukkan alasan penolakan tugas berikut:"}
              </p>

              {confirmModal.type === "reject" && (
                <div>
                  <textarea
                    required
                    value={confirmModal.rejectReason || ""}
                    onChange={(e) => setConfirmModal(prev => ({ ...prev, rejectReason: e.target.value }))}
                    placeholder="Contoh: Kendaraan sedang diservis / sakit..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-xl text-[13px] text-[#0f172a] bg-[#f8fafc] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f1f5f9]">
                <button
                  type="button"
                  onClick={() => setConfirmModal({ isOpen: false, type: "start", targetId: "" })}
                  className="w-full sm:w-auto h-10 px-5 border border-[#e2e8f0] hover:bg-[#f8fafc] rounded-xl text-[12.5px] font-bold text-[#475569] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={actionLoading || (confirmModal.type === "reject" && !confirmModal.rejectReason?.trim())}
                  onClick={async () => {
                    const id = confirmModal.targetId;
                    setActionLoading(true);
                    try {
                      if (confirmModal.type === "start") {
                        await requestService.start(id);
                      } else if (confirmModal.type === "complete") {
                        await requestService.complete(id);
                      } else if (confirmModal.type === "reject") {
                        await assignmentService.respond(id, {
                          response: "rejected",
                          reject_reason: confirmModal.rejectReason,
                        });
                        
                        try {
                          const matchedAsg = rawAssignments.find((a: any) => String(a.id) === String(id));
                          const reqId = matchedAsg?.request?.id || matchedAsg?.request_id || "1";
                          
                          const GAHRD_NOTIFS_KEY = 'ovms_gahrd_notifications';
                          const stored = localStorage.getItem(GAHRD_NOTIFS_KEY);
                          let notifs: any[] = [];
                          if (stored) {
                            try { notifs = JSON.parse(stored); } catch {}
                          }
                          const newNotif = {
                            id: 'NTF-' + Date.now(),
                            category: 'assignment',
                            priority: 'CRITICAL',
                            title: 'Penugasan Ditolak oleh Pengemudi',
                            description: `Driver ${user?.name || 'Driver'} menolak penugasan untuk Request #${reqId}. Alasan: "${confirmModal.rejectReason}"`,
                            time: 'Baru saja',
                            unread: true,
                            requestId: String(reqId),
                          };
                          notifs.unshift(newNotif);
                          localStorage.setItem(GAHRD_NOTIFS_KEY, JSON.stringify(notifs));
                        } catch (notifErr) {
                          console.error("Gagal menyimpan notifikasi penolakan driver:", notifErr);
                        }
                      }
                      setConfirmModal({ isOpen: false, type: "start", targetId: "" });
                      await fetchData();
                    } catch (err: any) {
                      console.error(err);
                      alert(err.response?.data?.message || "Terjadi kesalahan saat memproses aksi.");
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  className={`w-full sm:w-auto h-10 px-6 text-white rounded-xl text-[12.5px] font-bold transition-all disabled:opacity-50 cursor-pointer ${
                    confirmModal.type === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-[#1e3a8a] hover:bg-[#1e40af]"
                  }`}
                >
                  {actionLoading ? "Memproses..." : (
                    confirmModal.type === "start" ? "Mulai" : (
                      confirmModal.type === "complete" ? "Selesaikan" : "Tolak Tugas"
                    )
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRequestForDetail && (
        <RequestDetailModal
          isOpen={!!selectedRequestForDetail}
          onClose={() => setSelectedRequestForDetail(null)}
          request={selectedRequestForDetail}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-3 shadow-lg">
            <div className="w-10 h-10 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin" />
            <p className="text-[13px] text-[#64748b] font-semibold">Memuat detail...</p>
          </div>
        </div>
      )}

      {zoomedQrUrl && (
        <div 
          className="fixed inset-0 bg-black/85 z-[99999] flex flex-col items-center justify-center p-4 cursor-pointer animate-fadein"
          onClick={() => setZoomedQrUrl(null)}
        >
          <div 
            className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center max-w-sm w-full shadow-2xl relative" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setZoomedQrUrl(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <Icon name="close" className="text-2xl" />
            </button>
            <div className="text-[13px] font-extrabold text-[#1e3a8a] mb-4 uppercase tracking-widest text-center mt-2">Pindai QR Code Tiket</div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-[#e2e8f0]">
              <img
                src={zoomedQrUrl}
                alt="Zoomed Ticket QR Code"
                className="w-64 h-64 object-contain"
              />
            </div>
            <div className="text-xs text-slate-400 font-semibold mt-4 text-center">
              Tunjukkan QR Code ini ke Security untuk dipindai saat berangkat/kembali.
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
